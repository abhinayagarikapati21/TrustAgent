import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [formData, setFormData] = useState({
    transaction_id: `TXN-${Math.floor(Math.random() * 1000000)}`,
    user_id: `USR-${Math.floor(Math.random() * 10000)}`,
    amount: 150.00,
    merchant_category: 'Electronics',
    historical_repayment_rate: 0.95,
    account_age_days: 120,
    recent_velocity: 1,
    time_of_day: '14:30 PM'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [typedText, setTypedText] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'amount' || name === 'historical_repayment_rate' || name === 'account_age_days' || name === 'recent_velocity') ? parseFloat(value) : value
    }));
  };

  const generateNewTransaction = () => {
    setFormData(prev => ({
      ...prev,
      transaction_id: `TXN-${Math.floor(Math.random() * 1000000)}`
    }));
    setResult(null);
    setTypedText("");
  };

  const runEvaluation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setTypedText("");
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/v1/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Evaluation failed", error);
      alert('Failed to connect to backend. Is the FastAPI server running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result && result.agent_explanation) {
      let i = 0;
      setTypedText("");
      const text = result.agent_explanation;
      const interval = setInterval(() => {
        setTypedText(text.substring(0, i));
        i++;
        if (i > text.length) clearInterval(interval);
      }, 15);
      return () => clearInterval(interval);
    }
  }, [result]);

  const getStatusClass = (status) => {
    if (status === 'APPROVED') return 'approved text-success';
    if (status === 'REJECTED') return 'rejected text-danger';
    if (status === 'PARTIAL_APPROVAL') return 'partial text-warning';
    return 'manual text-cyan';
  };

  // INTRO SCREEN
  if (!hasStarted) {
    return (
      <div className="intro-container">
        <div className="intro-box">
          <div className="intro-brand">
            <div className="brand-dot"></div>
            TrustAgent Architecture
          </div>
          <h1 className="intro-title">Autonomous Risk Copilot</h1>
          <p className="intro-description">
            TrustAgent is a next-generation underwriting engine designed for complex BNPL environments. It leverages predictive machine learning models and dynamic agentic reasoning to analyze transaction telemetry in real-time.
          </p>
          
          <div className="architecture-grid">
            <div className="arch-card">
              <h3>1. Risk Engine</h3>
              <p>Evaluates transactional velocity, time anomalies, and merchant risk profiles to compute a stringent Probability of Default (PD).</p>
            </div>
            <div className="arch-card">
              <h3>2. Trust Engine</h3>
              <p>Analyzes long-term behavioral index derived from historical repayment consistency and account tenure.</p>
            </div>
            <div className="arch-card">
              <h3>3. LLM Audit Agent</h3>
              <p>Translates complex ML vector output into readable regulatory compliance narratives using Gemini 2.5.</p>
            </div>
          </div>

          <div className="hitl-banner">
            <div style={{fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '8px'}}>⚠️ HUMAN-IN-THE-LOOP (HITL) PARADIGM</div>
            <p>
              TrustAgent operates as an <strong>Assistive Copilot</strong>, not an unconditional authority. While clear-cut cases are auto-routed, ambiguous risk profiles and high-value limits are flagged as <em>"MANUAL_REVIEW"</em>. The system is designed to augment human intuition, ensuring risk exposure is always contained.
            </p>
          </div>

          <button onClick={() => setHasStarted(true)} className="btn-trigger" style={{marginTop: '32px', fontSize: '1.2rem', padding: '18px'}}>
            [ ACCESS UNDERWRITER WORKSPACE ]
          </button>
        </div>
      </div>
    );
  }

  // MAIN WORKSPACE
  return (
    <>
      <div className="top-bar">
        <div className="brand">
          <div className="brand-dot"></div>
          TrustAgent Underwriter Portal
        </div>
        <div className="user-profile">
          <span>Internal Audit & Risk Dept</span>
          <span className="badge">v2.0 Enterprise</span>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Left Side: Telemetry Feed */}
        <div className="panel">
          <div className="panel-header">
            <span>Incoming Telemetry</span>
            <button onClick={generateNewTransaction} style={{background:'none', border:'none', color:'var(--accent-cyan)', cursor:'pointer', fontSize:'0.75rem', fontFamily:'JetBrains Mono'}}>SYNC NEW</button>
          </div>
          
          <form onSubmit={runEvaluation}>
            <div className="input-group">
              <label>Transaction ID</label>
              <input type="text" className="input-block" value={formData.transaction_id} readOnly style={{opacity: 0.5}} />
            </div>

            <div className="input-group">
              <label>Amount (USD)</label>
              <input type="number" name="amount" className="input-block" value={formData.amount} onChange={handleInputChange} min="1" step="any" required />
            </div>

            <div className="input-group">
              <label>Merchant Category</label>
              <select name="merchant_category" className="input-block" value={formData.merchant_category} onChange={handleInputChange}>
                <option value="Electronics">Electronics</option>
                <option value="Apparel">Apparel</option>
                <option value="Grocery">Grocery</option>
                <option value="Crypto">Crypto / High Risk</option>
                <option value="Travel">Travel</option>
              </select>
            </div>

            <div className="input-group">
              <label>Historical Repayment Rate (0.0 - 1.0)</label>
              <input type="number" name="historical_repayment_rate" className="input-block" value={formData.historical_repayment_rate} onChange={handleInputChange} min="0" max="1" step="0.01" required />
            </div>
            
            <div className="input-group" style={{display: 'flex', gap: '10px'}}>
              <div style={{flex: 1}}>
                 <label>Account Age (Days)</label>
                 <input type="number" name="account_age_days" className="input-block" value={formData.account_age_days} onChange={handleInputChange} min="0" required />
              </div>
              <div style={{flex: 1}}>
                 <label>24h Velocity</label>
                 <input type="number" name="recent_velocity" className="input-block" value={formData.recent_velocity} onChange={handleInputChange} min="0" required />
              </div>
            </div>

            <div className="input-group">
              <label>Time of Day</label>
              <input type="text" name="time_of_day" className="input-block" value={formData.time_of_day} onChange={handleInputChange} required />
            </div>

            <button type="submit" className="btn-trigger" disabled={loading}>
              {loading ? '[ PROCESSING... ]' : '[ INITIALIZE AGENT INFERENCE ]'}
            </button>
          </form>
        </div>

        {/* Right Side: Analysis Engine */}
        <div className="panel" style={{display: 'flex', flexDirection: 'column'}}>
          <div className="panel-header">
            <span>Agentic Evaluation Engine</span>
            {result && result.generated_by_llm && <span className="badge">Generative AI Active</span>}
          </div>

          {loading && <div className="loader"></div>}

          {!result && !loading && (
             <div style={{color: 'var(--text-secondary)', textAlign: 'center', marginTop: '100px', fontSize: '0.9rem', fontFamily: 'JetBrains Mono'}}>
                Awaiting telemetry payload...
             </div>
          )}

          {result && !loading && (
            <div style={{animation: 'fadeIn 0.4s ease-out'}}>
              <div className="results-grid">
                
                {/* Risk Card */}
                <div className="data-card">
                  <div className="title">PD (Probability of Default) Model</div>
                  <div className={`value ${result.signals.risk_probability > 0.5 ? 'text-danger' : 'text-success'}`}>
                    {(result.signals.risk_probability * 100).toFixed(1)}%
                  </div>
                  <ul className="data-list">
                    {result.signals.primary_risk_factors.length === 0 ? <li>No significant risk factors</li> : null}
                    {result.signals.primary_risk_factors.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>

                {/* Trust Card */}
                <div className="data-card">
                  <div className="title">Behavioral Trust Index</div>
                  <div className={`value ${result.signals.trust_index > 60 ? 'text-cyan' : 'text-warning'}`}>
                    {result.signals.trust_index} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>/100</span>
                  </div>
                  <ul className="data-list">
                    {result.signals.primary_trust_factors.length === 0 ? <li>No historical trust built</li> : null}
                    {result.signals.primary_trust_factors.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>

              </div>

              {/* Decision Banner */}
              <div className={`decision-banner ${getStatusClass(result.decision.status).split(' ')[0]}`}>
                <div>
                  <div className="decision-title">Policy Decision Output</div>
                  <div className={`decision-status ${getStatusClass(result.decision.status).split(' ')[1]}`}>
                    {result.decision.status}
                  </div>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', marginTop: '4px'}}>
                     REASON_CODE: {result.decision.reasoning_code}
                  </div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div className="decision-title">Approved Limit</div>
                  <div className="decision-status" style={{color: 'var(--text-primary)'}}>
                    ${result.decision.approved_limit.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* LLM Explanation Terminal */}
              <div className="llm-terminal">
                <div className="terminal-header">
                  <span>trust-agent@core-xai:~$ ./explain_decision --txn {result.transaction_id}</span>
                  <span style={{color: result.generated_by_llm ? 'var(--accent-purple)' : 'var(--warning)'}}>
                    {result.generated_by_llm ? 'gemini-2.5-flash loaded' : 'fallback-static loaded'}
                  </span>
                </div>
                <div className="terminal-body">
                  {typedText}<span className="cursor"></span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </>
  );
}

export default App;
