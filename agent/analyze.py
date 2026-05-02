"""
RevAgent analysis engine — Multi-LLM Support
=============================================
Provider cascade (PROVIDER = "auto"):
  1. Groq   — llama-3.1-8b-instant  (fast, free tier)
  2. OpenAI — gpt-4o-mini           (reliable fallback)
  3. Mock   — deterministic rules   (offline safety net)

Set PROVIDER to "groq", "openai", or "mock" to force a single
provider, or keep "auto" for the full cascade.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from time import sleep
from typing import Any
import json
import os

import pandas as pd
from dotenv import load_dotenv

from agent.ingest import run_ingest
from agent.detect import run_detect_mode


PROVIDER = "auto"  # options: "auto" | "groq" | "openai" | "mock"

PROCESSED_DIR = Path("data/processed")
LATEST_REPORT_PATH = PROCESSED_DIR / "latest_report.json"
REPORT_HISTORY_PATH = PROCESSED_DIR / "report_history.jsonl"

VALID_MODES = ["recent_issues", "historical_patterns"]

MODE_REPORT_LABELS = {
    "recent_issues": "Recent Issues",
    "historical_patterns": "Historical Patterns",
}

OUTPUT_SCHEMA = {
    "summary": "One sentence. Most important thing happening right now.",
    # "changes": [
    #     {
    #         "metric": "net_revenue",
    #         "direction": "down",
    #         "magnitude": "-28%",
    #         "period": "last 7 days",
    #     }

    "changes": [
    {
        "metric": "net_revenue",
        "direction": "down",
        "magnitude": "-28%",
        "period": "analysis period",
    }
    ],
    "drivers": [
        {
            "hypothesis": "Plain English explanation of likely cause",
            "confidence": "high",
            "supporting_metrics": ["net_revenue", "refund_rate"],
            "evidence": "Specific numbers from the data",
        }
    ],
    "actions": [
        {
            "action": "Specific thing founder should do",
            "owner": "founder / marketing / product / ops",
            "urgency": "now",
            "expected_impact": "What fixing this should change",
        }
    ],
    "watch_list": [
        {
            "metric": "CAC",
            "reason": "Why to watch this next",
        }
    ],
    "provider_used": "groq",
    "mode_used": "recent_issues",
    "report_type": "Recent Issues",
}

BASE_SYSTEM_PROMPT = """
You are an expert startup operating analyst. You analyze business
metrics and anomalies for founders. You are direct and precise.

Key principles:
- Each anomaly represents a multi-day business EVENT, not a single spike.
- Use event durations (event_duration_days) in your reasoning.
- Prioritize cross-metric relationships (e.g. refund_rate rising while net_revenue drops).
- Avoid generic explanations. Be specific to the data provided.
- Think causally: which metric likely caused which.

You always respond in valid JSON only. No preamble. No markdown.
No explanation outside the JSON object.
""".strip()


def _safe_float(value: Any, default: float = 0.0) -> float:
    """
    Safely convert a value to float.
    """
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_magnitude(change_pct: Any) -> str:
    """
    Convert a numeric percentage value to a display magnitude string.
    """
    value = round(_safe_float(change_pct, 0.0))
    return f"{value:+.0f}%"


def _dedupe_anomalies_by_metric(anomalies: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Keep only the strongest anomaly per metric.
    """
    best_by_metric: dict[str, dict[str, Any]] = {}

    for anomaly in anomalies:
        metric = anomaly.get("metric")
        if not metric:
            continue

        current_best = best_by_metric.get(metric)
        if current_best is None or abs(_safe_float(anomaly.get("change_pct"))) > abs(
            _safe_float(current_best.get("change_pct"))
        ):
            best_by_metric[metric] = anomaly

    ordered = list(best_by_metric.values())
    ordered.sort(
        key=lambda x: (
            {"high": 3, "medium": 2, "low": 1}.get(x.get("severity", "low"), 1),
            abs(_safe_float(x.get("change_pct"))),
        ),
        reverse=True,
    )
    return ordered



