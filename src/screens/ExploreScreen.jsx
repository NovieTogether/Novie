import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { EXPLORE_TILES, ZODIAC_SIGNS, SCIENCE_LESSONS, COMMUNICATION_STYLES, KID_ACTIVITIES } from '../lib/constants.js'
import { Modal, Card, PageHead, Tile } from '../components/ui.jsx'
import { getZodiacSign, getMoonPhase, rewriteMessage, buildContext, generateInsight } from '../lib/ai.js'
import NovieModal from '../components/NovieModal.jsx'
import CreateModal from '../components/CreateModal.jsx'
import * as api from '../lib/api.js'

export default function ExploreScreen({ onNav }) {
  const { profile, checkins, journal, goals, reflections, memories, interests, habits, artwork, awardXp, showToast } = useApp()
  const [activeModal, setActiveModal] = useState(null)
  const [novieOpen, setNovieOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  // Astrology state
  const [birthDate, setBirthDate] = useState(profile?.birth_date || '')
  const [birthTime, setBirthTime] = useState(profile?.birth_time || '')
  const [birthPlace, setBirthPlace] = useState(profile?.birth_place || '')
  const [selectedSign, setSelectedSign] = useState(null)

  // Communication state
  const [commInput, setCommInput] = useState('')
  const [commStyle, setCommStyle] = useState('')
  const [commResult, setCommResult] = useState('')

  // Science state
  const [selectedLesson, setSelectedLesson] = useState(null)

  const ctx = useMemo(() => buildContext({ profile, checkins, journal, goals, reflections, memories, interests, habits, artworkCount: artwork?.length || 0 }), [profile, checkins, journal, goals, reflections, memories, interests, habits, artwork])
  const insights = useMemo(() => generateInsight(ctx), [ctx])
  const moonPhase = useMemo(() => getMoonPhase(), [])
  const userSign = useMemo(() => getZodiacSign(profile?.birth_date), [profile])

  const saveBirthInfo = async () => {
    await api.updateProfile({ birth_date: birthDate, birth_time: birthTime, birth_place: birthPlace, astrology_enabled: true })
    showToast('🔮 Birth info saved')
    setActiveModal('astReading')
  }

  const doRewrite = (style) => {
    const result = rewriteMessage(commInput, style)
    setCommStyle(style)
    setCommResult(result)
  }

  const copyText = (text) => {
    navigator.clipboard?.writeText(text)
    showToast('Copied')
  }

  const saveAstroReflection = async () => {
    await awardXp(5, 'astrology', 'Saved an astrology reflection')
    showToast('🌙 +5 XP for a reflection')
    setActiveModal(null)
  }

  return (
    <>
      <PageHead label="EXPLORE" title="There is more to Novie." subtitle="Wander. You do not have to complete anything." />

      <section className="section">
        <div className="featureGrid">
          {EXPLORE_TILES.map(t => (
            <Tile key={t.screen} icon={t.icon} title={t.title} desc={t.desc}
              gradient={t.gradient}
              onClick={() => {
                if (t.screen === 'novie') setNovieOpen(true)
                else setActiveModal(t.screen)
              }} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Create</h2>
          <span>For how you feel</span>
        </div>
        <Card className="pattern" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '48px' }}>🎨</div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <strong style={{ fontSize: '18px', display: 'block' }}>Create for how you feel</strong>
            <p className="muted" style={{ marginTop: '4px' }}>Pick an emotion or just start drawing. Mandala, nature, free canvas, and more. No artistic ability needed.</p>
          </div>
          <button className="primary" onClick={() => setCreateOpen(true)}>Start creating →</button>
        </Card>
      </section>

      {/* Astrology Modals */}
      <Modal open={activeModal === 'astrology'} onClose={() => setActiveModal(null)}>
        <span className="kicker">ASTROLOGY · PLAYFUL REFLECTION</span>
        <h2>Your chart, your way.</h2>
        <p className="muted">Astrology here is for reflection and fun, not scientific prediction.</p>
        <div className="field" style={{ marginTop: '16px' }}>
          <label>Birth date</label>
          <input type="date" value={birthDate || ''} onChange={e => setBirthDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Birth time (optional)</label>
          <input type="time" value={birthTime || ''} onChange={e => setBirthTime(e.target.value)} />
        </div>
        <div className="field">
          <label>Birthplace (optional)</label>
          <input value={birthPlace || ''} onChange={e => setBirthPlace(e.target.value)} placeholder="City, Country" />
        </div>
        <button className="primary" style={{ width: '100%' }} onClick={saveBirthInfo}>Explore my themes</button>
        <div className="chips" style={{ marginTop: '12px' }}>
          <button className="chip" onClick={() => setActiveModal('moon')}>🌙 Moon cycle</button>
          <button className="chip" onClick={() => setActiveModal('zodiac')}>♈ Zodiac explorer</button>
        </div>
      </Modal>

      <Modal open={activeModal === 'astReading'} onClose={() => setActiveModal(null)}>
        <span className="kicker">YOUR ASTROLOGY</span>
        <h2>{userSign} · Sun theme</h2>
        {userSign && (() => {
          const sign = ZODIAC_SIGNS.find(s => s.name === userSign)
          return (
            <div className="astroCards" style={{ marginTop: '16px' }}>
              <div><b>☀️ Sun · {sign?.symbol}</b><span>{sign?.theme}</span></div>
              <div><b>🌙 Moon</b><span>Use your feelings as a reflection prompt rather than a prediction.</span></div>
              <div><b>↗ Rising</b><span>Birth time and place can change this theme; beta keeps it exploratory.</span></div>
            </div>
          )
        })()}
        <p className="muted" style={{ marginTop: '16px' }}>Reflection: Where are you being invited to act like yourself instead of who you think you should be?</p>
        <button className="primary" style={{ width: '100%', marginTop: '12px' }} onClick={saveAstroReflection}>Save reflection · +5 XP</button>
        <button style={{ width: '100%', marginTop: '8px' }} onClick={() => setActiveModal('moon')}>Explore the moon →</button>
      </Modal>

      <Modal open={activeModal === 'moon'} onClose={() => setActiveModal(null)}>
        <span className="kicker">MOON CYCLE</span>
        <h2>{moonPhase.name}</h2>
        <div style={{ textAlign: 'center', fontSize: '80px', margin: '20px 0' }}>{moonPhase.icon}</div>
        <p>{moonPhase.theme}</p>
        <p className="muted" style={{ marginTop: '12px' }}>Use the moon as a gentle rhythm for reflection: begin, build, pause, release. This is a playful guide, not a scientific claim.</p>
        <button className="primary" style={{ width: '100%', marginTop: '12px' }} onClick={saveAstroReflection}>Save reflection · +5 XP</button>
      </Modal>

      <Modal open={activeModal === 'zodiac'} onClose={() => setActiveModal(null)}>
        <span className="kicker">ZODIAC EXPLORER</span>
        <h2>Pick a sign to explore.</h2>
        <div className="interestGrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '16px' }}>
          {ZODIAC_SIGNS.map(s => (
            <button key={s.name} className="interest" onClick={() => setSelectedSign(s)}>
              <div style={{ fontSize: '24px' }}>{s.symbol}</div>
              <strong>{s.name}</strong>
              <small className="muted">{s.dates}</small>
            </button>
          ))}
        </div>
        {selectedSign && (
          <div className="rewrite" style={{ marginTop: '16px' }}>
            <strong>{selectedSign.symbol} {selectedSign.name} · {selectedSign.element}</strong>
            <p style={{ color: 'var(--ink)', marginTop: '8px' }}>{selectedSign.theme}</p>
            <small className="muted">{selectedSign.dates}</small>
          </div>
        )}
      </Modal>

      {/* Science Modal */}
      <Modal open={activeModal === 'science'} onClose={() => setActiveModal(null)}>
        <span className="kicker">SCIENCE & RELATIONSHIPS</span>
        <h2>Pick a lesson.</h2>
        <div className="toolList" style={{ marginTop: '16px' }}>
          {SCIENCE_LESSONS.map(l => (
            <button key={l.title} onClick={() => setSelectedLesson(l)}>{l.icon} {l.title}</button>
          ))}
        </div>
        {selectedLesson && (
          <div className="rewrite" style={{ marginTop: '16px' }}>
            <strong>{selectedLesson.icon} {selectedLesson.title}</strong>
            <p style={{ color: 'var(--ink)', marginTop: '8px' }}>{selectedLesson.text}</p>
          </div>
        )}
      </Modal>

      {/* Communication Lab Modal */}
      <Modal open={activeModal === 'communication'} onClose={() => setActiveModal(null)}>
        <span className="kicker">COMMUNICATION LAB</span>
        <h2>What do you want to say?</h2>
        <div className="field" style={{ marginTop: '16px' }}>
          <textarea value={commInput} onChange={e => setCommInput(e.target.value)}
            placeholder="Write the messy version here..." style={{ minHeight: '120px' }} />
        </div>
        <p className="muted">Pick a tone:</p>
        <div className="styleGrid" style={{ marginTop: '8px' }}>
          {COMMUNICATION_STYLES.map(s => (
            <button key={s} className="styleGridBtn" onClick={() => doRewrite(s)}>{s}</button>
          ))}
        </div>
        {commResult && (
          <div className="rewrite" style={{ marginTop: '16px' }}>
            <strong>{commStyle}</strong>
            <p style={{ color: 'var(--ink)', marginTop: '8px' }}>{commResult}</p>
            <button className="textBtn" onClick={() => copyText(commResult)}>Copy</button>
          </div>
        )}
      </Modal>

      {/* Family Modal */}
      <Modal open={activeModal === 'family'} onClose={() => setActiveModal(null)}>
        <span className="kicker">FAMILY GARDEN</span>
        <h2>Small shared moments.</h2>
        <p className="muted">Try a family challenge, a question, or a three-minute activity. Each person can choose what is private.</p>
        <div className="toolList" style={{ marginTop: '16px' }}>
          <button onClick={() => { setActiveModal(null); onNav('play') }}>💬 Family question</button>
          <button onClick={() => { setActiveModal(null); onNav('play') }}>🏆 Family challenge</button>
          <button onClick={() => setActiveModal('kids')}>🧒 Kids activity</button>
        </div>
      </Modal>

      {/* Kids Modal */}
      <Modal open={activeModal === 'kids'} onClose={() => setActiveModal(null)}>
        <span className="kicker">KIDS · 3–5 MINUTES</span>
        <h2>Pick a tiny activity.</h2>
        <div className="kidGrid" style={{ marginTop: '16px' }}>
          {KID_ACTIVITIES.map(k => (
            <button key={k.name} onClick={() => setSelectedSign(k)}>
              <div style={{ fontSize: '28px' }}>{k.icon}</div>
              <strong>{k.name}</strong>
            </button>
          ))}
        </div>
        {selectedSign && typeof selectedSign === 'object' && selectedSign.desc && (
          <div className="rewrite" style={{ marginTop: '16px' }}>
            <strong>{selectedSign.icon} {selectedSign.name}</strong>
            <p style={{ color: 'var(--ink)', marginTop: '8px' }}>{selectedSign.desc}</p>
            <p className="muted" style={{ marginTop: '8px' }}>Do this together for three minutes. There is no score and no homework.</p>
            <button className="primary" style={{ width: '100%', marginTop: '10px' }} onClick={() => { setActiveModal(null); setSelectedSign(null) }}>We're done</button>
          </div>
        )}
      </Modal>

      {/* Patterns Modal */}
      <Modal open={activeModal === 'patterns'} onClose={() => setActiveModal(null)}>
        <span className="kicker">NOVIE PATTERNS</span>
        <h2>Things worth noticing, not labels.</h2>
        <div className="rewrite" style={{ marginTop: '16px' }}>
          <p style={{ color: 'var(--ink)' }}>Check-ins saved: {checkins.length}</p>
          <p style={{ color: 'var(--ink)' }}>Journal entries: {journal.length}</p>
          <p style={{ color: 'var(--ink)' }}>Reflections: {reflections.length}</p>
          <p style={{ color: 'var(--ink)' }}>Goals active: {goals.filter(g => g.status === 'active').length}</p>
        </div>
        <div style={{ marginTop: '16px' }}>
          {insights.map((ins, i) => (
            <div key={i} className="patternBox">
              <span>{ins.text}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: '12px' }}>Use these as clues, not conclusions.</p>
      </Modal>

      {/* Wellness Modal */}
      <Modal open={activeModal === 'wellness'} onClose={() => setActiveModal(null)}>
        <span className="kicker">WELLNESS</span>
        <h2>Body awareness and rest.</h2>
        <p className="muted">Wellness in Novie is about noticing, not diagnosing. Track rest, energy, and how your body feels in check-ins.</p>
        <div className="toolList" style={{ marginTop: '16px' }}>
          <button onClick={() => { setActiveModal(null); onNav('today') }}>📋 Do a check-in</button>
          <button onClick={() => setActiveModal(null)}>🧘 3-minute breathing space</button>
          <button onClick={() => setActiveModal(null)}>😴 Rest reflection prompt</button>
        </div>
        <p className="muted" style={{ marginTop: '12px' }}>Cycle tracking and deeper wellness features will grow over time. Everything is opt-in.</p>
      </Modal>

      <NovieModal open={novieOpen} onClose={() => setNovieOpen(false)} onNav={onNav} />
      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
