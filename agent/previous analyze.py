"""
Loads RevAgent context, sends anomalies + recent metrics to Claude,
parses the JSON response, saves the report, and prints a founder-friendly summary.
"""

from __future__ import annotations

from pathlib import Path
from datetime import datetime
import json
from typing import Any

import pandas as pd
from dotenv import load_dotenv
import os

from anthropic import Anthropic

from agent.ingest import run_ingest
from agent.detect import run_detect


PROCESSED_DIR = Path("data/processed")
LATEST_REPORT_FILE = PROCESSED_DIR / "latest_report.json"
REPORT_HISTORY_FILE = PROCESSED_DIR / "report_history.jsonl"


def load_context() -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    """
    Run ingest and detect to get the latest metrics dataframe and anomaly list.

    Returns:
        tuple[pd.DataFrame, list[dict[str, Any]]]:
            Full metrics dataframe and anomaly list.
    """
    df = run_ingest()
    anomalies = run_detect()
    return df, anomalies


def build_prompt(
    anomalies: list[dict[str, Any]],
    recent_metrics_df: pd.DataFrame,
) -> tuple[str, str]:
    """
    Build the system prompt and user prompt for Claude.

    Args:
        anomalies: Sorted anomaly list from detect.py.
        recent_metrics_df: Last 30 rows of metrics data.

    Returns:
        tuple[str, str]: (system_prompt, user_prompt)
    """
    system_prompt = """
You are an expert startup operating analyst with deep experience
in SaaS and DTC business metrics. You are direct, precise, and
founder-friendly. You never speculate wildly — you form hypotheses
grounded in the data provided. You always respond in valid JSON only.
No preamble. No explanation outside the JSON.
""".strip()

    def dataframe_to_markdown(df: pd.DataFrame) -> str:
        display_df = df.copy()

        for col in display_df.columns:
            if pd.api.types.is_datetime64_any_dtype(display_df[col]):
                display_df[col] = display_df[col].dt.strftime("%Y-%m-%d")
            elif pd.api.types.is_float_dtype(display_df[col]):
                display_df[col] = display_df[col].round(4)

        headers = list(display_df.columns)
        lines = [
            "| " + " | ".join(headers) + " |",
            "| " + " | ".join(["---"] * len(headers)) + " |",
        ]

        for row in display_df.itertuples(index=False, name=None):
            lines.append("| " + " | ".join(str(x) for x in row) + " |")

        return "\n".join(lines)

    today = datetime.now().strftime("%Y-%m-%d")
    recent_metrics_markdown = dataframe_to_markdown(recent_metrics_df)

    user_prompt = f"""
Today's date: {today}

ANOMALIES DETECTED (sorted by severity):
{json.dumps(anomalies, indent=2)}

LAST 30 DAYS OF BUSINESS METRICS:
{recent_metrics_markdown}

Based on the anomalies and metrics above, produce a business intelligence
report in the following exact JSON format:

{{
  "summary": "One sentence. What is the most important thing happening
              in this business right now.",

  "changes": [
    {{
      "metric": "net_revenue",
      "direction": "down",
      "magnitude": "-28%",
      "period": "last 7 days"
    }}
  ],

  "drivers": [
    {{
      "hypothesis": "Clear plain-English explanation of likely cause",
      "confidence": "high",
      "supporting_metrics": ["net_revenue", "refund_rate"],
      "evidence": "Specific numbers from the data that support this"
    }}
  ],

  "actions": [
    {{
      "action": "Specific thing the founder should do",
      "owner": "founder / marketing / product / ops",
      "urgency": "now",
      "expected_impact": "What fixing this should change"
    }}
  ],

  "watch_list": [
    {{
      "metric": "CAC",
      "reason": "Why to watch this metric next"
    }}
  ]
}}

Rules:
- changes: list every anomaly metric, one entry per metric
- drivers: 2 to 4 hypotheses maximum, ranked by confidence
- actions: 3 to 5 actions maximum, sorted by urgency (now first)
- urgency must be one of: now / this_week / monitor
- confidence must be one of: high / medium / low
- watch_list: 2 to 3 metrics to monitor going forward
- Use plain founder-friendly English. No jargon.
- Only respond with the JSON object. Nothing else.
""".strip()

    return system_prompt, user_prompt