def group_anomalies_for_llm(anomalies: list[dict]) -> list[dict]:
    """
    Group compressed anomaly events by metric for LLM summary.
    """
    if not anomalies:
        return []

    bucket = {}

    for a in anomalies:
        metric = a["metric"]
        bucket.setdefault(metric, []).append(a)

    rows = []

    for metric, items in bucket.items():
        worst = max(items, key=lambda x: abs(float(x["change_pct"])))

        avg_change = sum(float(x["change_pct"]) for x in items) / len(items)
        total_duration = sum(int(x.get("event_duration_days", 1)) for x in items)

        rows.append(
            {
                "metric": metric,
                "anomaly_days": total_duration,
                "worst_change_pct": round(float(worst["change_pct"]), 2),
                "avg_change_pct": round(avg_change, 2),
                "first_flagged": min(x["event_start"] for x in items),
                "last_flagged": max(x["event_end"] for x in items),
                "direction": worst["direction"],
                "event_duration_days": total_duration,
            }
        )

    rows = sorted(
        rows,
        key=lambda x: abs(float(x["worst_change_pct"])),
        reverse=True
    )[:6]

    return rows

def build_historical_summary_from_grouped(anomalies: list[dict[str, Any]]) -> str:
    """
    Build a safe fallback summary for historical pattern mode using grouped anomalies.
    """
    grouped = group_anomalies_for_llm(anomalies)
    if not grouped:
        return "No significant historical anomaly patterns were found across the full dataset period."

    top = grouped[0]
    metric = top.get("metric", "unknown_metric")
    direction = top.get("direction", "down")
    anomaly_days = top.get("anomaly_days", 0)
    first_flagged = top.get("first_flagged", "unknown")
    last_flagged = top.get("last_flagged", "unknown")
    worst_change = top.get("worst_change_pct", 0)

    return (
        f"{metric} showed the strongest historical pattern, moving {direction} "
        f"{_safe_magnitude(worst_change)} across {anomaly_days} flagged days "
        f"between {first_flagged} and {last_flagged}."
    )


def build_prompt(
    anomalies: list[dict[str, Any]],
    recent_metrics_df: pd.DataFrame,
    mode: str = "recent_issues",
) -> tuple[str, str]:
    """
    Build the system and user prompts for the LLM.
    """
    today = datetime.now().strftime("%Y-%m-%d")
    recent_metrics_markdown = recent_metrics_df.to_markdown(index=False)

    if mode == "historical_patterns":
        anomaly_payload = group_anomalies_for_llm(anomalies)
        mode_instruction = (
            "This is a full-dataset historical pattern analysis. "
            "Each anomaly below is a compressed multi-day business event with event_duration_days. "
            "Focus on recurring patterns and structural trends across the full dataset period. "
            "Identify which metrics showed the most persistent problems. "
            "Look for cross-metric causal chains (e.g. rising refund_rate driving net_revenue decline). "
            "Use event durations to distinguish short spikes from sustained structural shifts. "
            "Do not describe results as recent or last 7 days unless explicitly present in the data."
        )
    else:
        anomaly_payload = anomalies
        mode_instruction = (
            "Focus on what needs immediate attention. "
            "Each anomaly may span multiple days (check event_duration_days if present). "
            "Explain cross-metric relationships where visible. "
            "Be specific about recent changes and their business impact."
        )

    system_prompt = f"""{BASE_SYSTEM_PROMPT}

{mode_instruction}
""".strip()

    user_prompt = f"""
Today's date: {today}

Analysis mode: {mode}

Anomalies detected (each is a business event, not a single data point):
{json.dumps(anomaly_payload, indent=2)}

Last 14 days of key metrics (markdown table):
{recent_metrics_markdown}

Produce a business intelligence report in this exact JSON format:
{json.dumps(OUTPUT_SCHEMA, indent=2)}

Rules:
- changes: one entry per anomaly metric, include event duration if available
- drivers: 2 to 3 hypotheses ranked by confidence — explain causal links between metrics
- actions: 3 to 5 actions, urgency = now / this_week / monitor
- confidence = high / medium / low
- watch_list: 2 to 3 metrics not already flagged, with forward-looking reasoning
- Use plain founder-friendly English
- Reference event durations and cross-metric patterns in your reasoning
- For historical_patterns mode, describe structural patterns across the full dataset period
- For historical_patterns mode, do not say "recent" or "last 7 days"
- respond with JSON only, nothing else
""".strip()

    return system_prompt, user_prompt




