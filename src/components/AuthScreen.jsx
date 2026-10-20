import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password)
      } else {
        await signIn(email.trim(), password)
      }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login')) setError('Incorrect email or password.')
      else if (msg.includes('already registered')) setError('An account with this email already exists. Try signing in.')
      else if (msg.includes('Password should be')) setError('Password must be at least 6 characters.')
      else setError(msg || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modalWrap show">
      <div className="modal" style={{ textAlign: 'center' }}>
        <img src="novie-logo.png" alt="Novie" style={{ width: '90px', margin: '0 auto 16px', display: 'block' }} />
        <span className="kicker">WELCOME TO NOVIE</span>
        <h2>{mode === 'signup' ? 'Create your account.' : 'Welcome back.'}</h2>
        <p className="muted" style={{ marginTop: '4px' }}>
          {mode === 'signup'
            ? 'Your account keeps your growth, journal, and memories private to you.'
            : 'Sign in to continue your journey.'}
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: '20px', textAlign: 'left' }}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={6}
            />
          </div>

          {error && (
            <div className="rewrite" style={{ background: '#fff0f0', borderColor: '#f5c6c6', marginTop: '12px' }}>
              <p style={{ color: '#c44', margin: 0, fontSize: '14px' }}>{error}</p>
            </div>
          )}

          <button className="primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          className="textBtn"
          style={{ marginTop: '14px' }}
          onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}
        >
          {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>

        <p className="muted" style={{ fontSize: '12px', marginTop: '16px' }}>
          Your data is private to your account. No one else can see your journal,
          check-ins, memories, or personal information.
        </p>
      </div>
    </div>
  )
}
