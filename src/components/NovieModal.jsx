import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { buildContext, generateReply, generateInsight, getDailyReflection } from '../lib/ai.js'
import { Modal, Card } from './ui.jsx'

export default function NovieModal({ open, onClose, onNav }) {
  const { profile, checkins, journal, goals, reflections, memories, interests, awardXp, showToast } = useApp()
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState([])

  const ctx = useMemo(() => buildContext({ profile, checkins, journal, goals, reflections, memories, interests }), [profile, checkins, journal, goals, reflections, memories, interests])

  const presets = ['Understand me', 'Relationship', "I'm stuck", 'Tiny reset', 'Something fun', 'Surprise me']

  const send = async (text) => {
    if (!text.trim()) return
    const reply = generateReply(text, ctx)
    setConversation(prev => [...prev, { user: text, reply }])
    setInput('')
    await awardXp(3, 'ai_chat', 'Conversed with Novie')
    showToast('✨ +3 XP')
  }

  const handleClose = () => {
    setConversation([])
    setInput('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <span className="kicker">✦ NOVIE</span>
      <h2>Where should we wander?</h2>
      <p>You can ask anything, pick a direction, or leave immediately.</p>

      <div className="chips" style={{ margin: '14px 0' }}>
        {presets.map(p => (
          <button key={p} className="chip" onClick={() => send(p)}>{p}</button>
        ))}
      </div>

      {conversation.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          {conversation.map((c, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div className="rewrite" style={{ background: '#fff', border: '1px solid var(--line)' }}>
                <p style={{ color: 'var(--ink)', fontWeight: '600', margin: 0 }}>{c.user}</p>
              </div>
              <div className="rewrite" style={{ marginTop: '8px' }}>
                <p style={{ color: 'var(--ink)' }}>{c.reply}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <input
          style={{ flex: 1, border: '1px solid var(--line)', borderRadius: '15px', padding: '13px' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Tell Novie what's on your mind..."
        />
        <button className="primary" onClick={() => send(input)}>Send ✦</button>
      </div>

      <div className="chips" style={{ marginTop: '16px' }}>
        <button className="chip" onClick={() => { handleClose(); onNav('explore') }}>Explore</button>
        <button className="chip" onClick={handleClose}>Stop here</button>
      </div>
    </Modal>
  )
}
