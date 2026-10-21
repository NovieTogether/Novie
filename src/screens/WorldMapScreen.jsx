import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { WORLD_MAP_DESTINATIONS, LEARNING_PATHS } from '../lib/constants.js'
import { Modal, PageHead } from '../components/ui.jsx'
import * as api from '../lib/api.js'

export default function WorldMapScreen({ onNav }) {
  const { profile, awardXp, showToast } = useApp()
  const [selectedPath, setSelectedPath] = useState(null)
  const [progress, setProgress] = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [reflectionText, setReflectionText] = useState('')
  const [lessonStep, setLessonStep] = useState(0)
  const [completing, setCompleting] = useState(false)

  const xp = profile?.xp || 0
  const unlockedCount = Math.min(WORLD_MAP_DESTINATIONS.length, 1 + Math.floor(xp / 200))

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    const data = await api.getLearningProgress()
    setProgress(data)
  }

  const isLessonCompleted = (pathId, lessonIndex) => {
    return progress.some(p => p.path_id === pathId && p.lesson_index === lessonIndex)
  }

  const getPathProgress = (pathId) => {
    const path = LEARNING_PATHS.find(p => p.id === pathId)
    if (!path) return { completed: 0, total: 0, pct: 0 }
    const completed = path.lessons.filter((_, i) => isLessonCompleted(pathId, i)).length
    return { completed, total: path.lessons.length, pct: Math.round((completed / path.lessons.length) * 100) }
  }

  const openLesson = (path, lessonIndex) => {
    setActiveLesson({ path, lessonIndex })
    setLessonStep(0)
    setReflectionText('')
  }

  const handleComplete = async () => {
    if (!activeLesson || completing) return
    setCompleting(true)
    const { path, lessonIndex } = activeLesson
    const lesson = path.lessons[lessonIndex]
    const result = await api.completeLesson(path.id, lessonIndex, lesson.title, reflectionText.trim() || null)

    if (result?.alreadyCompleted) {
      showToast('Already completed')
    } else {
      await awardXp(10, 'learning', `Completed lesson: ${lesson.title}`)
      showToast('+10 XP')
      await loadProgress()
    }

    setCompleting(false)
    setActiveLesson(null)
    setLessonStep(0)
    setReflectionText('')
  }

  const navToConnection = (screen) => {
    setActiveLesson(null)
    setSelectedPath(null)
    setLessonStep(0)
    onNav(screen)
  }

  return (
    <>
      <PageHead label="NOVIE WORLD" title="Your growing world." subtitle="Each destination opens as you explore. Learn, reflect, and connect what you discover to your daily life." />

      <section className="section">
        <div className="worldMapGrid">
          {WORLD_MAP_DESTINATIONS.map((dest, i) => {
            const unlocked = i < unlockedCount
            const destPaths = LEARNING_PATHS.filter(p => p.dest === dest.id)
            return (
              <button
                key={dest.id}
                className={`worldDest ${unlocked ? '' : 'locked'}`}
                style={{ background: unlocked ? dest.color : '#f0eeea' }}
                onClick={() => unlocked && destPaths.length > 0
                  ? setSelectedPath(destPaths[0])
                  : unlocked
                    ? showToast('This destination connects to other features — explore them from the main screen')
                    : showToast(`Keep exploring to unlock this destination (${(i + 1) * 200 - xp} XP needed)`)
                }
              >
                <div style={{ fontSize: '36px', opacity: unlocked ? 1 : 0.3 }}>{unlocked ? dest.icon : ''}</div>
                <strong style={{ display: 'block', marginTop: '8px', fontSize: '16px' }}>{dest.name}</strong>
                <small className="muted" style={{ display: 'block', marginTop: '4px', lineHeight: 1.4 }}>
                  {unlocked ? dest.desc : `${Math.max(0, (i + 1) * 200 - xp)} XP to unlock`}
                </small>
                {unlocked && destPaths.length > 0 && (
                  <small style={{ display: 'block', marginTop: '6px', fontWeight: '600', color: 'var(--green)' }}>
                    {getPathProgress(destPaths[0].id).completed}/{getPathProgress(destPaths[0].id).total} lessons complete
                  </small>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Learning paths</h2>
          <span>Explore at your own pace — each lesson includes real content, exercises, and reflections</span>
        </div>
        <div className="featureGrid">
          {LEARNING_PATHS.map(path => {
            const prog = getPathProgress(path.id)
            const allDone = prog.completed === prog.total && prog.total > 0
            return (
              <button
                key={path.id}
                className="tile"
                onClick={() => setSelectedPath(path)}
              >
                <span className="tileIcon">{path.icon}</span>
                <strong>{path.title}</strong>
                <small>{prog.completed}/{prog.total} lessons {allDone ? '(complete!)' : ''}</small>
                {prog.completed > 0 && !allDone && (
                  <div className="miniProgress" style={{ marginTop: '6px' }}>
                    <i style={{ width: prog.pct + '%' }} />
                  </div>
                )}
                <em>{allDone ? 'Review' : prog.completed > 0 ? 'Continue' : 'Start'}</em>
              </button>
            )
          })}
        </div>
      </section>

      {/* Path overview modal — shows lessons in a path */}
      <Modal open={selectedPath !== null && activeLesson === null} onClose={() => setSelectedPath(null)}>
        {selectedPath && (
          <>
            <span className="kicker">{selectedPath.icon} {selectedPath.title}</span>
            <h2>{selectedPath.title}</h2>
            <p>{WORLD_MAP_DESTINATIONS.find(d => d.id === selectedPath.dest)?.desc}</p>

            <div className="toolList" style={{ marginTop: '16px' }}>
              {selectedPath.lessons.map((lesson, i) => {
                const done = isLessonCompleted(selectedPath.id, i)
                return (
                  <button
                    key={i}
                    onClick={() => openLesson(selectedPath, i)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                  >
                    <span style={{ fontSize: '20px' }}>{done ? '\u2705' : i + 1 + '.'}</span>
                    <span style={{ textAlign: 'left' }}>
                      <strong>{lesson.title}</strong>
                      <small className="muted" style={{ display: 'block', marginTop: '2px' }}>
                        {done ? 'Completed' : 'Not started'}
                      </small>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </Modal>

      {/* Active lesson modal — shows lesson content, exercise, reflection */}
      <Modal open={activeLesson !== null} onClose={() => { setActiveLesson(null); setLessonStep(0); setReflectionText('') }}>
        {activeLesson && (
          <>
            {lessonStep === 0 && (
              <>
                <span className="kicker">{selectedPath.icon} LESSON {activeLesson.lessonIndex + 1} OF {selectedPath.lessons.length}</span>
                <h2 style={{ fontSize: '22px' }}>{activeLesson.path.lessons[activeLesson.lessonIndex].title}</h2>
                <div style={{ marginTop: '12px', fontSize: '14px', lineHeight: 1.6, color: 'var(--ink)' }}>
                  {activeLesson.path.lessons[activeLesson.lessonIndex].body.split('\n\n').map((para, pi) => (
                    <p key={pi} style={{ margin: '0 0 12px' }}>{para}</p>
                  ))}
                </div>
                <button className="primary" style={{ width: '100%', marginTop: '14px' }} onClick={() => setLessonStep(1)}>
                  Try the exercise
                </button>
                <button className="textBtn" style={{ width: '100%', marginTop: '8px' }} onClick={() => { setActiveLesson(null); setLessonStep(0) }}>
                  Back to lessons
                </button>
              </>
            )}

            {lessonStep === 1 && (
              <>
                <span className="kicker">EXERCISE</span>
                <h2 style={{ fontSize: '20px' }}>Try this</h2>
                <p style={{ fontSize: '14px', lineHeight: 1.6, marginTop: '8px' }}>{activeLesson.path.lessons[activeLesson.lessonIndex].exercise}</p>
                <button className="primary" style={{ width: '100%', marginTop: '14px' }} onClick={() => setLessonStep(2)}>
                  Reflect on what you noticed
                </button>
                <button className="textBtn" style={{ width: '100%', marginTop: '8px' }} onClick={() => setLessonStep(0)}>
                  Back to lesson
                </button>
              </>
            )}

            {lessonStep === 2 && (
              <>
                <span className="kicker">REFLECTION</span>
                <h2 style={{ fontSize: '20px' }}>{activeLesson.path.lessons[activeLesson.lessonIndex].reflection}</h2>
                <p className="muted" style={{ fontSize: '13px' }}>Write your reflection below. This is optional — you can skip it and still complete the lesson.</p>
                <textarea
                  className="field"
                  style={{ width: '100%', minHeight: '100px', border: '1px solid var(--line)', borderRadius: '15px', padding: '13px', marginTop: '10px' }}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Write your reflection, or skip this step..."
                />
                <button className="primary" style={{ width: '100%', marginTop: '12px' }} onClick={handleComplete} disabled={completing}>
                  {completing ? 'Saving...' : isLessonCompleted(activeLesson.path.id, activeLesson.lessonIndex) ? 'Already completed' : 'Complete lesson (+10 XP)'}
                </button>
                <button className="textBtn" style={{ width: '100%', marginTop: '8px' }} onClick={() => setLessonStep(1)}>
                  Back to exercise
                </button>
              </>
            )}

            {/* Connection to app features — shown after completing any step */}
            {activeLesson && lessonStep < 3 && activeLesson.path.lessons[activeLesson.lessonIndex].connection && (
              <div style={{ marginTop: '16px', padding: '14px', background: '#f8f6f2', borderRadius: '14px', border: '1px solid var(--line)' }}>
                <small className="muted" style={{ display: 'block', marginBottom: '6px' }}>CONNECT THIS TO YOUR LIFE</small>
                <button className="textBtn" style={{ padding: '0', color: 'var(--green)', fontWeight: '700', fontSize: '13px' }} onClick={() => navToConnection(activeLesson.path.lessons[activeLesson.lessonIndex].connection.screen)}>
                  {activeLesson.path.lessons[activeLesson.lessonIndex].connection.label}
                </button>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  )
}
