# RevAgent 📈✨
### *AI-Driven Revenue Intelligence & Predictive Anomaly Detection*

**RevAgent** is a sophisticated, enterprise-grade business health platform designed to transform raw financial data into strategic clarity. Built with a focus on both **statistical rigor** and **premium user experience**, RevAgent automates the detection of revenue leaks, marketing inefficiencies, and growth opportunities.

---

## 💎 The Vision
Most business intelligence tools are either too simple (static dashboards) or too complex (unreadable spreadsheets). **RevAgent bridges this gap** by combining advanced Python-based anomaly detection with a world-class, "Glassmorphic" Next.js interface. It doesn't just show you that a metric changed—it uses AI to explain *why* it happened and *what* to do next.

---

## 🚀 Core Capabilities

- **✨ Intelligence Hub**: A high-impact "Business Pulse" indicator that provides an instant read on overall company health using multi-vector scoring.
- **🔍 Statistical Anomaly Detection**: Leverages Scikit-learn and Pandas to identify deviations in Revenue, CAC, and Ad Spend that fall outside of 3-sigma confidence intervals.
- **🤖 Generative Strategy Reports**: Integrates with **Groq-powered LLMs** to synthesize complex data variances into human-readable executive summaries and action plans.
- **🎨 Premium Glassmorphic UI**: A stunning, light-mode interface featuring translucent surfaces, subtle indigo glows, and responsive Recharts visualizations.
- **⚡ Instant Exploration**: Includes a "Demo Mode" with high-fidelity synthetic data, allowing stakeholders to experience the platform's full power without local backend configuration.

---

## 🛠️ Engineering Stack

### **Frontend Architecture**
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom Glassmorphism & Light Theme)
- **Visualization**: [Recharts](https://recharts.org/) (Custom-themed Intelligence Charts)
- **Icons**: [Lucide React](https://lucide.dev/)

### **Backend & AI Engine**
- **Core API**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Analysis**: [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/), [Scikit-learn](https://scikit-learn.org/)
- **GenAI**: [Groq API](https://groq.com/) (Llama-3-70B)
- **Data Science**: Isolation Forest Anomaly Detection & Statistical Variance Modeling

---

## 🏁 Getting Started

### **1. Rapid Deployment (Frontend Only)**
The frontend is optimized for zero-config exhibition.
```bash
cd revagent-ui
npm install
npm run dev
```
*Navigate to `http://localhost:3000` and select **"Load Sample Data"** for the full experience.*

### **2. Full Pipeline (With AI Engine)**
1. **Set Environment Variables**:
   Create a `.env` file in the root:
   ```env
   GROQ_API_KEY=your_key_here
   ```
2. **Launch the API**:
   ```bash
   pip install -r requirements.txt
   uvicorn api.main:app --reload
   ```

---

## 📂 System Architecture
```text
revagent/
├── agent/                  # Statistical modeling & LLM orchestration
├── api/                    # FastAPI high-performance endpoints
├── revagent-ui/            # Next.js 14 Premium Dashboard
│   ├── src/components/     # Modular Glassmorphic components
│   └── src/app/            # High-performance routing
└── scratch/                # Synthetic data & stress-testing scripts
```

---

## 🤝 Built by a Data-First Engineer
RevAgent was created to showcase the intersection of **Full-Stack Engineering** and **Generative AI**. It demonstrates a commitment to building tools that are not only technically robust but also commercially viable and visually stunning.

**[Live Demo on Vercel](https://rev-agent.vercel.app/)** | **[LinkedIn](https://www.linkedin.com/in/sakshi-malhotra-18/)**
