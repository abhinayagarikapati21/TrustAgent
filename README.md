# TrustAgent: Enterprise AI Underwriting Copilot

**🌍 Live Web Demo:** https://trust-agent-tau.vercel.app/

TrustAgent is an autonomous decision-making engine designed to augment risk and underwriting operations in Buy Now, Pay Later (BNPL) ecosystems. It implements a multi-layer evaluation pipeline combining predictive modeling, behavioral heuristics, and Generative AI to provide real-time, explainable credit decisions.

## 🧠 System Architecture

The core architecture operates on a Human-in-the-Loop (HITL) paradigm, ensuring risk exposure is actively contained while automating low-risk approvals and evident rejections.

1. **Risk Engine (Predictive):** Computes extreme Probability of Default (PD) by analyzing transactional velocity, time-of-day anomalies, and merchant ecosystem risk.
2. **Trust Engine (Heuristic):** Evaluates user reliability based on account tenure and historical repayment consistency.
3. **Policy Engine (Deterministic):** Overlays hard business logic (e.g., maximum cap rules) onto the resulting AI vectors.
4. **Agentic Explainer (Generative AI):** Translates raw telemetry and model outputs into a compliant, natural-language underwriting narrative using Google's `gemini-2.5-flash` model.

## 🛠️ Technology Stack
* **Frontend:** React + Vite (Vanilla CSS Enterprise UI)
* **Backend:** FastAPI (Python)
* **AI Model:** Google Gemini API (`google-generativeai`)

---

## 🚀 Running Locally

### 1. Setup Backend (FastAPI Engine)
Navigate to the backend directory and install the required dependencies:
```bash
cd backend
pip install -r requirements.txt
```

**Configure AI:**
Duplicate the `.env.example` (or create a `.env` file) inside the `backend/` folder and add your Gemini key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

**Start the Inference Server:**
```bash
uvicorn main:app --reload --port 8000
```
*(The backend will now be actively listening on http://localhost:8000)*

### 2. Setup Frontend (Underwriter Dashboard)
Open a new terminal window, navigate to the frontend directory, and run the development server:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser to access the Underwriter Portal.
