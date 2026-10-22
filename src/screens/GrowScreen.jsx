import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { GROWTH_TILES, REFLECTION_QUESTIONS, HABIT_SUGGESTIONS, GARDEN_MILESTONES } from '../lib/constants.js'
import { Modal, Card, PageHead } from '../components/ui.jsx'
import GardenModal from '../components/GardenModal.jsx'
import GardenWidget from '../components/GardenWidget.jsx'
import MemoryModal from '../components/MemoryModal.jsx'
import * as api from '../lib/api.js'

export default function GrowScreen({ onNav }) {
  const { profile, goals, journal, reflections, habits, gardenEvents, achievements, interests,
    checkins, artwork, loadAll,
    refreshGoals, refreshJournal, refreshReflections, refreshHabits, refreshGarden, awardXp, showToast } = useApp()

  const [activeModal, setActiveModal] = useState(null)
  const [goalInput, setGoalInput] = useState('')
  const [journalContent, setJournalContent] = useState('')
  const [journalTitle, setJournalTitle] = useState('')
  const [reflectionAnswer, setReflectionAnswer] = useState('')
  const [habitInput, setHabitInput] = useState('')
  const [gardenPrefsOpen, setGardenPrefsOpen] = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)

  const reflectionQuestion = REFLECTION_QUESTIONS[(reflections.length) % REFLECTION_QUESTIONS.length]

  const addGoal = async () => {
    if (!goalInput.trim()) return
    await api.addGoal({ title: goalInput.trim(), status: 'active', progress: 0 })
    await awardXp(10, 'goal', `Added goal: ${goalInput.trim()}`)
    await refreshGoals()
    showToast('🌱 Added to your growth path. +10 XP')
    setGoalInput('')
    setActiveModal(null)
  }

  const removeGoal = async (id) => {
    await api.deleteGoal(id)
    await refreshGoals()
  }

  const completeGoal = async (goal) => {
    await api.updateGoal(goal.id, { status: 'completed', progress: 100 })
    await awardXp(25, 'goal_complete', `Completed goal: ${goal.title}`)
    await refreshGoals()
    showToast('🏆 Goal completed! +25 XP')
  }

  const saveJournal = async () => {
    if (!journalContent.trim()) return
    await api.addJournalEntry({ title: journalTitle.trim(), content: journalContent.trim() })
    await awardXp(12, 'journal', 'Wrote a journal entry')
    await refreshJournal()
    showToast('📓 Journal saved. +12 XP')
    setJournalContent(''); setJournalTitle('')
    setActiveModal(null)
  }

  const removeJournal = async (id) => {
    await api.deleteJournalEntry(id)
    await refreshJournal()
  }

  const saveReflection = async () => {
    if (!reflectionAnswer.trim()) return
    await api.addReflection({ question: reflectionQuestion, answer: reflectionAnswer.trim() })
    await awardXp(10, 'reflection', `Reflected on: ${reflectionQuestion}`)
    await refreshReflections()
    showToast('🌿 Saved. +10 XP')
    setReflectionAnswer('')
    setActiveModal(null)
  }

  const addHabit = async () => {
    if (!habitInput.trim()) return
    await api.addHabit({ name: habitInput.trim(), frequency: 'daily', streak_count: 0, active: true })
    await refreshHabits()
    showToast('🔁 Habit added')
    setHabitInput('')
    setActiveModal(null)
  }

  const completeHabit = async (habit) => {
    const today = new Date().toISOString().split('T')[0]
    const last = habit.last_completed
    let newStreak = habit.streak_count || 0
    if (last) {
      const diff = Math.floor((new Date(today) - new Date(last)) / 86400000)
      if (diff === 1) newStreak += 1
      else if (diff > 1) newStreak = 1
    } else {
      newStreak = 1
    }
    await api.updateHabit(habit.id, { streak_count: newStreak, last_completed: today })
    await awardXp(8, 'habit', `Completed habit: ${habit.name}`)
    await refreshHabits()
    showToast(`🔁 ${habit.name} done! +8 XP`)
  }

  const removeHabit = async (id) => {
    await api.deleteHabit(id)
    await refreshHabits()
  }

  const xp = profile?.xp || 0
  const leaves = profile?.leaves || 1
  const treeEmoji = leaves > 12 ? '🌳🌳🌳' : leaves > 6 ? '🌳🌳' : leaves > 3 ? '🌳' : '🌱'
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  // Auto-check milestones and award new achievements (runs once per data load)
  const milestoneChecked = useRef(false)
  useEffect(() => {
    if (milestoneChecked.current) return
    if (gardenEvents.length === 0 && achievements.length === 0) return
    milestoneChecked.current = true

    const checkMilestones = async () => {
      const milestoneData = {
        checkin: checkins.length,
        journal: journal.length,
        reflection: reflections.filter(r => r.category !== 'insight-feedback' && r.category !== 'timeline-revisit').length,
        artwork: artwork.length,
        goal: goals.length,
        goalCompleted: goals.filter(g => g.status === 'completed').length,
        maxHabitStreak: Math.max(0, ...habits.map(h => h.streak_count || 0)),
        xp,
        lesson: gardenEvents.filter(e => e.activity_type === 'lesson').length,
      }
      const existingNames = new Set(achievements.map(a => a.name))
      const newlyEarned = GARDEN_MILESTONES.filter(m =>
        m.check(milestoneData) && !existingNames.has(m.name)
      )
      if (newlyEarned.length === 0) return
      for (const m of newlyEarned) {
        await api.awardAchievementIfNew(m.name, m.description, m.icon)
      }
      showToast(`${newlyEarned.length} new milestone${newlyEarned.length === 1 ? '' : 's'} reached!`)
      // Refresh achievements via loadAll
      await loadAll()
    }
    checkMilestones()
  }, [gardenEvents, achievements, checkins, journal, reflections, artwork, goals, habits, xp, showToast])

  return (
    <>
      <PageHead label="GROW" title="Grow at your own pace." subtitle="Journal, set goals, build habits, reflect, and watch your Garden grow. You never have to chase a streak." />

      <section className="section">
        <div className="featureGrid">
          {GROWTH_TILES.map(t => (
            <button key={t.screen} className="tile" onClick={() => setActiveModal(t.screen)}>
              <span className="tileIcon">{t.icon}</span>
              <strong>{t.title}</strong>
              <small>{t.desc}</small>
              <em>Open →</em>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Active goals</h2>
          <span>{activeGoals.length} in progress</span>
        </div>
        <div className="twoCol">
          <Card>
            {activeGoals.length === 0 ? (
              <p className="muted">No active goals yet. What matters next?</p>
            ) : (
              activeGoals.map(g => (
                <div key={g.id} className="patternBox">
                  <span>🌱 {g.title}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="textBtn" onClick={() => completeGoal(g)}>✓</button>
                    <button className="textBtn" onClick={() => removeGoal(g.id)}>×</button>
                  </div>
                </div>
              ))
            )}
            <button className="primary" style={{ marginTop: '10px' }} onClick={() => setActiveModal('addGoal')}>+ Add a goal</button>
          </Card>
          <Card>
            <span className="kicker">COMPLETED</span>
            <h2 style={{ fontSize: '22px', marginTop: '8px' }}>{completedGoals.length} done</h2>
            {completedGoals.length > 0 ? (
              completedGoals.slice(0, 5).map(g => (
                <div key={g.id} className="patternBox">
                  <span>🏆 {g.title}</span>
                </div>
              ))
            ) : (
              <p className="muted">Completed goals will show here.</p>
            )}
          </Card>
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Habits</h2>
          <span>Small repeated actions</span>
        </div>
        <Card>
          {habits.length === 0 ? (
            <p className="muted">No habits yet. Start with something you can do in two minutes.</p>
          ) : (
            habits.map(h => (
              <div key={h.id} className="patternBox">
                <span>🔁 {h.name} · {h.streak_count || 0} day{h.streak_count !== 1 ? 's' : ''}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="textBtn" onClick={() => completeHabit(h)}>✓ Done</button>
                  <button className="textBtn" onClick={() => removeHabit(h.id)}>×</button>
                </div>
              </div>
            ))
          )}
          <button className="primary" style={{ marginTop: '10px' }} onClick={() => setActiveModal('addHabit')}>+ Add a habit</button>
        </Card>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Recent journal entries</h2>
          <span>{journal.length} saved</span>
        </div>
        {journal.length === 0 ? (
          <Card><p className="muted">Nothing saved yet. Write freely — you do not have to be profound.</p>
            <button className="primary" style={{ marginTop: '10px' }} onClick={() => setActiveModal('journal')}>Write a journal entry</button>
          </Card>
        ) : (
          <div className="twoCol">
            {journal.slice(0, 4).map(j => (
              <Card key={j.id}>
                {j.title && <strong>{j.title}</strong>}
                <p className="muted" style={{ marginTop: j.title ? '8px' : '0' }}>
                  {j.content.length > 120 ? j.content.slice(0, 120) + '...' : j.content}
                </p>
                <small className="muted">{new Date(j.created_at).toLocaleDateString()}</small>
                <button className="textBtn" style={{ display: 'block', marginTop: '8px' }} onClick={() => removeJournal(j.id)}>Remove</button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Your Garden</h2>
          <span>{xp} XP · {leaves} leaves</span>
        </div>
        <GardenWidget
          onOpenPrefs={() => setGardenPrefsOpen(true)}
          onNav={onNav}
        />
        <div className="chips" style={{ marginTop: '14px', justifyContent: 'center' }}>
          <button className="chip" onClick={() => setMemoryOpen(true)}>💾 AI memory & privacy</button>
        </div>
      </section>

      {gardenEvents.length > 0 && (
        <section className="section">
          <div className="sectionTitle">
            <h2>Recent growth</h2>
          </div>
          <Card>
            {gardenEvents.slice(0, 8).map(e => (
              <div key={e.id} className="patternBox">
                <span>{e.description}</span>
                <small className="muted">+{e.xp_earned} XP</small>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* Goal Modal */}
      <Modal open={activeModal === 'addGoal'} onClose={() => setActiveModal(null)}>
        <span className="kicker">GROWTH</span>
        <h2>What matters next?</h2>
        <div className="field">
          <input value={goalInput} onChange={e => setGoalInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            placeholder="Goal, habit, relationship or experience" />
        </div>
        <button className="primary" style={{ width: '100%' }} onClick={addGoal}>Add it · +10 XP</button>
      </Modal>

      {/* Journal Modal */}
      <Modal open={activeModal === 'journal'} onClose={() => setActiveModal(null)}>
        <span className="kicker">JOURNAL</span>
        <h2>Write freely.</h2>
        <div className="field">
          <input value={journalTitle} onChange={e => setJournalTitle(e.target.value)}
            placeholder="Title (optional)" />
        </div>
        <div className="field">
          <textarea value={journalContent} onChange={e => setJournalContent(e.target.value)}
            placeholder="There is no right way to do this..." style={{ minHeight: '160px' }} />
        </div>
        <button className="primary" style={{ width: '100%' }} onClick={saveJournal}>Save · +12 XP</button>
      </Modal>

      {/* Reflection Modal */}
      <Modal open={activeModal === 'reflection'} onClose={() => setActiveModal(null)}>
        <span className="kicker">DISCOVER YOURSELF</span>
        <h2>{reflectionQuestion}</h2>
        <div className="field">
          <textarea value={reflectionAnswer} onChange={e => setReflectionAnswer(e.target.value)}
            placeholder="There is no right answer..." style={{ minHeight: '140px' }} />
        </div>
        <button className="primary" style={{ width: '100%' }} onClick={saveReflection}>Save · +10 XP</button>
        <button style={{ width: '100%', marginTop: '8px' }} onClick={() => { setReflectionAnswer(''); setActiveModal(null); }}>Give me another time</button>
      </Modal>

      {/* Habit Modal */}
      <Modal open={activeModal === 'addHabit'} onClose={() => setActiveModal(null)}>
        <span className="kicker">HABITS</span>
        <h2>What small action do you want to repeat?</h2>
        <div className="field">
          <input value={habitInput} onChange={e => setHabitInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addHabit()}
            placeholder="e.g. 5 minutes of quiet breathing" />
        </div>
        <p className="muted" style={{ marginTop: '10px' }}>Or try one of these:</p>
        <div className="chips" style={{ marginTop: '8px' }}>
          {HABIT_SUGGESTIONS.map(h => (
            <button key={h} className="chip" onClick={() => setHabitInput(h)}>{h}</button>
          ))}
        </div>
        <button className="primary" style={{ width: '100%', marginTop: '12px' }} onClick={addHabit}>Add habit</button>
      </Modal>

      {/* Garden Modal */}
      <Modal open={activeModal === 'garden'} onClose={() => setActiveModal(null)}>
        <span className="kicker">YOUR NOVIE GARDEN</span>
        <h2>Growth you can actually feel.</h2>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <div style={{ fontSize: '90px' }}>{treeEmoji}</div>
          <strong style={{ fontSize: '22px', display: 'block', marginTop: '10px' }}>{leaves} leaves</strong>
          <small className="muted">{xp} XP · {(profile?.streak || 0)} day streak</small>
        </div>
        <p className="muted">XP comes from exploring, checking in, playing and reflecting. You never have to chase a streak.</p>
        {gardenEvents.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <strong>Recent growth events:</strong>
            {gardenEvents.slice(0, 10).map(e => (
              <div key={e.id} className="patternBox">
                <span>{e.description}</span>
                <small className="muted">+{e.xp_earned} XP</small>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Achievements Modal */}
      <Modal open={activeModal === 'achievements'} onClose={() => setActiveModal(null)}>
        <span className="kicker">ACHIEVEMENTS</span>
        <h2>Your milestones.</h2>
        {achievements.length === 0 ? (
          <p className="muted">Achievements will appear here as you grow. Keep checking in, reflecting, and exploring.</p>
        ) : (
          <div className="featureGrid" style={{ marginTop: '16px' }}>
            {achievements.map(a => (
              <Card key={a.id} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px' }}>{a.icon}</div>
                <strong style={{ display: 'block', marginTop: '8px' }}>{a.name}</strong>
                <small className="muted">{a.description}</small>
              </Card>
            ))}
          </div>
        )}
      </Modal>

      <GardenModal open={gardenPrefsOpen} onClose={() => setGardenPrefsOpen(false)} />
      <MemoryModal open={memoryOpen} onClose={() => setMemoryOpen(false)} />
    </>
  )
}
