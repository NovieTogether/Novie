import { useMemo, useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PLANT_STAGES, PLANT_TYPES, SEASONAL_THEMES, GARDEN_MILESTONES } from '../lib/constants.js'
import { Card } from './ui.jsx'
import * as api from '../lib/api.js'

const STAGE_SIZE = [50, 64, 76, 84, 90, 96, 100]

export default function GardenWidget({ onOpenPrefs, onNav }) {
  const { profile, gardenEvents, achievements, goals, habits, journal, reflections, checkins, artwork, interests } = useApp()
  const [prefs, setPrefs] = useState(null)

  useEffect(() => {
    api.getGardenPrefs().then(p => setPrefs(p))
  }, [])

  const xp = profile?.xp || 0
  const leaves = profile?.leaves || 1
  const streak = profile?.streak || 0

  const plantType = prefs?.plant_type || 'seedling'
  const seasonalTheme = prefs?.seasonal_theme || 'none'
  const plant = PLANT_TYPES.find(p => p.id === plantType) || PLANT_TYPES[0]
  const stage = [...PLANT_STAGES].reverse().find(s => leaves >= s.minLeaves) || PLANT_STAGES[0]
  const nextStage = PLANT_STAGES.find(s => s.minLeaves > leaves)
  const stageSize = STAGE_SIZE[stage.stage] || 50

  const xpInCurrentLeaf = xp % 100
  const leavesToNextStage = nextStage ? nextStage.minLeaves - leaves : 0

  const seasonalIcon = seasonalTheme === 'halloween' ? '🎃' :
    seasonalTheme === 'christmas' ? '🎄' :
    seasonalTheme === 'autumn' ? '🍂' :
    seasonalTheme === 'winter' ? '❄️' :
    seasonalTheme === 'spring' ? '🌸' :
    seasonalTheme === 'summer' ? '🌻' : null

  const displayIcon = seasonalIcon || plant.icon

  // Activity counts from garden_events
  const activityCounts = useMemo(() => {
    const counts = {}
    gardenEvents.forEach(e => {
      const type = e.activity_type || 'other'
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }, [gardenEvents])

  // Milestone data — derived from existing data, no new tables
  const milestoneData = useMemo(() => ({
    checkin: checkins.length,
    journal: journal.length,
    reflection: reflections.filter(r => r.category !== 'insight-feedback' && r.category !== 'timeline-revisit').length,
    artwork: artwork.length,
    goal: goals.length,
    goalCompleted: goals.filter(g => g.status === 'completed').length,
    maxHabitStreak: Math.max(0, ...habits.map(h => h.streak_count || 0)),
    xp,
    lesson: gardenEvents.filter(e => e.activity_type === 'lesson').length,
  }), [checkins, journal, reflections, artwork, goals, habits, xp, gardenEvents])

  const earnedMilestoneIds = useMemo(() => {
    const existing = new Set(achievements.map(a => a.name))
    return new Set(GARDEN_MILESTONES.filter(m => m.check(milestoneData)).map(m => m.id))
  }, [achievements, milestoneData])

  const reachedMilestones = GARDEN_MILESTONES.filter(m => earnedMilestoneIds.has(m.id))
  const upcomingMilestones = GARDEN_MILESTONES.filter(m => !earnedMilestoneIds.has(m.id)).slice(0, 4)

  // Activity breakdown for display
  const activityBreakdown = [
    { label: 'Check-ins', icon: '📋', count: milestoneData.checkin },
    { label: 'Journal entries', icon: '📓', count: milestoneData.journal },
    { label: 'Reflections', icon: '🌙', count: milestoneData.reflection },
    { label: 'Habits done', icon: '🔁', count: gardenEvents.filter(e => e.activity_type === 'habit').length },
    { label: 'Goals completed', icon: '🏆', count: milestoneData.goalCompleted },
    { label: 'Artwork created', icon: '🎨', count: milestoneData.artwork },
    { label: 'Lessons learned', icon: '🧭', count: milestoneData.lesson },
  ].filter(a => a.count > 0)

  return (
    <>
      {/* Main Garden visual */}
      <Card className="pattern" style={{ textAlign: 'center', overflow: 'hidden' }}>
        {/* Growth stage indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
          {PLANT_STAGES.map((s, i) => (
            <div
              key={i}
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: i <= stage.stage ? 'var(--green)' : 'var(--line)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Plant visual — grows with stage */}
        <div style={{
          fontSize: `${stageSize}px`,
          lineHeight: 1,
          marginBottom: '8px',
          transition: 'font-size 0.4s ease',
          filter: stage.stage >= 4 ? 'drop-shadow(0 4px 8px rgba(79,141,105,0.2))' : 'none',
        }}>
          {displayIcon}
        </div>

        <strong style={{ fontSize: '20px', display: 'block' }}>{plant.name}</strong>
        <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
          {stage.label} · Stage {stage.stage + 1} of {PLANT_STAGES.length}
        </small>

        {/* XP progress bar */}
        <div style={{ marginTop: '16px' }}>
          <div className="miniProgress"><i style={{ width: xpInCurrentLeaf + '%' }} /></div>
          <small className="muted">{xpInCurrentLeaf} / 100 XP to next leaf</small>
        </div>

        {/* Next stage info */}
        {nextStage && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f8f6f2', borderRadius: '12px' }}>
            <small className="muted" style={{ display: 'block' }}>Next stage: {nextStage.icon} {nextStage.label}</small>
            <small className="muted">{leavesToNextStage} more leaf{leavesToNextStage === 1 ? '' : 's'} needed ({nextStage.minLeaves * 100} XP total)</small>
          </div>
        )}
        {!nextStage && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#e9f7ed', borderRadius: '12px' }}>
            <small style={{ color: 'var(--green)', fontWeight: 600 }}>
              {stage.icon} Your Garden has reached its fullest stage. Every leaf beyond this is abundance.
            </small>
          </div>
        )}

        {/* What helps your Garden grow */}
        {activityBreakdown.length > 0 && (
          <div style={{ marginTop: '16px', textAlign: 'left' }}>
            <small className="muted" style={{ display: 'block', marginBottom: '8px', textAlign: 'center' }}>WHAT HELPS YOUR GARDEN GROW</small>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {activityBreakdown.map((a, i) => (
                <div key={i} style={{
                  padding: '4px 10px', background: '#f8f6f2', borderRadius: '20px',
                  fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <span>{a.icon}</span>
                  <span style={{ color: 'var(--ink)' }}>{a.count}</span>
                  <span className="muted">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="chips" style={{ marginTop: '14px', justifyContent: 'center' }}>
          {onOpenPrefs && <button className="chip" onClick={onOpenPrefs}>🌳 Choose plant & theme</button>}
          {onNav && <button className="chip" onClick={() => onNav('explore')}>🔍 See your insights</button>}
        </div>
      </Card>

      {/* Milestones */}
      <div className="sectionTitle" style={{ marginTop: '24px' }}>
        <h2>Garden milestones</h2>
        <span>{reachedMilestones.length} of {GARDEN_MILESTONES.length} reached</span>
      </div>

      {reachedMilestones.length > 0 && (
        <div className="featureGrid" style={{ marginTop: '12px' }}>
          {reachedMilestones.map((m, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>{m.icon}</div>
              <strong style={{ fontSize: '13px', display: 'block' }}>{m.name}</strong>
              <small className="muted" style={{ fontSize: '11px', display: 'block', marginTop: '4px', lineHeight: 1.4 }}>{m.description}</small>
            </Card>
          ))}
        </div>
      )}

      {upcomingMilestones.length > 0 && (
        <>
          <div style={{ marginTop: '20px' }}>
            <small className="muted" style={{ display: 'block', marginBottom: '8px' }}>UPCOMING MILESTONES</small>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingMilestones.map((m, i) => (
              <Card key={i} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.75 }}>
                <div style={{ fontSize: '24px', filter: 'grayscale(0.5)' }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '13px' }}>{m.name}</strong>
                  <p className="muted" style={{ fontSize: '12px', marginTop: '2px', lineHeight: 1.4 }}>{m.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {reachedMilestones.length === 0 && upcomingMilestones.length === 0 && (
        <Card><p className="muted">Your milestones will appear as you check in, journal, reflect, create, and grow.</p></Card>
      )}
    </>
  )
}