def call_claude(system_prompt: str, user_prompt: str) -> str | None:
    """
    Call the Claude API and return the raw text response.

    Args:
        system_prompt: System prompt string.
        user_prompt: User prompt string.

    Returns:
        str | None: Raw text response, or None if the call failed.
    """
    load_dotenv()
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not found in .env")
        return None

    try:
        client = Anthropic(api_key=api_key)

        print("Calling Claude API...")
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": user_prompt,
                }
            ],
        )
        print("Response received.")

        parts: list[str] = []
        for block in response.content:
            text_value = getattr(block, "text", None)
            if text_value:
                parts.append(text_value)

        return "\n".join(parts).strip()

    except Exception as exc:
        print(f"ERROR calling Claude API: {exc}")
        return None


def parse_response(raw_text: str) -> dict[str, Any] | str:
    """
    Parse the raw Claude response as JSON.

    Strips accidental markdown fences before parsing. If parsing fails,
    prints the raw response and returns the raw string.

    Args:
        raw_text: Raw text returned by Claude.

    Returns:
        dict[str, Any] | str: Parsed JSON dict, or raw string on parse failure.
    """
    cleaned = raw_text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[7:].strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:].strip()

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        print("ERROR: Failed to parse JSON response. Raw response below:")
        print(raw_text)
        return raw_text


def save_report(report: dict[str, Any]) -> None:
    """
    Save the parsed report to latest_report.json and append it to report_history.jsonl.

    Adds a generated_at timestamp to the history entry.

    Args:
        report: Parsed report dictionary.
    """
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    with open(LATEST_REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    history_record = {
        **report,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
    }

    with open(REPORT_HISTORY_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(history_record, ensure_ascii=False) + "\n")

    print("Report saved to data/processed/latest_report.json")


def print_report(report: dict[str, Any]) -> None:
    """
    Print the parsed report in a formatted terminal layout.

    Args:
        report: Parsed report dictionary.
    """
    generated = datetime.now().strftime("%Y-%m-%d")

    print("\n================================")
    print("REVAGENT DAILY REPORT")
    print(f"Generated: {generated}")
    print("================================\n")

    print("SUMMARY")
    print(report.get("summary", "No summary available."))
    print()

    print("WHAT CHANGED")
    for item in report.get("changes", []):
        metric = item.get("metric", "unknown_metric")
        direction = item.get("direction", "unknown_direction")
        magnitude = item.get("magnitude", "unknown_magnitude")
        period = item.get("period", "unknown_period")
        print(f"- {metric}: {direction} {magnitude} ({period})")
    print()

    print("WHY IT HAPPENED (drivers)")
    for driver in report.get("drivers", []):
        confidence = str(driver.get("confidence", "low")).upper()
        hypothesis = driver.get("hypothesis", "No hypothesis provided.")
        evidence = driver.get("evidence", "No evidence provided.")
        print(f"[{confidence}] {hypothesis}")
        print(f"      Evidence: {evidence}")
    print()

    print("WHAT TO DO")
    for action in report.get("actions", []):
        urgency = str(action.get("urgency", "monitor")).replace("_", " ").upper()
        action_text = action.get("action", "No action provided.")
        owner = action.get("owner", "unknown")
        print(f"[{urgency}] {action_text} → Owner: {owner}")
    print()

    print("WATCH NEXT")
    for item in report.get("watch_list", []):
        metric = item.get("metric", "unknown_metric")
        reason = item.get("reason", "No reason provided.")
        print(f"- {metric}: {reason}")
    print("\n================================")


def run_analyze() -> dict[str, Any] | None:
    """
    Run the full AI analysis workflow.

    Returns:
        dict[str, Any] | None:
            Parsed report dict on success, None if skipped or failed.
    """
    df, anomalies = load_context()

    if not anomalies:
        print("No anomalies detected. No report generated.")
        print("No anomalies to analyze. Skipping.")
        return None

    recent_metrics = df.tail(30).copy()

    system_prompt, user_prompt = build_prompt(anomalies, recent_metrics)
    raw_text = call_claude(system_prompt, user_prompt)

    if raw_text is None:
        return None

    parsed = parse_response(raw_text)

    if not isinstance(parsed, dict):
        return None

    save_report(parsed)
    print_report(parsed)
    return parsed


if __name__ == "__main__":
    run_analyze()