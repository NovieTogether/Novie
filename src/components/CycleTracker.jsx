import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Modal, Card } from './ui.jsx'
import * as api from '../lib/api.js'
import { getCycleInsights, estimateNextPeriod } from '../lib/ai.js'

const SYMPTOMS = [
  { id: 'cramps', label: 'Cramps', icon: '💢' },
  { id: 'headache', label: 'Headache', icon: '🤕' },
  { id: 'bloating', label: 'Bloating', icon: '🎈' },
  { id: 'breast_tenderness', label: 'Breast tenderness', icon: '💗' },
  { id: 'fatigue', label: 'Fatigue', icon: '😴' },
  { id: 'acne', label: 'Acne', icon: '🔴' },
  { id: 'backache', label: 'Backache', icon: '🔙' },
  { id: 'mood_swings', label: 'Mood swings', icon: '🔄' },
]

const CONFIDENCE_STYLE = {
  moderate: { label: 'Moderate confidence', color: 'var(--green)', bg: '#e9f7ed' },
  low: { label: 'Low confidence', color: '#8a6d3b', bg: '#fff8df' },
  'very low': { label: 'Very low confidence', color: '#a08570', bg: '#f8f6f2' },
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toDateStr(d) {
  return d.toISOString().split('T')[0]
}

export default function CycleTracker({ open, onClose }) {
  const { showToast, awardXp } = useApp()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('log')
  const [editingId, setEditingId] = useState(null)

  // Form state
  const [entryDate, setEntryDate] = useState(toDateStr(new Date()))
  const [periodStart, setPeriodStart] = useState(false)
  const [periodEnd, setPeriodEnd] = useState(false)
  const [selectedSymptoms, setSelectedSymptoms] = useState({})
  const [mood, setMood] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [sleepQuality, setSleepQuality] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)

  const loadEntries = async () => {
    setLoading(true)
    const data = await api.getCycleEntries()
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    if (open && loading) loadEntries()
  }, [open])

  const resetForm = () => {
    setEntryDate(toDateStr(new Date()))
    setPeriodStart(false)
    setPeriodEnd(false)
    setSelectedSymptoms({})
    setMood(0)
    setEnergy(0)
    setSleepQuality(0)
    setNotes('')
    setEditingId(null)
  }

  const toggleSymptom = (id) => {
    setSelectedSymptoms(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const saveEntry = async () => {
    setSaving(true)
    const payload = {
      entry_date: entryDate,
      period_start: periodStart,
      period_end: periodEnd,
      symptoms: selectedSymptoms,
      mood: mood > 0 ? mood : null,
      energy: energy > 0 ? energy : null,
      sleep_quality: sleepQuality > 0 ? sleepQuality : null,
      notes: notes.trim() || null,
    }
    if (editingId) {
      await api.updateCycleEntry(editingId, payload)
      showToast('Cycle entry updated')
    } else {
      await api.addCycleEntry(payload)
      await awardXp(5, 'cycle', 'Logged a cycle entry')
      showToast('Cycle entry saved · +5 XP')
    }
    setSaving(false)
    resetForm()
    await loadEntries()
  }

  const editEntry = (entry) => {
    setEditingId(entry.id)
    setEntryDate(entry.entry_date)
    setPeriodStart(entry.period_start || false)
    setPeriodEnd(entry.period_end || false)
    setSelectedSymptoms(entry.symptoms || {})
    setMood(entry.mood || 0)
    setEnergy(entry.energy || 0)
    setSleepQuality(entry.sleep_quality || 0)
    setNotes(entry.notes || '')
    setTab('log')
  }

  const removeEntry = async (id) => {
    await api.deleteCycleEntry(id)
    showToast('Entry deleted')
    await loadEntries()
  }

  const removeAllEntries = async () => {
    await api.deleteAllCycleEntries()
    setShowDeleteAll(false)
    showToast('All cycle data deleted')
    setEntries([])
    resetForm()
  }

  // Calendar data
  const calendarData = useMemo(() => {
    const byDate = {}
    entries.forEach(e => {
      byDate[e.entry_date] = e
    })
    return byDate
  }, [entries])

  const periodStartDates = useMemo(() =>
    entries.filter(e => e.period_start).map(e => e.entry_date).sort(),
    [entries]
  )

  const estimate = useMemo(() => estimateNextPeriod(entries), [entries])
  const insights = useMemo(() => getCycleInsights(entries), [entries])

  // Current cycle day
  const currentCycleDay = useMemo(() => {
    if (periodStartDates.length === 0) return null
    const lastStart = periodStartDates[periodStartDates.length - 1]
    const days = Math.floor((Date.now() - new Date(lastStart).getTime()) / 86400000)
    return { day: days + 1, lastStart }
  }, [periodStartDates])

  // Build calendar — current month
  const today = new Date()
  const calYear = today.getFullYear()
  const calMonth = today.getMonth()
  const firstDay = new Date(calYear, calMonth, 1)
  const lastDay = new Date(calYear, calMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekday = firstDay.getDay()

  const isPeriodDay = (dateStr) => {
    const entry = calendarData[dateStr]
    if (entry && (entry.period_start || entry.period_end)) return true
    // Check if within a period range
    for (let i = 0; i < periodStartDates.length; i++) {
      const start = new Date(periodStartDates[i])
      const endEntry = entries.find(e => e.period_end && new Date(e.entry_date) >= start)
      if (endEntry) {
        const end = new Date(endEntry.entry_date)
        const d = new Date(dateStr)
        if (d >= start && d <= end) return true
      }
    }
    return false
  }

  const isEstimatedPeriod = (dateStr) => {
    if (!estimate?.hasEstimate) return false
    const estStart = new Date(estimate.estimatedNext)
    const estEnd = new Date(estStart)
    estEnd.setDate(estEnd.getDate() + 5)
    const d = new Date(dateStr)
    return d >= estStart && d <= estEnd
  }

  const ScalePicker = ({ value, onChange, label, color }) => (
    <div className="field">
      <label>{label}{value > 0 && `: ${value}/5`}</label>
      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
        {[0, 1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            className={`chip ${value === n ? 'selected' : ''}`}
            onClick={() => onChange(n)}
            style={{
              width: '36px', height: '36px', padding: 0, fontSize: '13px',
              borderRadius: '50%',
              background: value === n ? color : 'transparent',
              color: value === n ? '#fff' : 'var(--ink)',
              border: value === n ? `2px solid ${color}` : '1px solid var(--line)',
            }}
          >
            {n === 0 ? '—' : n}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <Modal open={open} onClose={() => { resetForm(); onClose() }}>
      <span className="kicker">CYCLE TRACKING</span>
      <h2>Your cycle, your record.</h2>
      <p className="muted" style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.5 }}>
        Track your cycle privately. This data stays in your account — it is never shared with connections, partners, or the AI model. All pattern analysis happens on your device.
      </p>

      <div className="chips" style={{ marginTop: '16px', justifyContent: 'center' }}>
        <button className={`chip ${tab === 'log' ? 'selected' : ''}`} onClick={() => setTab('log')}>Log</button>
        <button className={`chip ${tab === 'calendar' ? 'selected' : ''}`} onClick={() => setTab('calendar')}>Calendar</button>
        <button className={`chip ${tab === 'insights' ? 'selected' : ''}`} onClick={() => setTab('insights')}>Insights</button>
      </div>

      {/* LOG TAB */}
      {tab === 'log' && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '16px' }}>{editingId ? 'Edit entry' : 'New entry'}</h3>

          <div className="field" style={{ marginTop: '12px' }}>
            <label>Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={e => setEntryDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <input type="checkbox" checked={periodStart} onChange={e => setPeriodStart(e.target.checked)} style={{ width: 'auto' }} />
              First day of period
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <input type="checkbox" checked={periodEnd} onChange={e => setPeriodEnd(e.target.checked)} style={{ width: 'auto' }} />
              Last day of period
            </label>
          </div>

          <div style={{ marginTop: '16px' }}>
            <small className="muted" style={{ display: 'block', marginBottom: '8px' }}>SYMPTOMS (optional)</small>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SYMPTOMS.map(s => (
                <button
                  key={s.id}
                  className={`chip ${selectedSymptoms[s.id] ? 'selected' : ''}`}
                  onClick={() => toggleSymptom(s.id)}
                  style={{ fontSize: '13px' }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          <ScalePicker label="Mood (optional)" value={mood} onChange={setMood} color="var(--green)" />
          <ScalePicker label="Energy (optional)" value={energy} onChange={setEnergy} color="#5b8def" />
          <ScalePicker label="Sleep quality (optional)" value={sleepQuality} onChange={setSleepQuality} color="#9b6dd9" />

          <div className="field">
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How are you feeling physically or emotionally?"
              style={{ minHeight: '80px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="primary" style={{ flex: 1 }} onClick={saveEntry} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update entry' : 'Save entry · +5 XP'}
            </button>
            {editingId && (
              <button className="secondary" onClick={resetForm}>Cancel</button>
            )}
          </div>

          {/* Recent entries */}
          {entries.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <small className="muted" style={{ display: 'block', marginBottom: '8px' }}>RECENT ENTRIES</small>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {entries.slice(0, 10).map(e => (
                  <div key={e.id} className="patternBox" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', flex: 1 }}>
                      {new Date(e.entry_date).toLocaleDateString()}
                      {e.period_start && ' · First day'}
                      {e.period_end && ' · Last day'}
                      {e.mood != null && ` · Mood ${e.mood}/5`}
                      {e.notes && ` · ${e.notes.slice(0, 40)}`}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="textBtn" style={{ fontSize: '12px' }} onClick={() => editEntry(e)}>Edit</button>
                      <button className="textBtn" style={{ fontSize: '12px', color: '#a08570' }} onClick={() => removeEntry(e.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entries.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              {!showDeleteAll ? (
                <button className="textBtn" style={{ fontSize: '12px', color: '#a08570' }}
                  onClick={() => setShowDeleteAll(true)}>
                  Delete all cycle data
                </button>
              ) : (
                <div style={{ padding: '12px', background: '#fff0f0', borderRadius: '12px', border: '1px solid #e8d5d5' }}>
                  <p style={{ fontSize: '13px', color: 'var(--ink)', margin: '0 0 10px 0' }}>
                    This will permanently delete all {entries.length} cycle entries. This cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="secondary" style={{ fontSize: '13px' }} onClick={removeAllEntries}>
                      Yes, delete everything
                    </button>
                    <button className="textBtn" style={{ fontSize: '13px' }} onClick={() => setShowDeleteAll(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CALENDAR TAB */}
      {tab === 'calendar' && (
        <div style={{ marginTop: '16px' }}>
          {currentCycleDay && (
            <Card style={{ textAlign: 'center', marginBottom: '16px' }}>
              <small className="muted">CURRENT CYCLE DAY</small>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--green)' }}>{currentCycleDay.day}</div>
              <small className="muted">since {new Date(currentCycleDay.lastStart).toLocaleDateString()}</small>
            </Card>
          )}

          {estimate && estimate.hasEstimate && (
            <Card style={{ marginBottom: '16px', background: estimate.isPast ? '#fff8df' : '#e9f7ed' }}>
              <small className="muted">ESTIMATED NEXT PERIOD</small>
              <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>
                {new Date(estimate.estimatedNext).toLocaleDateString()}
              </div>
              <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                {estimate.isPast
                  ? `This estimate was ${Math.abs(estimate.daysUntil)} days ago. If your period has started, log the first day.`
                  : `About ${estimate.daysUntil} day${estimate.daysUntil === 1 ? '' : 's'} away`}
              </small>
              <small style={{
                display: 'block', marginTop: '6px', fontSize: '11px',
                color: estimate.confidence === 'moderate' ? 'var(--green)' : '#8a6d3b',
              }}>
                Based on {estimate.cycleCount} recorded cycle{estimate.cycleCount === 1 ? '' : 's'} · {estimate.confidence} confidence
              </small>
            </Card>
          )}

          {estimate && !estimate.hasEstimate && (
            <Card style={{ marginBottom: '16px', background: '#f8f6f2' }}>
              <small className="muted">{estimate.reason}</small>
              <p style={{ fontSize: '13px', color: 'var(--ink)', marginTop: '6px' }}>
                Keep logging the first day of each period. Estimates will appear once enough data is available.
              </p>
            </Card>
          )}

          {/* Calendar grid */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <strong>{calYear} · {MONTH_NAMES[calMonth]}</strong>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px',
            fontSize: '11px', textAlign: 'center',
          }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="muted" style={{ padding: '4px 0' }}>{d}</div>
            ))}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              const isToday = dateStr === toDateStr(new Date())
              const isPeriod = isPeriodDay(dateStr)
              const isEst = isEstimatedPeriod(dateStr)
              const hasEntry = calendarData[dateStr]
              return (
                <div
                  key={dayNum}
                  style={{
                    padding: '6px 0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    background: isPeriod ? 'var(--green)' : isEst ? '#fff8df' : 'transparent',
                    color: isPeriod ? '#fff' : 'var(--ink)',
                    fontWeight: isToday ? 700 : 400,
                    border: isToday ? '2px solid var(--deep)' : 'none',
                    cursor: hasEntry ? 'pointer' : 'default',
                    position: 'relative',
                  }}
                  onClick={() => hasEntry && editEntry(calendarData[dateStr])}
                >
                  {dayNum}
                  {hasEntry && !isPeriod && (
                    <div style={{
                      position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
                      width: '4px', height: '4px', borderRadius: '50%', background: 'var(--green)',
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '14px', marginTop: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <small style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--green)' }} /> Recorded period
            </small>
            <small style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#fff8df' }} /> Estimated period
            </small>
            <small style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--green)' }} /> Has entry
            </small>
          </div>
        </div>
      )}

      {/* INSIGHTS TAB */}
      {tab === 'insights' && (
        <div style={{ marginTop: '16px' }}>
          {insights.length === 0 ? (
            <Card>
              <p className="muted" style={{ margin: 0 }}>
                {entries.length === 0
                  ? 'Start logging your cycle to see insights over time.'
                  : `You have ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}. At least 3 entries with period start dates are needed for cycle insights.`}
              </p>
              <p className="muted" style={{ fontSize: '12px', marginTop: '10px' }}>
                Insights are generated from your own recorded data. They describe correlations, not causes, and are never a medical diagnosis.
              </p>
            </Card>
          ) : (
            <>
              {insights.map((p, i) => {
                const conf = CONFIDENCE_STYLE[p.confidence] || CONFIDENCE_STYLE['very low']
                return (
                  <Card key={i} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <strong style={{ fontSize: '15px', lineHeight: 1.4 }}>{p.title}</strong>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '20px',
                        background: conf.bg, color: conf.color, whiteSpace: 'nowrap',
                      }}>{conf.label}</span>
                    </div>
                    <div style={{ marginTop: '10px', padding: '10px', background: '#f8f6f2', borderRadius: '10px' }}>
                      <small className="muted" style={{ display: 'block', marginBottom: '4px' }}>OBSERVED</small>
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>{p.observation}</p>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <small className="muted" style={{ display: 'block', marginBottom: '4px' }}>INTERPRETATION</small>
                      <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)' }}>{p.interpretation}</p>
                    </div>
                    <small className="muted" style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
                      Evidence: {p.evidence}
                    </small>
                  </Card>
                )
              })}
              <p className="muted" style={{ fontSize: '12px', marginTop: '12px', lineHeight: 1.5 }}>
                These insights are generated from your own cycle data using deterministic analysis. They identify possible correlations — not causes, and not medical diagnoses. If you have health concerns, please consult a healthcare provider.
              </p>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