def _metric_driver(metric: str) -> tuple[str, str, list[str]]:
    """
    Return deterministic driver text for a metric.
    """
    mapping = {
        "net_revenue": (
            "Revenue decline may be driven by reduced conversions or increased refund activity",
            "high",
            ["net_revenue", "refund_rate"],
        ),
        "refund_rate": (
            "Elevated refund rate suggests product quality issues or customer expectation mismatch",
            "high",
            ["refund_rate", "net_revenue"],
        ),
        "CAC": (
            "Rising CAC indicates ad spend efficiency has dropped or audience targeting needs review",
            "medium",
            ["CAC", "conversion_rate"],
        ),
        "churn_rate": (
            "Increasing churn suggests retention or onboarding issues need investigation",
            "medium",
            ["churn_rate", "net_revenue"],
        ),
    }
    return mapping.get(
        metric,
        (
            "Metric deviation warrants closer review",
            "low",
            [metric],
        ),
    )


def _metric_action(metric: str) -> dict[str, str]:
    """
    Return deterministic action mapping for a metric.
    """
    mapping = {
        "net_revenue": {
            "action": "Review last 7 days of transactions for failed payments or refund spikes",
            "owner": "founder",
            "urgency": "now",
            "expected_impact": "Should identify whether the revenue drop is operational, payment-related, or demand-related",
        },
        "refund_rate": {
            "action": "Pull refund reason categories from payment processor and identify top reason",
            "owner": "ops",
            "urgency": "now",
            "expected_impact": "Should isolate the main source of margin leakage and reduce repeat refunds",
        },
        "CAC": {
            "action": "Pause lowest-performing ad sets and reallocate to best-performing campaigns",
            "owner": "marketing",
            "urgency": "this_week",
            "expected_impact": "Should improve ad efficiency and reduce wasted spend",
        },
        "churn_rate": {
            "action": "Contact churned customers from last 14 days for exit feedback",
            "owner": "founder",
            "urgency": "this_week",
            "expected_impact": "Should reveal retention issues and improve onboarding or product messaging",
        },
    }
    return mapping.get(
        metric,
        {
            "action": f"Monitor {metric} daily for next 7 days",
            "owner": "founder",
            "urgency": "monitor",
            "expected_impact": f"Should confirm whether {metric} is stabilizing or worsening",
        },
    )


def _build_duration_label(anomaly: dict[str, Any]) -> str:
    """Build a human-readable duration label from event fields."""
    duration = int(anomaly.get("event_duration_days", 1))
    start = anomaly.get("event_start", anomaly.get("date", ""))
    end = anomaly.get("event_end", anomaly.get("date", ""))
    if duration > 1 and start and end:
        return f"{duration}-day event ({start} -> {end})"
    if start:
        return f"on {start}"
    return "recent period"


def _build_cross_metric_insight(anomalies: list[dict[str, Any]]) -> str | None:
    """Detect cross-metric causal patterns and return an insight string."""
    metrics_present = {a.get("metric") for a in anomalies}

    if "refund_rate" in metrics_present and "net_revenue" in metrics_present:
        return (
            "Refund rate increase is likely compressing net revenue — "
            "the two metrics are moving in opposing directions during overlapping periods, "
            "suggesting a direct causal link through margin erosion."
        )
    if "CAC" in metrics_present and "net_revenue" in metrics_present:
        return (
            "Rising customer acquisition cost combined with declining revenue "
            "indicates a unit economics squeeze — each new customer costs more "
            "while generating less return."
        )
    if "churn_rate" in metrics_present and "net_revenue" in metrics_present:
        return (
            "Elevated churn combined with revenue decline suggests a retention-driven "
            "revenue problem — existing customers are leaving faster than new ones arrive."
        )
    if "CAC" in metrics_present and "churn_rate" in metrics_present:
        return (
            "Rising acquisition cost alongside increasing churn creates a compounding "
            "growth problem — the business is paying more for customers who stay shorter."
        )
    return None


