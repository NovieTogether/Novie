export function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="modalWrap show" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <button className="close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  )
}

export function Toast({ message }) {
  if (!message) return null
  return <div className="toast show">{message}</div>
}

export function Tile({ icon, title, desc, onClick, gradient }) {
  return (
    <button className="tile exploreCard" style={gradient ? { background: gradient } : undefined} onClick={onClick}>
      <span className="tileIcon">{icon}</span>
      <h2>{title}</h2>
      <p>{desc}</p>
      <em>Explore →</em>
    </button>
  )
}

export function ProgressBar({ value, max = 100, label }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="bar">
      {label && <div className="barLabel">{label}</div>}
      <i style={{ width: pct + '%' }} />
    </div>
  )
}

export function Chip({ children, onClick, active }) {
  return (
    <button
      className={`chip ${active ? 'selected' : ''}`}
      onClick={onClick}
      style={active ? { background: '#e9f6ec', borderColor: '#b7d9bf' } : {}}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function PageHead({ label, title, subtitle }) {
  return (
    <div className="pageHead">
      <span className="kicker">{label}</span>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
    </div>
  )
}
