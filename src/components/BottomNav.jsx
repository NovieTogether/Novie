const TABS = [
  { id: 'today', icon: '⌂', label: 'Today' },
  { id: 'grow', icon: '🌱', label: 'Grow' },
  { id: 'explore', icon: '✦', label: 'Explore' },
  { id: 'connect', icon: '♡', label: 'Connect' },
  { id: 'play', icon: '🎮', label: 'Play' },
  { id: 'world', icon: '🗺️', label: 'World' },
]

export default function BottomNav({ tab, onNav }) {
  return (
    <div className="bottomNav">
      {TABS.map(t => (
        <button
          key={t.id}
          className={tab === t.id ? 'active' : ''}
          onClick={() => onNav(t.id)}
        >
          <b>{t.icon}</b>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  )
}