def call_mock(anomalies: list[dict[str, Any]], mode: str = "recent_issues") -> dict[str, Any]:
    """
    Build a deterministic mock report directly from anomalies.
    Duration-aware with cross-metric causal reasoning.
    """
    anomalies = _dedupe_anomalies_by_metric(anomalies)

    if not anomalies:
        return {
            "summary": "No significant anomalies detected in this analysis window.",
            "changes": [],
            "drivers": [],
            "actions": [],
            "watch_list": [],
            "provider_used": "mock",
            "mode_used": mode,
            "report_type": MODE_REPORT_LABELS.get(mode, "Recent Issues"),
        }

    top = anomalies[0]
    top_duration = int(top.get("event_duration_days", 1))
    duration_qualifier = (
        f"over a {top_duration}-day period" if top_duration > 1 else "in a single-day spike"
    )
    summary = (
        f"{top['metric']} moved {top['direction']} {_safe_magnitude(top['change_pct'])} "
        f"{duration_qualifier} — "
    )
    if len(anomalies) > 1:
        other_metrics = [a["metric"] for a in anomalies[1:3]]
        summary += f"coinciding with pressure on {' and '.join(other_metrics)}. Immediate review recommended."
    else:
        summary += "immediate investigation required."

    changes: list[dict[str, Any]] = []
    drivers: list[dict[str, Any]] = []
    actions: list[dict[str, Any]] = []

    for anomaly in anomalies:
        metric = anomaly.get("metric", "unknown_metric")
        direction = anomaly.get("direction", "down")
        duration = int(anomaly.get("event_duration_days", 1))
        duration_label = _build_duration_label(anomaly)

        period = (
            f"last 7 days ({duration_label})"
            if mode == "recent_issues"
            else f"full dataset period ({duration_label})"
        )

        changes.append({
            "metric": metric,
            "direction": direction,
            "magnitude": _safe_magnitude(anomaly.get("change_pct", 0)),
            "period": period,
        })

        if len(drivers) < 3:
            hypothesis, confidence, supporting_metrics = _metric_driver(metric)
            current_val = anomaly.get("current_value", "N/A")
            mean_val = anomaly.get("rolling_mean", "N/A")
            evidence = (
                f"{metric} reached {current_val} vs rolling mean of {mean_val} "
                f"({_safe_magnitude(anomaly.get('change_pct', 0))} deviation"
            )
            if duration > 1:
                evidence += f", sustained over {duration} days"
            evidence += ")"
            drivers.append({
                "hypothesis": hypothesis,
                "confidence": confidence,
                "supporting_metrics": supporting_metrics,
                "evidence": evidence,
            })

        if len(actions) < 4:
            actions.append(_metric_action(metric))

    # Inject cross-metric causal driver if detected
    cross_insight = _build_cross_metric_insight(anomalies)
    if cross_insight and len(drivers) < 3:
        flagged_metrics = [a.get("metric", "") for a in anomalies[:2]]
        drivers.insert(0, {
            "hypothesis": cross_insight,
            "confidence": "high",
            "supporting_metrics": flagged_metrics,
            "evidence": "Correlated movement across metrics during overlapping event windows",
        })
        drivers = drivers[:3]

    actions.append({
        "action": "Monitor conversion_rate daily for next 7 days",
        "owner": "founder",
        "urgency": "monitor",
        "expected_impact": "Should confirm whether traffic quality is contributing to revenue pressure",
    })

    watch_list: list[dict[str, Any]] = []
    if len(anomalies) > 1:
        second_metric = anomalies[1].get("metric")
        reason_map = {
            "refund_rate": "Continued rise could compress margins further and erode unit economics",
            "net_revenue": "Further decline would confirm a structural issue, not an isolated event",
            "CAC": "Rising acquisition costs amplify revenue pressure — watch for sustained drift",
            "churn_rate": "Elevated churn compounds revenue loss and signals deeper retention issues",
        }
        watch_list.append({
            "metric": second_metric,
            "reason": reason_map.get(second_metric, f"{second_metric} needs continued observation"),
        })

    watch_list.append({
        "metric": "conversion_rate",
        "reason": "Conversion rate bridges ad spend efficiency to revenue — early warning signal for demand shifts",
    })

    return {
        "summary": summary,
        "changes": changes,
        "drivers": drivers[:3],
        "actions": actions[:5],
        "watch_list": watch_list[:3],
        "provider_used": "mock",
        "mode_used": mode,
        "report_type": MODE_REPORT_LABELS.get(mode, "Recent Issues"),
    }


def call_groq(system_prompt: str, user_prompt: str) -> str | None:
    """
    Call Groq chat completions and return raw response text.
    """
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        print("WARNING: GROQ_API_KEY not found in .env.")
        return None

    try:
        from groq import Groq
    except ImportError:
        print("WARNING: groq package not installed.")
        return None

    client = Groq(api_key=api_key)

    for attempt in range(2):
        try:
            print("Calling Groq API (llama-3.1-8b-instant)...")
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                temperature=0.2,
                max_tokens=1500,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            print("Groq response received.")
            return response.choices[0].message.content or ""
        except Exception as exc:
            message = str(exc)
            is_rate_limit = "429" in message or "rate limit" in message.lower()
            if is_rate_limit and attempt == 0:
                print("WARNING: Groq rate limit hit. Waiting 5s and retrying...")
                sleep(5)
                continue
            print(f"WARNING: Groq call failed ({exc}).")
            return None

    return None


