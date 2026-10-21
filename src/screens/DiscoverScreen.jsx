import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { buildContext, getPatternExplanation, getPersonalizedSuggestions, getLearningSuggestion, buildDiscoveryTimeline, getDataSummary } from '../lib/ai.js'
import { Modal, Card, PageHead } from '../components/ui.jsx'
import * as api from '../lib/api.js'

const CONFIDENCE_STYLE = {
  'moderate': { label: 'Moderate confidence', color: 'var(--green)', bg: '#e9f7ed' },
  'low': { label: 'Low confidence', color: '#8a6d3b', bg: '#fff8df' },
  'very low': { label: 'Very low confidence', color: '#a08570', bg: '#f8f6f2' },
}

const TYPE_ICON = {
  activity: '🌿', journal: '📓', reflection: '🌙', 'insight-reflection': '🔍',
  goal: '🌱', 'goal-complete': '🏆', habit: '🔁', artwork: '🎨',
  achievement: '✨', checkin: '📋',
}

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const days = Math.floor((Date.now() - d) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`
  return d.toLocaleDateString()
}

export default function DiscoverScreen({ onNav, onClose }) {
  const {
    profile, checkins, goals, journal, reflections, memories, interests,
    habits, artwork, gardenEvents, achievements, aiPrivacy, awardXp, showToast,
    refreshReflections,
  } = useApp()

  const [tab, setTab] = useState('insights')
  const [reflectingOn, setReflectingOn] = useState(null)
  const [reflectionText, setReflectionText] = useState('')
  const [feedbackGiven, setFeedbackGiven] = useState(() => {
    const map = {}
    reflections.forEach(r => {
      if (r.category === 'insight-feedback' && r.question) {
        const titlePart = r.question.replace('Does this feel accurate? — ', '')
        map[titlePart] = r.answer?.startsWith('Yes') ? true : false
      }
    })
    return map
  })
  const [saving, setSaving] = useState(false)

  const ctx = useMemo(
    () => buildContext({ profile, checkins, journal, goals, reflections, memories, interests, habits, artworkCount: artwork?.length || 0, privacySettings: aiPrivacy }),
    [profile, checkins, journal, goals, reflections, memories, interests, habits, artwork, aiPrivacy]
  )

  const patterns = useMemo(() => getPatternExplanation(ctx) || [], [ctx])
  const suggestions = useMemo(() => getPersonalizedSuggestions(ctx), [ctx])
  const learnSuggestions = useMemo(() => getLearningSuggestion(ctx), [ctx])

  const timeline = useMemo(
    () => buildDiscoveryTimeline({ checkins, journal, reflections, goals, habits, gardenEvents, artwork, interests, achievements, memories }),
    [checkins, journal, reflections, goals, habits, gardenEvents, artwork, interests, achievements, memories]
  )

  const summary = useMemo(() => getDataSummary(ctx, timeline), [ctx, timeline])

  const saveInsightFeedback = async (pattern, feelsAccurate) => {
    if (!pattern) return
    setSaving(true)
    const question = `Does this feel accurate? — ${pattern.title}`
    const answer = feelsAccurate
      ? `Yes, this resonates. ${reflectionText.trim() ? reflectionText.trim() : ''}`
      : `Not quite. ${reflectionText.trim() ? reflectionText.trim() : ''}`
    await api.addReflection({ question, answer, category: 'insight-feedback' })
    await awardXp(5, 'insight', `Insight feedback: ${pattern.title}`)
    setFeedbackGiven({ ...feedbackGiven, [pattern.title]: feelsAccurate })
    showToast('+5 XP for reflecting on an insight')
    setReflectingOn(null)
    setReflectionText('')
    setSaving(false)
    await refreshReflections()
  }

  const saveTimelineReflection = async (item) => {
    setSaving(true)
    await api.addReflection({
      question: `Revisiting: ${item.title}`,
      answer: reflectionText.trim() || 'Revisited this moment.',
      category: 'timeline-revisit',
    })
    await awardXp(5, 'reflection', `Revisited: ${item.title}`)
    showToast('+5 XP')
    setReflectingOn(null)
    setReflectionText('')
    setSaving(false)
    await refreshReflections()
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <PageHead label="DISCOVER" title="What Novie has noticed." subtitle="Patterns from your own data, recommendations connected to things you can do, and a timeline of your journey so far." />

      {/* Data summary */}
      <section className="section">
        <div className="statsGrid">
          <Card className="stat">
            <span>Total activities</span>
            <b>{summary.totalItems}</b>
          </Card>
          <Card className="stat">
            <span>Check-ins</span>
            <b>{summary.checkinCount}</b>
          </Card>
          <Card className="stat">
            <span>Journal entries</span>
            <b>{summary.journalCount}</b>
          </Card>
          <Card className="stat">
            <span>Reflections</span>
            <b>{summary.reflectionCount}</b>
          </Card>
        </div>
        {summary.dateRange && (
          <p className="muted" style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
            Based on {summary.totalItems} data points across {summary.dateRange.days} day{summary.dateRange.days === 1 ? '' : 's'}
            {' '}({summary.dateRange.oldest.toLocaleDateString()} — {summary.dateRange.newest.toLocaleDateString()})
          </p>
        )}
      </section>

      {/* Tab navigation */}
      <section className="section">
        <div className="chips" style={{ justifyContent: 'center' }}>
          <button className={`chip ${tab === 'insights' ? 'selected' : ''}`} onClick={() => setTab('insights')}>🔍 Insights</button>
          <button className={`chip ${tab === 'recommendations' ? 'selected' : ''}`} onClick={() => setTab('recommendations')}>✦ For you</button>
          <button className={`chip ${tab === 'timeline' ? 'selected' : ''}`} onClick={() => setTab('timeline')}>📅 Timeline</button>
        </div>
      </section>

      {/* Pattern Insights */}
      {tab === 'insights' && (
        <section className="section">
          <div className="sectionTitle">
            <h2>Pattern insights</h2>
            <span>Observations from your permitted data — clues, not conclusions</span>
          </div>

          {patterns.length === 0 ? (
            <Card className="pattern">
              <span className="kicker">GETTING STARTED</span>
              <h2 style={{ fontSize: '20px', marginTop: '8px' }}>
                {summary.checkinCount < 3
                  ? 'More check-ins will unlock pattern insights.'
                  : 'Keep checking in — patterns surface as your data grows.'}
              </h2>
              <p className="muted" style={{ marginTop: '8px' }}>
                Novie looks for trends in your mood, energy, stress, and connection scores, then checks for possible relationships between them. You need at least 3 check-ins for the first patterns to appear.
              </p>
              <button className="primary" style={{ marginTop: '12px' }} onClick={() => { onClose(); onNav('today') }}>Do a check-in →</button>
            </Card>
          ) : (
            patterns.map((p, i) => {
              const conf = CONFIDENCE_STYLE[p.confidence] || CONFIDENCE_STYLE['very low']
              const alreadyFeedback = feedbackGiven[p.title]
              return (
                <Card key={i} style={{ marginBottom: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <strong style={{ fontSize: '16px', lineHeight: 1.4 }}>{p.title}</strong>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '20px',
                        background: conf.bg, color: conf.color, whiteSpace: 'nowrap',
                      }}>{conf.label}</span>
                    </div>

                    <div style={{ marginTop: '12px', padding: '10px', background: '#f8f6f2', borderRadius: '10px' }}>
                      <small className="muted" style={{ display: 'block', marginBottom: '4px' }}>OBSERVED</small>
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>{p.observation}</p>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <small className="muted" style={{ display: 'block', marginBottom: '4px' }}>INTERPRETATION</small>
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>{p.interpretation}</p>
                    </div>

                    {p.suggestion && (
                      <div style={{ marginTop: '10px' }}>
                        <small className="muted" style={{ display: 'block', marginBottom: '4px' }}>SUGGESTION</small>
                        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>{p.suggestion}</p>
                      </div>
                    )}

                    <div style={{ marginTop: '10px' }}>
                      <small className="muted" style={{ fontSize: '11px' }}>
                        Evidence: {p.evidence}
                      </small>
                    </div>

                    {/* Feedback buttons */}
                    {!alreadyFeedback ? (
                      <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="chip" onClick={() => { setReflectingOn(p); setReflectionText('') }}>Reflect on this</button>
                        <button className="textBtn" style={{ fontSize: '12px', color: 'var(--green)' }} onClick={() => saveInsightFeedback(p, true)}>
                          This feels accurate
                        </button>
                        <button className="textBtn" style={{ fontSize: '12px', color: '#a08570' }} onClick={() => saveInsightFeedback(p, false)}>
                          Not quite
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: '14px', padding: '10px', background: '#e9f7ed', borderRadius: '10px', fontSize: '12px', color: 'var(--green)' }}>
                        You reflected on this insight — your feedback is saved. It will not be treated as a confirmed fact, just as your input.
                      </div>
                    )}
                  </div>
                </Card>
              )
            })
          )}

          <p className="muted" style={{ fontSize: '12px', marginTop: '16px', lineHeight: 1.5 }}>
            These insights are generated from your own check-in data using deterministic analysis. Novie identifies averages, trends, and possible correlations — it does not claim causation, and it will not present a pattern when there is insufficient data. Your feedback helps you track which observations feel relevant to you over time.
          </p>
        </section>
      )}

      {/* Recommendations */}
      {tab === 'recommendations' && (
        <section className="section">
          <div className="sectionTitle">
            <h2>For you</h2>
            <span>Connected to things you can actually do in Novie</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {suggestions.map((s, i) => (
              <Card key={i} style={{ padding: '16px' }}>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--ink)' }}>{s.text}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <small className="muted" style={{ fontSize: '11px' }}>Why: {s.reason}</small>
                  <button className="primary" style={{ fontSize: '13px', padding: '6px 14px' }} onClick={() => { onClose(); onNav(s.nav) }}>Open →</button>
                </div>
              </Card>
            ))}
          </div>

          {learnSuggestions && learnSuggestions.length > 0 && (
            <>
              <div className="sectionTitle" style={{ marginTop: '24px' }}>
                <h2>Learning paths for you</h2>
                <span>Structured lessons in the World Map</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {learnSuggestions.map((l, i) => (
                  <Card key={i} style={{ padding: '16px' }}>
                    <strong style={{ fontSize: '14px', textTransform: 'capitalize' }}>{l.pathId.replace(/_/g, ' ')}</strong>
                    <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)', marginTop: '6px' }}>{l.reason}</p>
                    <button className="primary" style={{ fontSize: '13px', padding: '6px 14px', marginTop: '10px' }} onClick={() => { onClose(); onNav('world') }}>Go to World Map →</button>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <section className="section">
          <div className="sectionTitle">
            <h2>Your discovery timeline</h2>
            <span>A chronological view of what you have done and noticed</span>
          </div>

          {timeline.length === 0 ? (
            <Card className="pattern">
              <p className="muted">Your timeline will fill in as you check in, journal, create, complete lessons, and reach goals. Everything you do in Novie becomes part of your story here.</p>
            </Card>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '20px' }}>
              <div style={{ position: 'absolute', left: '6px', top: '0', bottom: '0', width: '2px', background: 'var(--line)' }} />
              {timeline.slice(0, 50).map((item, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '16px', cursor: 'pointer' }}
                  onClick={() => { setReflectingOn(item); setReflectionText('') }}>
                  <div style={{
                    position: 'absolute', left: '-20px', top: '4px', width: '14px', height: '14px',
                    borderRadius: '50%', background: 'var(--green)', border: '2px solid #fff',
                  }} />
                  <Card style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '18px', marginRight: '6px' }}>{TYPE_ICON[item.type] || '🌿'}</span>
                        <strong style={{ fontSize: '13px' }}>{item.title}</strong>
                        {item.detail && <p className="muted" style={{ fontSize: '12px', marginTop: '4px', lineHeight: 1.5 }}>{item.detail}</p>}
                      </div>
                      <small className="muted" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{timeAgo(item.date)}</small>
                    </div>
                    {item.xp > 0 && <small style={{ color: 'var(--green)', fontSize: '11px', marginTop: '4px', display: 'block' }}>+{item.xp} XP</small>}
                  </Card>
                </div>
              ))}
            </div>
          )}

          {timeline.length > 0 && (
            <p className="muted" style={{ fontSize: '12px', marginTop: '16px' }}>
              Tap any item to revisit it with a reflection. Your timeline is built from your existing data — no duplicate records are created.
            </p>
          )}
        </section>
      )}

      {/* Reflection modal — for insights or timeline items */}
      <Modal open={reflectingOn !== null} onClose={() => { setReflectingOn(null); setReflectionText('') }}>
        {reflectingOn && (
          <>
            <span className="kicker">REFLECT</span>
            <h2 style={{ fontSize: '20px' }}>
              {reflectingOn.title ? reflectingOn.title : reflectingOn.observation}
            </h2>
            {reflectingOn.interpretation && (
              <p className="muted" style={{ fontSize: '13px', marginTop: '8px', lineHeight: 1.6 }}>
                {reflectingOn.interpretation}
              </p>
            )}
            {reflectingOn.detail && (
              <p className="muted" style={{ fontSize: '13px', marginTop: '8px', lineHeight: 1.6 }}>
                {reflectingOn.detail}
              </p>
            )}
            <div className="field" style={{ marginTop: '16px' }}>
              <textarea
                value={reflectionText}
                onChange={e => setReflectionText(e.target.value)}
                placeholder="What does this bring up for you? Optional — you can skip this."
                style={{ minHeight: '100px', border: '1px solid var(--line)', borderRadius: '15px', padding: '13px' }}
              />
            </div>
            <button className="primary" style={{ width: '100%', marginTop: '12px' }} disabled={saving}
              onClick={() => {
                if (reflectingOn.observation) {
                  saveInsightFeedback(reflectingOn, true)
                } else {
                  saveTimelineReflection(reflectingOn)
                }
              }}>
              {saving ? 'Saving...' : 'Save reflection · +5 XP'}
            </button>
            {reflectingOn.observation && (
              <button className="textBtn" style={{ width: '100%', marginTop: '8px', color: '#a08570' }}
                disabled={saving}
                onClick={() => saveInsightFeedback(reflectingOn, false)}>
                This does not feel accurate
              </button>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
