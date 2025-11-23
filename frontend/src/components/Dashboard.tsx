import { useState, useEffect } from 'react'
import './Dashboard.css'

const API_BASE = 'https://api-gateway.sahuankitaofc-1.workers.dev'

interface DashboardProps {
  wallet: string
}

export default function Dashboard({ wallet }: DashboardProps) {
  const [positions, setPositions] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [performance, setPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [wallet])

  const loadData = async () => {
    try {
      // Load positions
      const posResponse = await fetch(`${API_BASE}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      })
      const posData = await posResponse.json()
      setPositions(posData.positions || [])

      // Load history
      const histResponse = await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      })
      const histData = await histResponse.json()
      setHistory(histData.history || [])

      // Load performance
      const month = new Date().toISOString().slice(0, 7)
      const perfResponse = await fetch(`${API_BASE}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, month }),
      })
      const perfData = await perfResponse.json()
      setPerformance(perfData.performance)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Monthly Return</h3>
          <div className="stat-value">{performance?.returnPct || '0%'}</div>
          <div className="stat-label">{performance?.status || 'Initializing'}</div>
        </div>
        
        <div className="stat-card">
          <h3>Win Rate</h3>
          <div className="stat-value">{performance?.winRate || '0%'}</div>
          <div className="stat-label">{performance?.wins || 0}W / {performance?.losses || 0}L</div>
        </div>
        
        <div className="stat-card">
          <h3>Total PnL</h3>
          <div className="stat-value">${performance?.totalPnl || '0.00'}</div>
          <div className="stat-label">{performance?.totalTrades || 0} trades</div>
        </div>
        
        <div className="stat-card">
          <h3>Open Positions</h3>
          <div className="stat-value">{positions.length}</div>
          <div className="stat-label">Active trades</div>
        </div>
      </div>

      <div className="positions-section">
        <h2>📊 Open Positions</h2>
        {positions.length === 0 ? (
          <div className="empty-state">No open positions. AI will trade when confidence ≥ 65%</div>
        ) : (
          <div className="positions-table">
            <table>
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Side</th>
                  <th>Size</th>
                  <th>Entry</th>
                  <th>TP</th>
                  <th>SL</th>
                  <th>PnL</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.id}>
                    <td>{pos.coin}</td>
                    <td className={pos.side}>{pos.side}</td>
                    <td>{pos.size}</td>
                    <td>${pos.entry_price}</td>
                    <td>${pos.tp_price}</td>
                    <td>${pos.sl_price}</td>
                    <td className={parseFloat(pos.pnl) >= 0 ? 'positive' : 'negative'}>
                      ${pos.pnl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="history-section">
        <h2>📜 Trade History</h2>
        {history.length === 0 ? (
          <div className="empty-state">No trade history yet</div>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Coin</th>
                  <th>Side</th>
                  <th>Size</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>PnL</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map((trade) => (
                  <tr key={trade.id}>
                    <td>{new Date(trade.timestamp * 1000).toLocaleDateString()}</td>
                    <td>{trade.coin}</td>
                    <td className={trade.side}>{trade.side}</td>
                    <td>{trade.size}</td>
                    <td>${trade.entry_price}</td>
                    <td>${trade.tp_price || '-'}</td>
                    <td className={parseFloat(trade.pnl) >= 0 ? 'positive' : 'negative'}>
                      ${trade.pnl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
