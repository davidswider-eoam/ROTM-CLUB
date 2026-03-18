import { useState } from 'react'
import { supabase } from './supabase'
import { Sparkles, Loader2 } from 'lucide-react'
import logo from './assets/logo.png'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: 'var(--surface)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <img src={logo} alt="ROTM Club" style={{ height: 64, marginBottom: 16 }} />
        <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>ROTM Club</div>
        <div style={{ color: 'var(--text3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Sparkles size={12} /> Staff Access Only
        </div>
      </div>

      <form onSubmit={handleLogin} style={{ 
        width: '100%', 
        maxWidth: 320, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16 
      }}>
        <div>
          <input
            className="form-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <input
            className="form-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        {error && (
          <div style={{ 
            color: 'var(--red)', 
            fontSize: 12, 
            background: '#fee2e2', 
            padding: '8px 12px', 
            borderRadius: 6 
          }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : 'Sign In'}
        </button>
      </form>
      
      <div style={{ marginTop: 32, fontSize: 11, color: 'var(--text3)' }}>
        Restricted System · End of All Music
      </div>
    </div>
  )
}