def call_openai(system_prompt: str, user_prompt: str) -> str | None:
    """
    Call OpenAI chat completions (gpt-4o-mini) and return raw response text.
    """
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print("WARNING: OPENAI_API_KEY not found in .env.")
        return None

    try:
        from openai import OpenAI
    except ImportError:
        print("WARNING: openai package not installed.")
        return None

    client = OpenAI(api_key=api_key)

    for attempt in range(2):
        try:
            print("Calling OpenAI API (gpt-4o-mini)...")
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.2,
                max_tokens=1500,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            print("OpenAI response received.")
            return response.choices[0].message.content or ""
        except Exception as exc:
            message = str(exc)
            is_rate_limit = "429" in message or "rate limit" in message.lower()
            if is_rate_limit and attempt == 0:
                print("WARNING: OpenAI rate limit hit. Waiting 5s and retrying...")
                sleep(5)
                continue
            print(f"WARNING: OpenAI call failed ({exc}).")
            return None

    return None


def call_llm(
    system_prompt: str,
    user_prompt: str,
    anomalies: list[dict[str, Any]],
    mode: str = "recent_issues",
) -> tuple[str | dict[str, Any] | None, str]:
    """
    Unified LLM router with cascading fallback.

    Returns:
        (raw_result, provider_used)

    Cascade order when PROVIDER="auto":
        Groq -> OpenAI -> mock
    """
    provider = os.getenv("REVAGENT_PROVIDER", PROVIDER).lower().strip()

    # Direct provider selection
    if provider == "groq":
        result = call_groq(system_prompt, user_prompt)
        if result is not None:
            return result, "groq"
        print("Groq failed -> falling back to mock.")
        return _mock_fallback(anomalies, mode), "mock"

    if provider == "openai":
        result = call_openai(system_prompt, user_prompt)
        if result is not None:
            return result, "openai"
        print("OpenAI failed -> falling back to mock.")
        return _mock_fallback(anomalies, mode), "mock"

    if provider == "mock":
        return _mock_fallback(anomalies, mode), "mock"

    # Auto cascade: Groq -> OpenAI -> mock
    print("LLM cascade: trying Groq...")
    result = call_groq(system_prompt, user_prompt)
    if result is not None:
        return result, "groq"

    print("LLM cascade: trying OpenAI...")
    result = call_openai(system_prompt, user_prompt)
    if result is not None:
        return result, "openai"

    print("LLM cascade: all providers failed -> mock.")
    return _mock_fallback(anomalies, mode), "mock"


def _mock_fallback(
    anomalies: list[dict[str, Any]], mode: str
) -> dict[str, Any]:
    """Prepare mock fallback result from anomalies."""
    deduped = _dedupe_anomalies_by_metric(anomalies)
    cap = 4 if mode == "recent_issues" else 6
    return call_mock(deduped[:cap], mode=mode)


