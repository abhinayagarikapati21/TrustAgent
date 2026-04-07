import os
import random
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("TrustAgent")

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Using the latest model architecture supported by the 2026 API Key
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None
    logger.warning("GEMINI_API_KEY not found. Explanation Brain will run in fallback simulation mode.")

app = FastAPI(title="TrustAgent Enterprise Architecture", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === DTOs (Data Transfer Objects) === #

class TransactionPayload(BaseModel):
    transaction_id: str = Field(..., description="Unique ID for the transaction")
    user_id: str = Field(..., description="Unique ID for the user")
    amount: float = Field(..., gt=0, description="Transaction amount in USD")
    merchant_category: str = Field(..., description="Category of the merchant")
    
    # Behavioral features
    historical_repayment_rate: float = Field(..., ge=0, le=1)
    account_age_days: int = Field(..., ge=0)
    recent_velocity: int = Field(..., description="Number of transactions in last 24h")
    time_of_day: str = Field(..., description="Time of day string (e.g. '03:00 AM')")

class BrainSignals(BaseModel):
    risk_probability: float
    trust_index: int
    primary_risk_factors: List[str]
    primary_trust_factors: List[str]

class AgentDecision(BaseModel):
    status: str
    approved_limit: float
    reasoning_code: str

class EvaluationResponse(BaseModel):
    transaction_id: str
    signals: BrainSignals
    decision: AgentDecision
    agent_explanation: str
    generated_by_llm: bool

# === Enterprise Brain Modules === #

class RiskEngine:
    """Simulates a predictive ML model (e.g. XGBoost) calculating Probability of Default (PD)."""
    @staticmethod
    def evaluate(data: TransactionPayload) -> Dict[str, Any]:
        # Feature interactions simulating a non-linear model
        risk = 0.1
        factors = []
        
        if data.recent_velocity > 3:
            risk += 0.3
            factors.append("High transaction velocity (Velocity Anomaly)")
            
        if "AM" in data.time_of_day and int(data.time_of_day.split(":")[0]) < 6:
            risk += 0.2
            factors.append("Unusual purchase temporal pattern (Time Anomaly)")
            
        if data.merchant_category.lower() in ["crypto", "gambling", "gift cards"]:
            risk += 0.4
            factors.append("High-risk merchant category")
            
        final_risk = min(risk + random.uniform(-0.05, 0.05), 0.99)
        return {"score": max(0.01, round(final_risk, 3)), "factors": factors}

class TrustEngine:
    """Evaluates long-term behavioral heuristics and historical reliability."""
    @staticmethod
    def evaluate(data: TransactionPayload) -> Dict[str, Any]:
        trust = 50 # Base trust
        factors = []
        
        if data.historical_repayment_rate > 0.9:
            trust += 30
            factors.append(f"Excellent repayment history ({data.historical_repayment_rate*100}%)")
        elif data.historical_repayment_rate < 0.5:
            trust -= 40
            factors.append("Poor historical repayment rate")
            
        if data.account_age_days > 365:
            trust += 20
            factors.append("Tenured account (>1 year)")
            
        final_trust = max(0, min(100, int(trust + random.uniform(-5, 5))))
        return {"score": final_trust, "factors": factors}

class PolicyDecisionEngine:
    """Applies hard business rules overlaying the ML risk and heuristic trust scores."""
    @staticmethod
    def decide(amount: float, risk: float, trust: int) -> Dict[str, Any]:
        if risk > 0.75:
            return {"status": "REJECTED", "limit": 0.0, "code": "R-100-HIGH-RISK"}
        elif risk > 0.4 and trust > 70:
            return {"status": "PARTIAL_APPROVAL", "limit": amount * 0.5, "code": "P-200-MITIGATED"}
        elif risk < 0.3 and trust > 50:
            return {"status": "APPROVED", "limit": amount, "code": "A-300-CLEAR"}
        else:
            return {"status": "MANUAL_REVIEW", "limit": 0.0, "code": "M-400-AMBIGUOUS"}

class LLMExplanationAgent:
    """Uses GenAI to construct a human-readable, compliance-ready narrative based on raw ML signals."""
    @staticmethod
    def generate_explanation(data: TransactionPayload, risk_data: Dict, trust_data: Dict, decision_data: Dict) -> str:
        if not model:
            return "Fallback Mode: API Key missing. Transaction was processed based on standard risk/trust matrices."
            
        prompt = f"""
        You are 'TrustAgent', an elite, professional AI underwriting assistant for a major Buy Now, Pay Later (BNPL) company.
        Your job is to generate a concise, professional explanation for a credit decision.
        Analyze the following telemetry:
        
        - Requested Amount: ${data.amount}
        - Merchant: {data.merchant_category}
        - Risk Score (Probability of Default): {(risk_data['score'] * 100):.1f}%
        - Risk Factors Detected: {', '.join(risk_data['factors']) if risk_data['factors'] else 'None'}
        - Trust Score (Behavioral Index): {trust_data['score']}/100
        - Trust Factors Detected: {', '.join(trust_data['factors']) if trust_data['factors'] else 'None'}
        
        Final System Decision: {decision_data['status']}
        Approved Limit: ${decision_data['limit']}
        
        Write a 2-3 sentence technical but readable summary explaining EXACTLY why this decision was made. 
        Adopt a highly professional, clinical tone suitable for an internal auditor or underwriter dashboard. 
        Do not use conversational filler (e.g., "Sure, here is the explanation"). Output only the explanation.
        """
        
        try:
            logger.info("Calling Gemini API for Explanation Brain...")
            response = model.generate_content(prompt)
            return response.text.replace("\n", " ").strip()
        except Exception as e:
            logger.error(f"Gemini API Error: {str(e)}")
            return f"Error generating explanation: {str(e)}"

# === API Endpoints === #

@app.post("/api/v1/evaluate", response_model=EvaluationResponse)
async def evaluate_transaction(payload: TransactionPayload):
    logger.info(f"Processing transaction ID: {payload.transaction_id}")
    
    # 1. Run inference
    risk_result = RiskEngine.evaluate(payload)
    trust_result = TrustEngine.evaluate(payload)
    
    # 2. Apply Policy Engine
    decision_result = PolicyDecisionEngine.decide(
        payload.amount, 
        risk_result["score"], 
        trust_result["score"]
    )
    
    # 3. Generate Agent Explanation
    explanation = LLMExplanationAgent.generate_explanation(
        payload, risk_result, trust_result, decision_result
    )
    
    return EvaluationResponse(
        transaction_id=payload.transaction_id,
        signals=BrainSignals(
            risk_probability=risk_result["score"],
            trust_index=trust_result["score"],
            primary_risk_factors=risk_result["factors"],
            primary_trust_factors=trust_result["factors"]
        ),
        decision=AgentDecision(
            status=decision_result["status"],
            approved_limit=decision_result["limit"],
            reasoning_code=decision_result["code"]
        ),
        agent_explanation=explanation,
        generated_by_llm=(model is not None)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
