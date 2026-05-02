# RevAgent 📈🤖

**RevAgent** is an intelligent, AI-powered business health dashboard designed for founders, marketing teams, and executives. It ingests your raw business metrics (Revenue, Ad Spend, and Traffic), detects statistical anomalies, and generates high-level AI insights explaining exactly what changed and what actions you should take next.

---

## ✨ Features

- **Automated Metric Ingestion**: Upload your Revenue, Ad Spend, and Traffic CSVs and RevAgent will align, normalize, and process them instantly.
- **Statistical Anomaly Detection**: Built with Pandas and Scikit-learn to calculate rolling means, standard deviations, and detect severe outliers in your business performance.
- **AI Analyst Reports**: Integrates with Groq's high-speed LLMs to write clear, actionable reports explaining *why* an anomaly occurred and *who* needs to fix it.
- **Premium Glassmorphism Dashboard**: A state-of-the-art Next.js frontend with stunning typography, glowing gradient borders, and smooth micro-animations.
- **Instant Demo Mode**: Use the "Load Sample Data" option to instantly view a realistic, populated dashboard without needing a running backend.

---

## 🛠️ Technology Stack

### Frontend (Dashboard)
- **Framework**: Next.js 16 (App Router), React
- **Styling**: Tailwind CSS (Premium Glassmorphism, Dark Mode)
- **Data Fetching**: React Query (@tanstack/react-query)
- **Charts**: Recharts (Responsive, custom-styled tooltips)

### Backend (AI Engine)
- **API Framework**: FastAPI (Python)
- **Data Processing**: Pandas, NumPy
- **Anomaly Detection**: Scikit-learn (Isolation Forest), Statistical Modeling
- **LLM Integration**: Groq API, LangChain

---

## 🚀 Getting Started

### 1. View the Live Demo
You can view the fully styled, interactive frontend here: 
**[RevAgent on Vercel](https://rev-agent.vercel.app/)**
*(Note: Click "Load Sample Data" to bypass the backend and view the dashboard instantly).*

### 2. Run Locally

#### Prerequisites
- Node.js (v18+)
- Python 3.10+
- A Groq API Key

#### Setup the Frontend
```bash
cd revagent-ui
npm install
npm run dev
```
The dashboard will be available at `http://localhost:3000`.

#### Setup the Backend
```bash
# In the root directory
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Set your Groq API Key
export GROQ_API_KEY="your-api-key-here"

# Start the FastAPI Server
uvicorn api.main:app --reload
```
The AI engine will run on `http://localhost:8000`.

---

## 📁 Project Structure

```text
revagent/
├── agent/                  # Python AI logic (detection, analysis, generation)
├── api/                    # FastAPI endpoints and models
├── data/                   # Raw and processed CSV/JSON data storage
├── revagent-ui/            # Next.js React Frontend
│   ├── src/app/            # App router pages and layouts
│   ├── src/components/     # Dashboard cards, charts, and layout elements
│   └── src/lib/            # API client and TypeScript interfaces
└── scratch/                # Synthetic data generation scripts
```

---

## 💡 Why RevAgent?

As a technical professional with expertise in Full-Stack Engineering, Data Science, and GenAI, I built RevAgent to demonstrate the powerful intersection of **Machine Learning** and **Beautiful Product Design**. 

Too often, powerful data scripts live in boring Jupyter Notebooks. RevAgent takes robust statistical analysis and wraps it in an elegant, enterprise-grade Next.js SaaS dashboard—bridging the gap between raw data and actionable human insight.
