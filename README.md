# RevAgent 📈✨
### *AI‑Driven Revenue Intelligence & Predictive Anomaly Detection*

**RevAgent** is a sophisticated, enterprise‑grade business health platform designed to transform raw financial data into strategic clarity. Built with a focus on both **statistical rigor** and **premium user experience**, RevAgent automates the detection of revenue leaks, marketing inefficiencies, and growth opportunities.

---

## 💎 The Vision

Most business‑intelligence tools are either too simple (static dashboards) or too complex (unreadable spreadsheets). **RevAgent bridges this gap** by combining advanced Python‑based anomaly detection with a world‑class, "Glassmorphic" Next.js interface. It doesn't just show you that a metric changed — it uses AI to explain *why* it happened and *what* to do next.

---

## 🚀 Core Capabilities

- **✨ Intelligence Hub** – A high‑impact "Business Pulse" indicator that provides an instant health score using multi‑vector scoring.
- **🔍 Statistical Anomaly Detection** – Isolation Forest + 3‑σ statistical modeling flags deviations in Revenue, CAC, and Ad‑Spend.
- **🤖 Generative Strategy Reports** – Powered by **Groq‑LLM** (Llama‑3‑70B) to turn raw variances into human‑readable executive summaries and concrete action plans.
- **🎨 Premium Glassmorphic UI** – Light‑mode, translucent cards, subtle indigo glows, and responsive Recharts visualizations.
- **⚡ Instant Exploration** – "Demo Mode" loads high‑fidelity synthetic data for stakeholder demos without any backend setup.
- **🧭 Dual Analysis Modes** –
  - **Recent Issues** (last 14 days) – surface short‑term leaks.
  - **Historical** (90+ days) – uncover slow‑burn problems.
- **🚨 Active Intelligence Alerts** – Ranked by severity **HIGH / MEDIUM** with colour‑coded cards.
- **🔎 Root‑Cause Analysis** – Each anomaly is explained with contributing factors and recommended remediation steps.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React, TailwindCSS, Recharts |
| **Backend** | Python (FastAPI) |
| **ML / Detection** | scikit‑learn (Isolation Forest), SciPy (3‑σ) |
| **AI / LLM** | Groq API – Llama‑3‑70B |
| **Styling** | Glassmorphism design system |

---

## 📁 Project Structure

```
revagent/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── anomaly_detector.py  # Isolation Forest + 3-σ logic
│   ├── groq_client.py       # LLM strategy report generation
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # UI components (cards, charts, alerts)
│   ├── lib/                 # API helpers & demo data
│   └── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Groq API key](https://console.groq.com/)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/revagent.git
cd revagent
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the API server:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Demo Mode:** Click "Load Demo Data" on the dashboard to explore RevAgent with synthetic data — no backend required.

---

## 🔬 How the Detection Works

1. **Data Ingestion** – Upload a CSV with columns: `date`, `revenue`, `cac`, `ad_spend` (and optionally `conversions`, `churn_rate`).
2. **Isolation Forest** – Unsupervised ML model scores each data point for anomalousness across all metric dimensions simultaneously.
3. **3‑σ Rule** – A secondary statistical pass flags any metric that deviates more than three standard deviations from its rolling mean.
4. **Severity Ranking** – Anomalies are ranked **HIGH** (both models agree) or **MEDIUM** (single model flag).
5. **LLM Narration** – Flagged anomalies are passed to Llama‑3‑70B with business context, producing a plain‑English executive summary and a prioritised action plan.

---

## 📊 Expected CSV Format

```csv
date,revenue,cac,ad_spend,conversions,churn_rate
2024-01-01,52000,120,8000,430,0.02
2024-01-02,48000,135,9500,390,0.025
...
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss your proposed change, then submit a pull request.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with ❤️ for revenue clarity.</p>
