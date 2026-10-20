import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { buildContext, generateReply, generateInsight, getDailyReflection, getCrossAppSuggestions } from '../lib/ai.js'
import { Modal, Card } from './ui.jsx'

export default function NovieModal({ open, onClose, onNav }) {
  const { profile, checkins, journal, goals, reflections, memories, interests, habits, artwork, aiPrivacy, awardXp, showToast } = useApp()
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState([])
  const [showContext, setShowContext] = useState(false)

  const ctx = useMemo(() => buildContext({ profile, checkins, journal, goals, reflections, memories, interests, habits, artworkCount: artwork?.length || 0, privacySettings: aiPrivacy }), [profile, checkins, journal, goals, reflections, memories, interests, habits, artwork, aiPrivacy])

  const suggestions = useMemo(() => getCrossAppSuggestions(ctx), [ctx])

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

      <button className="textBtn" style={{ fontSize: '12px', color: 'var(--muted)' }} onClick={() => setShowContext(!showContext)}>
        {showContext ? 'Hide' : 'Show'} what Novie knows about you
      </button>

      {showContext && (
        <div className="rewrite" style={{ marginTop: '10px', background: '#fff', fontSize: '13px' }}>
          <p style={{ color: 'var(--ink)', margin: '0 0 8px' }}><strong>What I use to personalize responses:</strong></p>
          <p style={{ color: 'var(--muted)', margin: '2px 0' }}>{ctx.checkinCount} check-ins · {ctx.journalCount} journal entries · {ctx.reflectionCount} reflections</p>
          <p style={{ color: 'var(--muted)', margin: '2px 0' }}>{ctx.goalCount} active goals · {ctx.habitNames.length} habits · {ctx.artworkCount} artworks</p>
          <p style={{ color: 'var(--muted)', margin: '2px 0' }}>{ctx.memoryCount} approved memories · {ctx.interestNames.length} interests</p>
          {ctx.memoryContents.length > 0 && (
            <>
              <p style={{ color: 'var(--ink)', margin: '8px 0 4px' }}><strong>Memories you approved:</strong></p>
              {ctx.memoryContents.map((m, i) => <p key={i} style={{ color: 'var(--muted)', margin: '2px 0', fontSize: '12px' }}>"{m}"</p>)}
            </>
          )}
          <p style={{ color: 'var(--muted)', margin: '8px 0 0', fontSize: '11px' }}>
            This is scripted guidance, not a live AI model. I use your data to suggest, never to decide for you. Manage what I know in Grow → AI memory & privacy.
          </p>
        </div>
      )}

      {conversation.length === 0 && (
        <div style={{ marginTop: '14px' }}>
          <span className="kicker">SUGGESTED FOR YOU</span>
          <div className="toolList" style={{ marginTop: '8px' }}>
            {suggestions.slice(0, 3).map((s, i) => (
              <button key={i} onClick={() => { handleClose(); onNav(s.nav) }}>{s.text}</button>
            ))}
          </div>
        </div>
      )}

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

const presets = ['Understand me', 'Relationship', "I'm stuck", 'Tiny reset', 'Something fun', 'Surprise me']