def enforce_report_schema(
    report: dict[str, Any],
    anomalies: list[dict[str, Any]],
    mode: str = "recent_issues",
) -> dict[str, Any]:
    """
    Enforce required schema and backfill missing content from anomalies.
    """
    anomalies = _dedupe_anomalies_by_metric(anomalies)

    required_defaults = {
        "summary": "",
        "changes": [],
        "drivers": [],
        "actions": [],
        "watch_list": [],
    }
    for key, default in required_defaults.items():
        if key not in report or report[key] is None:
            report[key] = default

    if "provider_used" not in report or not report["provider_used"]:
        report["provider_used"] = PROVIDER

    report["mode_used"] = mode
    report["report_type"] = MODE_REPORT_LABELS.get(mode, "Recent Issues")

    if not isinstance(report["changes"], list):
        report["changes"] = []
    if not isinstance(report["drivers"], list):
        report["drivers"] = []
    if not isinstance(report["actions"], list):
        report["actions"] = []
    if not isinstance(report["watch_list"], list):
        report["watch_list"] = []

    existing_change_metrics = {
        item.get("metric")
        for item in report["changes"]
        if isinstance(item, dict) and item.get("metric")
    }

    for anomaly in anomalies:
        metric = anomaly.get("metric")

        if metric not in existing_change_metrics:
            report["changes"].append(
            {
                "metric": metric,
                "direction": anomaly.get("direction", "down"),
                "magnitude": _safe_magnitude(anomaly.get("change_pct", 0)),
                "period": "last 7 days" if mode == "recent_issues" else "full dataset period",
            }
        )

    if not str(report.get("summary", "")).strip() and anomalies:
        top = anomalies[0]
        report["summary"] = (
            f"{top['metric']} is {top['direction']} {_safe_magnitude(top['change_pct'])} "
            f"— immediate investigation required."
        )

    if len(report["drivers"]) < 2:
        existing_driver_metrics = set()
        for driver in report["drivers"]:
            if isinstance(driver, dict):
                for metric in driver.get("supporting_metrics", []):
                    existing_driver_metrics.add(metric)

        for anomaly in anomalies:
            metric = anomaly.get("metric", "unknown_metric")
            if metric in existing_driver_metrics:
                continue
            hypothesis, confidence, supporting_metrics = _metric_driver(metric)
            evidence = f"{metric} at {anomaly.get('current_value')}, mean was {anomaly.get('rolling_mean')}"
            report["drivers"].append(
                {
                    "hypothesis": hypothesis,
                    "confidence": confidence,
                    "supporting_metrics": supporting_metrics,
                    "evidence": evidence,
                }
            )
            if len(report["drivers"]) >= 3:
                break

    if len(report["actions"]) < 3:
        existing_action_text = {
            item.get("action")
            for item in report["actions"]
            if isinstance(item, dict) and item.get("action")
        }
        for anomaly in anomalies:
            action = _metric_action(anomaly.get("metric", "unknown_metric"))
            if action["action"] not in existing_action_text:
                report["actions"].append(action)
                existing_action_text.add(action["action"])
            if len(report["actions"]) >= 4:
                break

        monitor_action = {
            "action": "Monitor conversion_rate daily for next 7 days",
            "owner": "founder",
            "urgency": "monitor",
            "expected_impact": "Should confirm whether traffic quality is contributing to revenue pressure",
        }
        if (
            len(report["actions"]) < 5
            and monitor_action["action"] not in existing_action_text
        ):
            report["actions"].append(monitor_action)

    if len(report["watch_list"]) < 2:
        existing_watch_metrics = {
            item.get("metric")
            for item in report["watch_list"]
            if isinstance(item, dict) and item.get("metric")
        }

        if len(anomalies) > 1:
            second_metric = anomalies[1].get("metric")
            if second_metric not in existing_watch_metrics:
                reason_map = {
                    "refund_rate": "Continued rise could compress margins further",
                    "net_revenue": "Further decline would confirm the issue is not isolated",
                    "CAC": "Movement here will show whether acquisition efficiency is changing",
                    "churn_rate": "A rise would indicate retention pressure beyond this incident",
                }
                report["watch_list"].append(
                    {
                        "metric": second_metric,
                        "reason": reason_map.get(second_metric, f"{second_metric} needs continued observation"),
                    }
                )
                existing_watch_metrics.add(second_metric)

        if "conversion_rate" not in existing_watch_metrics:
            report["watch_list"].append(
                {
                    "metric": "conversion_rate",
                    "reason": "Conversion rate connects ad spend efficiency to revenue",
                }
            )

    report["drivers"] = report["drivers"][:3]
    report["actions"] = report["actions"][:5]
    report["watch_list"] = report["watch_list"][:3]

    return report



def parse_response(
    raw_text: str | dict[str, Any] | None,
    anomalies: list[dict[str, Any]],
    mode: str = "recent_issues",
) -> dict[str, Any]:
    """
    Parse and validate report output.
    """
    if isinstance(raw_text, dict):
        report = raw_text
    elif raw_text is None:
        report = call_mock(anomalies, mode=mode)
    else:
        cleaned = raw_text.strip()

        if cleaned.startswith("```json"):
            cleaned = cleaned[7:].strip()
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:].strip()

        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()

        try:
            report = json.loads(cleaned)
        except json.JSONDecodeError:
            print("WARNING: Failed to parse provider JSON. Raw output below:")
            print(raw_text)
            report = call_mock(anomalies, mode=mode)

    if not isinstance(report, dict):
        report = call_mock(anomalies, mode=mode)

    report = enforce_report_schema(report, anomalies, mode=mode)

    if mode == "historical_patterns":
        summary_text = str(report.get("summary", "")).lower()
        if "last 7 days" in summary_text or "recent" in summary_text:
            report["summary"] = build_historical_summary_from_grouped(anomalies)

        for change in report.get("changes", []):
            if isinstance(change, dict):
                period_text = str(change.get("period", "")).lower()
                if "last 7 days" in period_text or "recent" in period_text:
                    change["period"] = "full dataset period"

    return report


