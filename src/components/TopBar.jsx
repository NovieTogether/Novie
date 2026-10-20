import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function TopBar({ onNav }) {
  const { profile } = useApp()
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const streak = profile?.streak || 0
  const initial = profile?.name ? profile.name[0].toUpperCase() : '♡'

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
  }

  return (
    <div className="topbar">
      <button className="brand" onClick={() => onNav('today')}>
        <span className="logoMark">
          <img src="novie-logo.png" alt="Novie" />
        </span>
        <span>Novie</span>
      </button>
      <div className="topRight">
        <span className="streak">🔥 {streak}</span>
        <div style={{ position: 'relative' }}>
          <button className="round" onClick={() => setMenuOpen(!menuOpen)}>{initial}</button>
          {menuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '14px',
              padding: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              zIndex: 100,
              minWidth: '160px',
            }}>
              <button
                className="textBtn"
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px' }}
                onClick={() => { setMenuOpen(false); handleSignOut() }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
