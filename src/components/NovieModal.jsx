import { useState, useMemo, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { buildContext, generateReply, generateInsight, getDailyReflection, getPersonalizedSuggestions } from '../lib/ai.js'
import { Modal, Card } from './ui.jsx'
import * as api from '../lib/api.js'

export default function NovieModal({ open, onClose, onNav }) {
  const { profile, checkins, journal, goals, reflections, memories, interests, habits, artwork, aiPrivacy, awardXp, showToast } = useApp()
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState([])
  const [showContext, setShowContext] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [aiMode, setAiMode] = useState(null)
  const scrollRef = useRef(null)

  const ctx = useMemo(() => buildContext({ profile, checkins, journal, goals, reflections, memories, interests, habits, artworkCount: artwork?.length || 0, privacySettings: aiPrivacy }), [profile, checkins, journal, goals, reflections, memories, interests, habits, artwork, aiPrivacy])

  const suggestions = useMemo(() => getPersonalizedSuggestions(ctx), [ctx])

  useEffect(() => {
    if (!open || loaded) return
    const loadHistory = async () => {
      const history = await api.getConversations(30)
      if (history && history.length > 0) {
        const reversed = [...history].reverse()
        const pairs = []
        let currentUser = null
        for (const h of reversed) {
          if (h.role === 'user') {
            if (currentUser !== null) {
              pairs.push({ user: currentUser, reply: null, fromHistory: true })
            }
            currentUser = h.content
          } else if (h.role === 'assistant') {
            pairs.push({ user: currentUser, reply: h.content, fromHistory: true, mode: h.metadata?.source || 'scripted' })
            currentUser = null
          }
        }
        if (currentUser !== null) {
          pairs.push({ user: currentUser, reply: null, fromHistory: true })
        }
        setConversation(pairs)
      }
      setLoaded(true)
    }
    loadHistory()
  }, [open, loaded])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation])

  const send = async (text) => {
    if (!text.trim()) return
    const userMsg = text.trim()
    setConversation(prev => [...prev, { user: userMsg, reply: null, loading: true }])
    setInput('')

    // Save user message
    await api.addConversationMessage({ role: 'user', content: userMsg })

    // Build conversation messages for the edge function
    // The server fetches permitted data independently — we only send messages
    const aiMessages = [
      ...conversation.filter(m => m.user || m.reply).slice(-10).map(m => [
        m.user ? { role: 'user', content: m.user } : null,
        m.reply ? { role: 'assistant', content: m.reply } : null,
      ].filter(Boolean)).flat(),
      { role: 'user', content: userMsg },
    ]

    // Try live AI first, fall back to scripted
    let reply = null
    let mode = 'scripted'

    const aiResult = await api.callNovieAI(aiMessages)
    if (aiResult?.reply && aiResult.mode === 'live') {
      reply = aiResult.reply
      mode = 'live'
    } else {
      reply = generateReply(userMsg, ctx)
      mode = 'scripted'
    }

    // Save assistant reply
    await api.addConversationMessage({ role: 'assistant', content: reply, metadata: { source: mode } })

    setConversation(prev => prev.map((m, i) =>
      i === prev.length - 1 ? { user: userMsg, reply, loading: false, mode } : m
    ))
    setAiMode(mode)

    await awardXp(3, 'ai_chat', 'Conversed with Novie')
    showToast('+3 XP')
  }

  const clearHistory = async () => {
    await api.clearConversations()
    setConversation([])
    showToast('Conversation history cleared')
  }

  const handleClose = () => {
    setLoaded(false)
    setInput('')
    onClose()
  }

  const modeLabel = aiMode === 'live' ? (
    <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--green)', background: '#e8f5e9', padding: '4px 10px', borderRadius: '8px', display: 'inline-block' }}>
      Live AI response
    </div>
  ) : (
    <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--muted)', background: '#f8f6f2', padding: '4px 10px', borderRadius: '8px', display: 'inline-block' }}>
      Scripted fallback — the live AI is temporarily unavailable.
    </div>
  )

  return (
    <Modal open={open} onClose={handleClose}>
      <span className="kicker">NOVIE</span>
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
          <p style={{ color: 'var(--ink)', margin: '8px 0 4px' }}><strong>Privacy controls:</strong></p>
          <p style={{ color: 'var(--muted)', margin: '2px 0', fontSize: '12px' }}>
            Check-ins: {ctx.privacySettings.checkins_enabled ? 'on' : 'off'} · Journal: {ctx.privacySettings.journal_enabled ? 'on' : 'off'} · Goals: {ctx.privacySettings.goals_enabled ? 'on' : 'off'} · Memories: {ctx.privacySettings.memories_enabled ? 'on' : 'off'} · Astrology: {ctx.privacySettings.astrology_enabled ? 'on' : 'off'}
          </p>
          {ctx.memoryContents.length > 0 && ctx.privacySettings.memories_enabled && (
            <>
              <p style={{ color: 'var(--ink)', margin: '8px 0 4px' }}><strong>Memories you approved:</strong></p>
              {ctx.memoryContents.map((m, i) => <p key={i} style={{ color: 'var(--muted)', margin: '2px 0', fontSize: '12px' }}>"{m}"</p>)}
            </>
          )}
          <p style={{ color: 'var(--muted)', margin: '8px 0 0', fontSize: '11px' }}>
            When live AI is connected, the server fetches only your permitted data directly from the database — your privacy settings are enforced server-side, not just in the interface. Manage what I know in Grow → AI memory & privacy.
          </p>
        </div>
      )}

      {conversation.length === 0 && (
        <div style={{ marginTop: '14px' }}>
          <span className="kicker">SUGGESTED FOR YOU</span>
          <div className="toolList" style={{ marginTop: '8px' }}>
            {suggestions.slice(0, 4).map((s, i) => (
              <button key={i} onClick={() => { handleClose(); onNav(s.nav) }}>{s.text}</button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: '11px', marginTop: '8px' }}>Suggestions are based on your permitted data: {suggestions[0]?.reason}</p>
        </div>
      )}

      <div className="chips" style={{ margin: '14px 0' }}>
        {presets.map(p => (
          <button key={p} className="chip" onClick={() => send(p)}>{p}</button>
        ))}
      </div>

      {conversation.length > 0 && (
        <div ref={scrollRef} style={{ marginTop: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
          {conversation.map((c, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              {c.user && (
                <div className="rewrite" style={{ background: '#fff', border: '1px solid var(--line)' }}>
                  <p style={{ color: 'var(--ink)', fontWeight: '600', margin: 0 }}>{c.user}</p>
                </div>
              )}
              {c.reply && (
                <div className="rewrite" style={{ marginTop: c.user ? '8px' : '0' }}>
                  <p style={{ color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{c.reply}</p>
                  {c.fromHistory && (
                    <small className="muted" style={{ fontSize: '10px', display: 'block', marginTop: '4px' }}>From previous conversation</small>
                  )}
                </div>
              )}
              {c.loading && (
                <div className="rewrite" style={{ marginTop: '8px' }}>
                  <p style={{ color: 'var(--muted)', margin: 0 }}>Thinking...</p>
                </div>
              )}
            </div>
          ))}
          {modeLabel}
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
        <button className="primary" onClick={() => send(input)}>Send</button>
      </div>

      <div className="chips" style={{ marginTop: '16px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="chip" onClick={() => { handleClose(); onNav('explore') }}>Explore</button>
          <button className="chip" onClick={handleClose}>Stop here</button>
        </div>
        {conversation.length > 0 && (
          <button className="textBtn" style={{ fontSize: '12px', color: '#c44' }} onClick={clearHistory}>
            Clear history
          </button>
        )}
      </div>
    </Modal>
  )
}

const presets = ['Understand me', 'Relationship', "I'm stuck", 'Tiny reset', 'Something fun', 'Surprise me']
