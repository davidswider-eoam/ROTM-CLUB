import { useState } from 'react'
import { supabase } from './supabase'
import { Sparkles, Loader2, KeyRound, UserPlus, LogIn } from 'lucide-react'
import logo from './assets/logo.png'

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else if (mode === 'signup') {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        if (data.session) {
          setMessage("Account created and signed in successfully!")
        } else {
          setMessage("Account created! Check your email to confirm registration if required.")
        }
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setMessage("Password reset instructions have been sent to your email.")
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      padding: 24,
      background: 'var(--surface)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <img src={logo} alt="ROTM Club" style={{ height: 64, marginBottom: 16 }} />
        <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>ROTM Club</div>
        <div style={{ color: 'var(--text3)', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
          <Sparkles size={12} /> Staff Access Portal
        </div>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 360,
        background: 'var(--surface2)',
        border: '1px solid var(--border2)',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', background: 'var(--surface)', padding: 4, borderRadius: 8, marginBottom: 20, gap: 4 }}>
          <button
            type="button"
            className="filter-btn"
            style={{
              flex: 1,
              fontSize: 11,
              padding: '6px 8px',
              border: 'none',
              background: mode === 'signin' ? 'var(--surface2)' : 'transparent',
              color: mode === 'signin' ? 'var(--text)' : 'var(--text3)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
            onClick={() => { setMode('signin'); setError(null); setMessage(null); }}
          >
            <LogIn size={12} /> Sign In
          </button>

          <button
            type="button"
            className="filter-btn"
            style={{
              flex: 1,
              fontSize: 11,
              padding: '6px 8px',
              border: 'none',
              background: mode === 'signup' ? 'var(--surface2)' : 'transparent',
              color: mode === 'signup' ? 'var(--text)' : 'var(--text3)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
            onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
          >
            <UserPlus size={12} /> Sign Up
          </button>

          <button
            type="button"
            className="filter-btn"
            style={{
              flex: 1,
              fontSize: 11,
              padding: '6px 8px',
              border: 'none',
              background: mode === 'reset' ? 'var(--surface2)' : 'transparent',
              color: mode === 'reset' ? 'var(--text)' : 'var(--text3)',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
            onClick={() => { setMode('reset'); setError(null); setMessage(null); }}
          >
            <KeyRound size={12} /> Reset
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 14 
        }}>
          <div>
            <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="name@theendofallmusic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          )}

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

          {message && (
            <div style={{ 
              color: 'var(--green)', 
              fontSize: 12, 
              background: '#dcfce7', 
              padding: '8px 12px', 
              borderRadius: 6 
            }}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : mode === 'signin' ? (
              'Sign In'
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Send Password Reset Link'
            )}
          </button>
        </form>
      </div>
      
      <div style={{ marginTop: 28, fontSize: 11, color: 'var(--text3)' }}>
        Restricted Staff Portal · The End of All Music
      </div>
    </div>
  )
}