def save_report(report: dict[str, Any]) -> None:
    """
    Save latest JSON report and append to JSONL history.
    """
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    with open(LATEST_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    history_record = dict(report)
    history_record["generated_at"] = datetime.now().isoformat(timespec="seconds")

    with open(REPORT_HISTORY_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(history_record, ensure_ascii=False) + "\n")

    print("Report saved -> data/processed/latest_report.json")


def print_report(report: dict[str, Any]) -> None:
    """
    Print formatted report to terminal.
    """
    generated = datetime.now().strftime("%Y-%m-%d")
    provider = report.get("provider_used", PROVIDER)
    mode_used = report.get("mode_used", "recent_issues")

    title = (
        "=== HISTORICAL PATTERNS REPORT ==="
        if mode_used == "historical_patterns"
        else "=== RECENT ISSUES REPORT ==="
    )

    print(f"\n{title}")
    print(f"Provider: {provider} | Generated: {generated}")
    print()

    print("SUMMARY")
    print(report.get("summary", ""))
    print()

    print("WHAT CHANGED")
    for change in report.get("changes", []):
        print(
            f"- {change.get('metric', '')}: "
            f"{change.get('direction', '')} "
            f"{change.get('magnitude', '')} "
            f"({change.get('period', '')})"
        )
    print()

    print("WHY IT HAPPENED")
    for driver in report.get("drivers", []):
        confidence = str(driver.get("confidence", "low")).upper()
        print(f"[{confidence}]   {driver.get('hypothesis', '')}")
        print(f"         Evidence: {driver.get('evidence', '')}")
        print()

    print("PRIORITY ACTIONS")
    for action in report.get("actions", []):
        urgency = str(action.get("urgency", "monitor")).replace("_", " ").upper()
        print(f"[{urgency}]  {action.get('action', '')} -> Owner: {action.get('owner', '')}")
    print()

    print("WATCH NEXT")
    for item in report.get("watch_list", []):
        print(f"- {item.get('metric', '')}: {item.get('reason', '')}")

    print("\n================================")


def run_analyze(mode: str = "recent_issues") -> dict[str, Any] | None:
    """
    Main analysis orchestrator.

    Args:
        mode: "recent_issues" | "historical_patterns"

    Returns:
        dict[str, Any] | None: Final report or None on upstream failure.
    """
    if mode not in VALID_MODES:
        print(
            f"WARNING: Unknown mode '{mode}'. "
            "Defaulting to 'recent_issues'."
        )
        mode = "recent_issues"

    try:
        df = run_ingest()
        anomalies = run_detect_mode(mode)
    except Exception as exc:
        print(f"ERROR: Failed to load context from ingest/detect ({exc})")
        return None

    if not anomalies:
        print("No anomalies. No report.")
        return None

    recent_metrics_df = df[
        [
            "date",
            "net_revenue",
            "refund_rate",
            "CAC",
            "churn_rate",
            "conversion_rate",
            "total_spend",
        ]
    ].tail(14).copy()

    if mode == "recent_issues":
        anomalies_for_prompt = _dedupe_anomalies_by_metric(anomalies)[:4]
    else:
        anomalies_for_prompt = anomalies

    system_prompt, user_prompt = build_prompt(
        anomalies_for_prompt,
        recent_metrics_df,
        mode=mode,
    )

    raw_result, provider_used = call_llm(
        system_prompt, user_prompt,
        anomalies=anomalies_for_prompt,
        mode=mode,
    )
    print(f"Provider used: {provider_used}")

    report = parse_response(raw_result, anomalies_for_prompt, mode=mode)
    report["provider_used"] = provider_used
    save_report(report)
    print_report(report)
    return report


if __name__ == "__main__":
    run_analyze()