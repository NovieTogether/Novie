import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { EXPLORE_TILES, ZODIAC_SIGNS, SCIENCE_LESSONS, COMMUNICATION_STYLES, KID_ACTIVITIES } from '../lib/constants.js'
import { Modal, Card, PageHead, Tile } from '../components/ui.jsx'
import { rewriteMessage } from '../lib/ai.js'
import { getSunSign, getMoonSign, getCurrentMoonPhase, SIGN_INTERPRETATIONS, PLANET_MEANINGS, HOUSE_MEANINGS, ASPECT_MEANINGS, getSignElement, getSignModality, ELEMENTS, MODALITIES, getSunMoonElementDescription } from '../lib/astrology.js'
import NovieModal from '../components/NovieModal.jsx'
import CreateModal from '../components/CreateModal.jsx'
import DiscoverScreen from './DiscoverScreen.jsx'
import CycleTracker from '../components/CycleTracker.jsx'
import * as api from '../lib/api.js'

export default function ExploreScreen({ onNav }) {
  const { profile, checkins, journal, goals, reflections, memories, interests, habits, artwork, aiPrivacy, awardXp, showToast } = useApp()
  const [activeModal, setActiveModal] = useState(null)
  const [novieOpen, setNovieOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [discoverOpen, setDiscoverOpen] = useState(false)
  const [cycleOpen, setCycleOpen] = useState(false)

  // Astrology state
  const [birthDate, setBirthDate] = useState(profile?.birth_date || '')
  const [birthTime, setBirthTime] = useState(profile?.birth_time || '')
  const [birthPlace, setBirthPlace] = useState(profile?.birth_place || '')
  const [selectedSign, setSelectedSign] = useState(null)
  const [astroSaving, setAstroSaving] = useState(false)
  const [astroLoaded, setAstroLoaded] = useState(false)

  // Sync birth info from profile when it loads
  useEffect(() => {
    if (profile && !astroLoaded) {
      setBirthDate(profile.birth_date || '')
      setBirthTime(profile.birth_time || '')
      setBirthPlace(profile.birth_place || '')
      setAstroLoaded(true)
    }
  }, [profile, astroLoaded])

  // Computed chart data
  const sunSign = useMemo(() => getSunSign(birthDate), [birthDate])
  const moonSign = useMemo(() => getMoonSign(birthDate, birthTime), [birthDate, birthTime])
  const moonPhase = useMemo(() => getCurrentMoonPhase(), [])
  const sunInterp = sunSign ? SIGN_INTERPRETATIONS[sunSign] : null
  const moonInterp = moonSign ? SIGN_INTERPRETATIONS[moonSign.sign] : null
  const sunElement = sunSign ? getSignElement(sunSign) : null
  const sunModality = sunSign ? getSignModality(sunSign) : null
  const moonElement = moonSign ? getSignElement(moonSign.sign) : null
  const elementPairing = (sunSign && moonSign) ? getSunMoonElementDescription(sunSign, moonSign.sign) : null

  // Communication state
  const [commInput, setCommInput] = useState('')
  const [commStyle, setCommStyle] = useState('')
  const [commResult, setCommResult] = useState('')

  // Science state
  const [selectedLesson, setSelectedLesson] = useState(null)

  const saveBirthInfo = async () => {
    if (!birthDate) { showToast('Birth date is required'); return }
    setAstroSaving(true)
    await api.updateProfile({ birth_date: birthDate, birth_time: birthTime || null, birth_place: birthPlace || null, astrology_enabled: true })
    showToast('Birth info saved')
    setAstroSaving(false)
    setActiveModal('astChart')
  }

  const editBirthInfo = () => {
    setActiveModal('astrology')
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

  const saveAstroReflection = async (prompt) => {
    await awardXp(5, 'astrology', `Astrology reflection: ${prompt || 'general'}`)
    showToast('+5 XP for a reflection')
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
                else if (t.screen === 'patterns') setDiscoverOpen(true)
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

      {/* Astrology — Birth info entry */}
      <Modal open={activeModal === 'astrology'} onClose={() => setActiveModal(null)}>
        <span className="kicker">ASTROLOGY · BIRTH CHART</span>
        <h2>Your birth chart.</h2>
        <p className="muted" style={{ fontSize: '13px' }}>Astrology here is an interpretive practice for self-reflection, not a scientifically established personality assessment or a diagnosis.</p>
        <div className="field" style={{ marginTop: '16px' }}>
          <label>Birth date (required)</label>
          <input type="date" value={birthDate || ''} onChange={e => setBirthDate(e.target.value)} />
          <small className="muted" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>Used to calculate your Sun and Moon signs.</small>
        </div>
        <div className="field">
          <label>Birth time (optional but recommended)</label>
          <input type="time" value={birthTime || ''} onChange={e => setBirthTime(e.target.value)} />
          <small className="muted" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>Birth time improves Moon sign accuracy near sign cusps. Without it, the Moon calculation is approximate and may shift by one sign if your birth was near a cusp. Rising sign and houses require birth time and birthplace coordinates, which Novie does not currently calculate.</small>
        </div>
        <div className="field">
          <label>Birthplace (optional)</label>
          <input value={birthPlace || ''} onChange={e => setBirthPlace(e.target.value)} placeholder="City, Country" />
          <small className="muted" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>Saved for future features. Rising sign and house calculations require geographic coordinates, which are not yet available.</small>
        </div>
        <button className="primary" style={{ width: '100%' }} onClick={saveBirthInfo} disabled={astroSaving}>
          {astroSaving ? 'Saving...' : 'Calculate my chart'}
        </button>
        {profile?.astrology_enabled && (
          <div style={{ marginTop: '12px', padding: '12px', background: '#e9f7ed', borderRadius: '12px', fontSize: '12px', color: 'var(--green)' }}>
            Astrology is enabled. Novie can use your birth info in AI conversations (subject to your privacy settings in Grow).
          </div>
        )}
      </Modal>

      {/* Astrology — Birth chart results */}
      <Modal open={activeModal === 'astChart'} onClose={() => setActiveModal(null)}>
        <span className="kicker">YOUR BIRTH CHART</span>
        <h2 style={{ fontSize: '24px' }}>{sunSign || '—'} {sunSign ? ZODIAC_SIGNS.find(s => s.name === sunSign)?.symbol : ''}</h2>
        <p className="muted" style={{ fontSize: '12px' }}>Based on your birth date{birthTime ? ' and time' : ' only'}. Astrology is an interpretive practice, not a scientific assessment.</p>

        {sunInterp && (
          <div style={{ marginTop: '16px' }}>
            {/* Sun placement */}
            <div className="rewrite" style={{ marginBottom: '12px', background: '#fff8df', border: '1px solid #fff0bf' }}>
              <strong style={{ fontSize: '16px' }}>☉ Sun in {sunSign}</strong>
              <small className="muted" style={{ display: 'block', marginTop: '4px' }}>{sunElement} · {sunModality} · {sunInterp.archetype}</small>
              <p style={{ color: 'var(--ink)', marginTop: '10px', fontSize: '13px', lineHeight: 1.6 }}>
                <strong>Core drive:</strong> {sunInterp.coreDrive}
              </p>
              <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px', lineHeight: 1.6 }}>
                <strong>Strengths:</strong> {sunInterp.strengths}
              </p>
              <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px', lineHeight: 1.6 }}>
                <strong>Challenges:</strong> {sunInterp.challenges}
              </p>
              <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px', lineHeight: 1.6 }}>
                <strong>Emotional tendency:</strong> {sunInterp.emotionalTendency}
              </p>
              <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px', lineHeight: 1.6 }}>
                <strong>Needs:</strong> {sunInterp.needs}
              </p>
              <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px', lineHeight: 1.6 }}>
                <strong>Communication style:</strong> {sunInterp.communicationStyle}
              </p>
              <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px', lineHeight: 1.6 }}>
                <strong>Growth edge:</strong> {sunInterp.growthEdge}
              </p>
              <div style={{ marginTop: '12px', padding: '10px', background: '#f8f6f2', borderRadius: '10px' }}>
                <small className="muted" style={{ display: 'block', marginBottom: '6px' }}>REFLECTION QUESTIONS</small>
                {sunInterp.reflectionQuestions.map((q, i) => (
                  <p key={i} style={{ color: 'var(--ink)', fontSize: '13px', margin: '4px 0' }}>{q}</p>
                ))}
              </div>
            </div>

            {/* Moon placement */}
            {moonSign && moonInterp && (
              <div className="rewrite" style={{ marginBottom: '12px', background: '#dceef7', border: '1px solid #c4ddee' }}>
                <strong style={{ fontSize: '16px' }}>☽ Moon in {moonSign.sign} {moonSign.symbol}</strong>
                <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                  {moonSign.degreesInSign}° in sign · {moonSign.accuracy}
                  {moonSign.nearCusp && ' · Near a cusp — interpretation may vary'}
                </small>
                <p style={{ color: 'var(--ink)', marginTop: '10px', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Core drive:</strong> {moonInterp.coreDrive}
                </p>
                <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Emotional tendency:</strong> {moonInterp.emotionalTendency}
                </p>
                <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Needs:</strong> {moonInterp.needs}
                </p>
                <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Communication style:</strong> {moonInterp.communicationStyle}
                </p>
                <div style={{ marginTop: '12px', padding: '10px', background: '#f8f6f2', borderRadius: '10px' }}>
                  <small className="muted" style={{ display: 'block', marginBottom: '6px' }}>REFLECTION QUESTIONS</small>
                  {moonInterp.reflectionQuestions.map((q, i) => (
                    <p key={i} style={{ color: 'var(--ink)', fontSize: '13px', margin: '4px 0' }}>{q}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Sun-Moon element pairing */}
            {elementPairing && (
              <div className="rewrite" style={{ marginBottom: '12px', background: '#e9f7ed', border: '1px solid #b7d9bf' }}>
                <strong style={{ fontSize: '14px' }}>Sun ({sunElement}) × Moon ({moonElement})</strong>
                <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px', lineHeight: 1.6 }}>{elementPairing}</p>
              </div>
            )}

            {/* Rising sign note */}
            <div className="rewrite" style={{ marginBottom: '12px', background: '#f8f6f2' }}>
              <strong style={{ fontSize: '14px' }}>↗ Rising Sign (Ascendant)</strong>
              <p className="muted" style={{ marginTop: '6px', fontSize: '13px', lineHeight: 1.6 }}>
                Your Rising sign represents how you appear to others and the lens through which you meet the world. It requires your exact birth time and birthplace coordinates to calculate accurately. {birthTime ? 'You have saved a birth time, but Novie does not yet have a geocoding service to convert your birthplace into coordinates. This will be added in a future update.' : 'Add your birth time and place in the birth chart editor to prepare for this feature.'}
              </p>
            </div>

            {/* Limitations note */}
            <div style={{ marginTop: '12px', padding: '12px', background: '#fff', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <small className="muted" style={{ fontSize: '11px', lineHeight: 1.5, display: 'block' }}>
                What is calculated: Sun sign (from date) and Moon sign (simplified Meeus lunar position, accurate to ~1–2°). What is not yet available: Rising sign, houses, full planetary placements, and aspects — these require an ephemeris library or geocoding service that Novie does not currently include. These interpretations are authored content based on traditional astrology, not scientific personality measurement.
              </small>
            </div>

            <button className="primary" style={{ width: '100%', marginTop: '12px' }} onClick={() => saveAstroReflection('birth chart')}>
              Save a reflection · +5 XP
            </button>
            <button className="textBtn" style={{ width: '100%', marginTop: '8px' }} onClick={editBirthInfo}>
              Edit birth info
            </button>
            <div className="chips" style={{ marginTop: '12px' }}>
              <button className="chip" onClick={() => setActiveModal('moon')}>🌙 Moon cycle</button>
              <button className="chip" onClick={() => setActiveModal('zodiac')}>♈ Zodiac explorer</button>
              <button className="chip" onClick={() => setActiveModal('astroEdu')}>📖 Learn astrology</button>
              <button className="chip" onClick={() => { setActiveModal(null); onNav('world') }}>🗺️ Astrology lessons</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Astrology — Moon cycle */}
      <Modal open={activeModal === 'moon'} onClose={() => setActiveModal(null)}>
        <span className="kicker">MOON CYCLE</span>
        <h2>{moonPhase.name}</h2>
        <div style={{ textAlign: 'center', fontSize: '80px', margin: '20px 0' }}>{moonPhase.icon}</div>
        <p>{moonPhase.theme}</p>
        <p className="muted" style={{ marginTop: '8px', fontSize: '13px' }}>{moonPhase.illumination}% illuminated · phase {moonPhase.phaseFraction} of cycle</p>
        <p className="muted" style={{ marginTop: '12px' }}>Use the moon as a gentle rhythm for reflection: begin, build, pause, release. This is a natural calendar, not a claim that the moon causes emotional or physical changes.</p>
        <div style={{ marginTop: '12px' }}>
          <small className="muted" style={{ display: 'block', marginBottom: '8px' }}>ALL EIGHT PHASES</small>
          {ZODIAC_SIGNS && [0,1,2,3,4,5,6,7].map(i => {
            const p = getCurrentMoonPhase(new Date(Date.now() + (i - moonPhase.phaseFraction) * 29.53 * 86400000))
            const isCurrent = i === Math.floor(moonPhase.phaseFraction * 8) % 8
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', opacity: isCurrent ? 1 : 0.6 }}>
                <span style={{ fontSize: '24px' }}>{p.icon}</span>
                <span style={{ fontSize: '13px' }}><strong>{p.name}</strong>{isCurrent && ' (now)'}</span>
              </div>
            )
          })}
        </div>
        <button className="primary" style={{ width: '100%', marginTop: '12px' }} onClick={() => saveAstroReflection('moon cycle')}>
          Save a reflection · +5 XP
        </button>
      </Modal>

      {/* Astrology — Zodiac explorer with full interpretations */}
      <Modal open={activeModal === 'zodiac'} onClose={() => setActiveModal(null)}>
        <span className="kicker">ZODIAC EXPLORER</span>
        <h2>Pick a sign to explore.</h2>
        <div className="interestGrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '16px' }}>
          {ZODIAC_SIGNS.map(s => (
            <button key={s.name} className={`interest ${selectedSign?.name === s.name ? 'selected' : ''}`} onClick={() => setSelectedSign(s)}>
              <div style={{ fontSize: '24px' }}>{s.symbol}</div>
              <strong>{s.name}</strong>
              <small className="muted">{s.dates}</small>
            </button>
          ))}
        </div>
        {selectedSign && (
          <div className="rewrite" style={{ marginTop: '16px' }}>
            <strong style={{ fontSize: '16px' }}>{selectedSign.symbol} {selectedSign.name}</strong>
            <small className="muted" style={{ display: 'block', marginTop: '2px' }}>{selectedSign.element} · {getSignModality(selectedSign.name)} · {selectedSign.dates}</small>
            <p style={{ color: 'var(--ink)', marginTop: '8px', fontSize: '13px' }}>{selectedSign.theme}</p>
            {SIGN_INTERPRETATIONS[selectedSign.name] && (
              <>
                <p style={{ color: 'var(--ink)', marginTop: '10px', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Core drive:</strong> {SIGN_INTERPRETATIONS[selectedSign.name].coreDrive}
                </p>
                <p style={{ color: 'var(--ink)', marginTop: '6px', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Strengths:</strong> {SIGN_INTERPRETATIONS[selectedSign.name].strengths}
                </p>
                <p style={{ color: 'var(--ink)', marginTop: '6px', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Challenges:</strong> {SIGN_INTERPRETATIONS[selectedSign.name].challenges}
                </p>
                <p style={{ color: 'var(--ink)', marginTop: '6px', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Needs:</strong> {SIGN_INTERPRETATIONS[selectedSign.name].needs}
                </p>
                <p style={{ color: 'var(--ink)', marginTop: '6px', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Communication:</strong> {SIGN_INTERPRETATIONS[selectedSign.name].communicationStyle}
                </p>
                <p style={{ color: 'var(--ink)', marginTop: '6px', fontSize: '13px', lineHeight: 1.6 }}>
                  <strong>Growth edge:</strong> {SIGN_INTERPRETATIONS[selectedSign.name].growthEdge}
                </p>
                <div style={{ marginTop: '10px', padding: '10px', background: '#f8f6f2', borderRadius: '10px' }}>
                  <small className="muted" style={{ display: 'block', marginBottom: '6px' }}>REFLECTION</small>
                  {SIGN_INTERPRETATIONS[selectedSign.name].reflectionQuestions.map((q, i) => (
                    <p key={i} style={{ color: 'var(--ink)', fontSize: '13px', margin: '4px 0' }}>{q}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Astrology — Educational reference */}
      <Modal open={activeModal === 'astroEdu'} onClose={() => setActiveModal(null)}>
        <span className="kicker">LEARN ASTROLOGY</span>
        <h2>Reference guide.</h2>
        <p className="muted" style={{ fontSize: '13px' }}>Educational content about the building blocks of astrology. For structured lessons with progress tracking, visit the World Map → Celestial Observatory.</p>

        <div style={{ marginTop: '16px' }}>
          <strong style={{ fontSize: '14px' }}>THE TEN PLANETS (LUMINARIES AND PLANETS)</strong>
          <div className="toolList" style={{ marginTop: '8px' }}>
            {PLANET_MEANINGS.map(p => (
              <div key={p.name} style={{ textAlign: 'left', padding: '8px 0' }}>
                <strong style={{ fontSize: '13px' }}>{p.symbol} {p.name}</strong>
                <p className="muted" style={{ fontSize: '12px', marginTop: '2px', lineHeight: 1.5 }}>{p.theme}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <strong style={{ fontSize: '14px' }}>THE TWELVE HOUSES</strong>
          <div className="toolList" style={{ marginTop: '8px' }}>
            {HOUSE_MEANINGS.map(h => (
              <div key={h.num} style={{ textAlign: 'left', padding: '6px 0' }}>
                <strong style={{ fontSize: '13px' }}>{h.num}. House</strong>
                <p className="muted" style={{ fontSize: '12px', marginTop: '2px', lineHeight: 1.5 }}>{h.theme}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <strong style={{ fontSize: '14px' }}>THE FIVE MAJOR ASPECTS</strong>
          <div className="toolList" style={{ marginTop: '8px' }}>
            {ASPECT_MEANINGS.map(a => (
              <div key={a.name} style={{ textAlign: 'left', padding: '6px 0' }}>
                <strong style={{ fontSize: '13px' }}>{a.name}</strong>
                <p className="muted" style={{ fontSize: '12px', marginTop: '2px', lineHeight: 1.5 }}>{a.theme}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <strong style={{ fontSize: '14px' }}>ELEMENTS</strong>
          {Object.entries(ELEMENTS).map(([name, val]) => (
            <div key={name} style={{ textAlign: 'left', padding: '6px 0' }}>
              <strong style={{ fontSize: '13px' }}>{name}: {val.signs.join(', ')}</strong>
              <p className="muted" style={{ fontSize: '12px', marginTop: '2px', lineHeight: 1.5 }}>{val.trait}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px' }}>
          <strong style={{ fontSize: '14px' }}>MODALITIES</strong>
          {Object.entries(MODALITIES).map(([name, val]) => (
            <div key={name} style={{ textAlign: 'left', padding: '6px 0' }}>
              <strong style={{ fontSize: '13px' }}>{name}: {val.signs.join(', ')}</strong>
              <p className="muted" style={{ fontSize: '12px', marginTop: '2px', lineHeight: 1.5 }}>{val.trait}</p>
            </div>
          ))}
        </div>

        <button className="primary" style={{ width: '100%', marginTop: '14px' }} onClick={() => { setActiveModal(null); onNav('world') }}>
          Go to astrology lessons →
        </button>
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

      {/* Wellness Modal */}
      <Modal open={activeModal === 'wellness'} onClose={() => setActiveModal(null)}>
        <span className="kicker">WELLNESS</span>
        <h2>Body awareness and rest.</h2>
        <p className="muted">Wellness in Novie is about noticing, not diagnosing. Track rest, energy, and how your body feels in check-ins.</p>
        <div className="toolList" style={{ marginTop: '16px' }}>
          <button onClick={() => { setActiveModal(null); setCycleOpen(true) }}>🔴 Cycle tracking</button>
          <button onClick={() => { setActiveModal(null); onNav('today') }}>📋 Do a check-in</button>
          <button onClick={() => setActiveModal(null)}>🧘 3-minute breathing space</button>
          <button onClick={() => setActiveModal(null)}>😴 Rest reflection prompt</button>
        </div>
        <p className="muted" style={{ marginTop: '12px' }}>Cycle tracking is private — your data is never shared with connections or sent to the AI model. Everything is opt-in.</p>
      </Modal>

      <NovieModal open={novieOpen} onClose={() => setNovieOpen(false)} onNav={onNav} />
      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <CycleTracker open={cycleOpen} onClose={() => setCycleOpen(false)} />

      {discoverOpen && (
        <div className="modalWrap show" style={{ overflowY: 'auto' }} onClick={(e) => { if (e.target === e.currentTarget) setDiscoverOpen(false) }}>
          <div className="modal" style={{ maxWidth: '700px' }}>
            <button className="close" onClick={() => setDiscoverOpen(false)}>×</button>
            <DiscoverScreen onNav={onNav} onClose={() => setDiscoverOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
