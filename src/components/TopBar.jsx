import { useApp } from '../context/AppContext.jsx'

export default function TopBar({ onNav }) {
  const { profile } = useApp()
  const streak = profile?.streak || 0
  const initial = profile?.name ? profile.name[0].toUpperCase() : '♡'

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
        <button className="round">{initial}</button>
      </div>
    </div>
  )
}
