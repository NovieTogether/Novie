import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { CONNECT_TILES } from '../lib/constants.js'
import { Modal, Card, PageHead, Tile } from '../components/ui.jsx'
import * as api from '../lib/api.js'

export default function ConnectScreen({ onNav }) {
  const { connections, refreshConnections, awardXp, showToast } = useApp()
  const [activeModal, setActiveModal] = useState(null)
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [connName, setConnName] = useState('')
  const [connType, setConnType] = useState('Friend')
  const [sharing, setSharing] = useState({ games: true, checkins: false, goals: false, astrology: false })

  const addConnection = async () => {
    if (!connName.trim()) return
    await api.addConnection({ name: connName.trim(), type: connType, sharing })
    await awardXp(10, 'connection', `Added connection: ${connName.trim()}`)
    await refreshConnections()
    showToast('♡ Connection added. +10 XP')
    setConnName('')
    setActiveModal(null)
  }

  const openConnection = (conn) => {
    setSelectedConnection(conn)
    setActiveModal('connectionDetail')
  }

  const toggleSharing = async (key) => {
    if (!selectedConnection) return
    const newSharing = { ...selectedConnection.sharing, [key]: !selectedConnection.sharing[key] }
    await api.updateConnection(selectedConnection.id, { sharing: newSharing })
    setSelectedConnection({ ...selectedConnection, sharing: newSharing })
    await refreshConnections()
  }

  const removeConnection = async (id) => {
    await api.deleteConnection(id)
    await refreshConnections()
    setActiveModal(null)
  }

  const sharingLabels = {
    games: { label: '🎮 Games', desc: 'Shared games and play activities' },
    checkins: { label: '🌿 Check-ins', desc: 'Mood and energy check-ins' },
    goals: { label: '🎯 Goals', desc: 'Active goals and progress' },
    astrology: { label: '🔮 Astrology', desc: 'Birth chart and astrology reflections' },
  }

  return (
    <>
      <PageHead label="CONNECT" title="Grow with people who matter." subtitle="Add people intentionally. Each connection can have its own sharing choices." />

      <section className="section">
        <div className="featureGrid">
          {CONNECT_TILES.map(t => (
            <Tile key={t.screen} icon={t.icon} title={t.title} desc={t.desc}
              gradient={t.gradient}
              onClick={() => {
                if (t.screen === 'addConnection') setActiveModal('addConnection')
                else if (t.screen === 'compatibility') setActiveModal('compatibility')
                else if (t.screen === 'communication') onNav('explore')
                else if (t.screen === 'permissions') setActiveModal('permissions')
              }} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Your connections</h2>
          <span>{connections.length} people</span>
        </div>
        {connections.length === 0 ? (
          <Card className="empty">
            <div>♡</div>
            <p className="muted">No connections yet. Start with someone you trust.</p>
            <button className="primary" onClick={() => setActiveModal('addConnection')}>+ Add someone</button>
          </Card>
        ) : (
          <div className="connectionGrid">
            {connections.map(c => (
              <Card key={c.id} className="connection">
                <div className="personIcon">♡</div>
                <div>
                  <h2 style={{ fontSize: '20px' }}>{c.name}</h2>
                  <p>{c.type}</p>
                  <button className="textBtn" onClick={() => openConnection(c)}>Open →</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal open={activeModal === 'addConnection'} onClose={() => setActiveModal(null)}>
        <span className="kicker">CONNECT</span>
        <h2>Add someone.</h2>
        <div className="field" style={{ marginTop: '16px' }}>
          <label>Name</label>
          <input value={connName} onChange={e => setConnName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addConnection()}
            placeholder="Their name" />
        </div>
        <div className="field">
          <label>Relationship type</label>
          <select value={connType} onChange={e => setConnType(e.target.value)}>
            <option>Partner</option><option>Friend</option><option>Family</option>
            <option>Child</option><option>Parent</option><option>Sibling</option><option>Colleague</option>
          </select>
        </div>
        <p className="muted">Sharing choices can be changed later.</p>
        <button className="primary" style={{ width: '100%', marginTop: '12px' }} onClick={addConnection}>Add connection</button>
      </Modal>

      <Modal open={activeModal === 'connectionDetail'} onClose={() => setActiveModal(null)}>
        {selectedConnection && (
          <>
            <span className="kicker">CONNECTION</span>
            <h2>{selectedConnection.name}</h2>
            <p className="muted">{selectedConnection.type} · Choose what this person gets to see.</p>
            <div className="toolList" style={{ marginTop: '16px' }}>
              {Object.entries(sharingLabels).map(([key, info]) => (
                <button key={key} onClick={() => toggleSharing(key)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{info.label}</span>
                  <span style={{ fontWeight: selectedConnection.sharing?.[key] ? '800' : '400', color: selectedConnection.sharing?.[key] ? 'var(--green)' : 'var(--muted)' }}>
                    {selectedConnection.sharing?.[key] ? 'On' : 'Off'}
                  </span>
                </button>
              ))}
            </div>
            <div className="chips" style={{ marginTop: '16px' }}>
              <button className="chip" onClick={() => { setActiveModal(null); onNav('play') }}>🎮 Play together</button>
              <button className="chip" onClick={() => { setActiveModal(null); onNav('explore') }}>💬 Communication Lab</button>
            </div>
            <button className="textBtn" style={{ color: '#c44', marginTop: '16px' }} onClick={() => removeConnection(selectedConnection.id)}>Remove connection</button>
          </>
        )}
      </Modal>

      <Modal open={activeModal === 'compatibility'} onClose={() => setActiveModal(null)}>
        <span className="kicker">COMPATIBILITY</span>
        <h2>Explore the connection, not a score.</h2>
        <p className="muted">Novie looks at conversation topics, shared interests and needs. It is not a verdict about whether people should be together.</p>
        <div className="compatBars" style={{ marginTop: '18px' }}>
          <div><span>Shared curiosity</span><i style={{ width: '80%' }} /></div>
          <div><span>Communication fit</span><i style={{ width: '70%' }} /></div>
          <div><span>Playfulness</span><i style={{ width: '75%' }} /></div>
          <div><span>Need for space</span><i style={{ width: '60%' }} /></div>
        </div>
        <p className="muted" style={{ marginTop: '12px' }}>These bars are illustrative in beta. A real compatibility exploration happens through honest conversation.</p>
        <button className="primary" style={{ width: '100%', marginTop: '12px' }} onClick={() => { setActiveModal(null); onNav('play') }}>Try a connection question →</button>
      </Modal>

      <Modal open={activeModal === 'permissions'} onClose={() => setActiveModal(null)}>
        <span className="kicker">SHARING</span>
        <h2>Privacy belongs to you.</h2>
        <p className="muted">Connection permissions are chosen per person. Private is the default. Open a connection to change what they can see.</p>
        <div className="toolList" style={{ marginTop: '16px' }}>
          <button>🔒 Private check-ins</button>
          <button>🎮 Shared games</button>
          <button>🏆 Shared challenges</button>
          <button>🔮 Optional astrology</button>
        </div>
        {connections.length > 0 && (
          <p className="muted" style={{ marginTop: '12px' }}>Tap any connection card to adjust their permissions.</p>
        )}
      </Modal>
    </>
  )
}
