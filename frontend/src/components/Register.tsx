import { useState } from 'react'
import './Register.css'

const API_BASE = 'https://api-gateway.sahuankitaofc-1.workers.dev'

interface RegisterProps {
  wallet: string
  onSuccess: () => void
}

export default function Register({ wallet, onSuccess }: RegisterProps) {
  const [apiSecret, setApiSecret] = useState('')
  const [riskLevel, setRiskLevel] = useState('balanced')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          apiSecret,
          riskLevel,
        }),
      })

      const data = await response.json()
      if (data.success) {
        onSuccess()
      } else {
        alert('Registration failed: ' + data.error)
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>🎯 Complete Registration</h2>
        <p>Connect your Hyperliquid account to start AI-powered trading</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Hyperliquid API Secret:</label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter your Hyperliquid API secret"
              required
            />
            <small>Your API secret is stored securely and never shared</small>
          </div>

          <div className="form-group">
            <label>Risk Level:</label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
              <option value="conservative">Conservative (Max 20% per trade)</option>
              <option value="balanced">Balanced (Max 30% per trade)</option>
              <option value="aggressive">Aggressive (Max 50% per trade)</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : '✅ Complete Registration'}
          </button>
        </form>

        <div className="info-box">
          <h3>📊 How It Works:</h3>
          <ul>
            <li>AI analyzes news, orderbook, and technical indicators every 5 minutes</li>
            <li>Trades only when confidence ≥ 65%</li>
            <li>Automatic TP/SL on all positions</li>
            <li>Target: 2%+ monthly returns</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
