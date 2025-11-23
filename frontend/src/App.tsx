import { useState, useEffect } from 'react'
import { ConnectButton, useActiveAccount } from 'thirdweb/react'
import { createThirdwebClient } from 'thirdweb'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import './App.css'

const client = createThirdwebClient({
  clientId: '4aca81d6c4f68d811ab5bb6122fe0af4',
  })

const API_BASE = 'https://api-gateway.sahuankitaofc-1.workers.dev'

function App() {
  const account = useActiveAccount()
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (account?.address) {
      checkRegistration()
    } else {
      setLoading(false)
      setIsRegistered(false)
    }
  }, [account?.address])

  const checkRegistration = async () => {
    try {
      const response = await fetch(`${API_BASE}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: account?.address }),
      })
      const data = await response.json()
      setIsRegistered(data.success)
    } catch (error) {
      console.error('Check registration error:', error)
      setIsRegistered(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <header>
        <h1>🚀 Hyperliquid AI Trader</h1>
        <ConnectButton client={client} />
      </header>

      {!account ? (
        <div className="welcome">
          <h2>Connect Your Wallet to Get Started</h2>
          <p>AI-powered trading with 2%+ monthly returns target</p>
        </div>
      ) : loading ? (
        <div className="loading">Loading...</div>
      ) : !isRegistered ? (
        <Register wallet={account.address} onSuccess={() => setIsRegistered(true)} />
      ) : (
        <Dashboard wallet={account.address} />
      )}
    </div>
  )
}

export default App
