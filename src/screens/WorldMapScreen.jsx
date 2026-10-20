import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { WORLD_MAP_DESTINATIONS, LEARNING_PATHS } from '../lib/constants.js'
import { Modal, PageHead } from '../components/ui.jsx'

export default function WorldMapScreen({ onNav }) {
  const { profile, checkins, goals, interests, awardXp, showToast } = useApp()
  const [selectedDest, setSelectedDest] = useState(null)

  const xp = profile?.xp || 0
  const unlockedCount = Math.min(WORLD_MAP_DESTINATIONS.length, 1 + Math.floor(xp / 200))

  const handleNavigate = (dest) => {
    const link = dest.links[0]
    if (link === 'today') onNav('today')
    else if (link === 'connect') onNav('connect')
    else if (link === 'create') onNav('explore')
    else onNav('explore')
  }

  return (
    <>
      <PageHead label="NOVIE WORLD" title="Your growing world." subtitle="Each destination opens as you explore. Discover new places through real activities." />

      <section className="section">
        <div className="worldMapGrid">
          {WORLD_MAP_DESTINATIONS.map((dest, i) => {
            const unlocked = i < unlockedCount
            return (
              <button
                key={dest.id}
                className={`worldDest ${unlocked ? '' : 'locked'}`}
                style={{ background: unlocked ? dest.color : '#f0eeea' }}
                onClick={() => unlocked ? setSelectedDest(dest) : showToast('Keep exploring to unlock this destination')}
              >
                <div style={{ fontSize: '36px', opacity: unlocked ? 1 : 0.3 }}>{unlocked ? dest.icon : '🔒'}</div>
                <strong style={{ display: 'block', marginTop: '8px', fontSize: '16px' }}>{dest.name}</strong>
                <small className="muted" style={{ display: 'block', marginTop: '4px', lineHeight: 1.4 }}>
                  {unlocked ? dest.desc : `${Math.max(0, (i + 1) * 200 - xp)} XP to unlock`}
                </small>
              </button>
            )
          })}
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Learning paths</h2>
          <span>Explore at your own pace</span>
        </div>
        <div className="featureGrid">
          {LEARNING_PATHS.map(path => (
            <button
              key={path.id}
              className="tile"
              onClick={() => setSelectedDest({ ...WORLD_MAP_DESTINATIONS.find(d => d.id === path.dest), learningPath: path })}
            >
              <span className="tileIcon">{path.icon}</span>
              <strong>{path.title}</strong>
              <small>{path.lessons.length} lessons</small>
              <em>Start →</em>
            </button>
          ))}
        </div>
      </section>

      <Modal open={selectedDest !== null} onClose={() => setSelectedDest(null)}>
        {selectedDest && (
          <>
            <span className="kicker">{selectedDest.icon} {selectedDest.name}</span>
            <h2>{selectedDest.name}</h2>
            <p>{selectedDest.desc}</p>

            {selectedDest.learningPath ? (
              <div style={{ marginTop: '16px' }}>
                <strong>Lessons in this path:</strong>
                <div className="toolList" style={{ marginTop: '12px' }}>
                  {selectedDest.learningPath.lessons.map((lesson, i) => (
                    <button key={i} onClick={async () => {
                      await awardXp(5, 'learning', `Completed lesson: ${lesson}`)
                      showToast('📚 +5 XP')
                    }}>
                      {i + 1}. {lesson}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="toolList" style={{ marginTop: '16px' }}>
                {selectedDest.links.map((link, i) => {
                  const labels = { today: 'Open Today', reflection: 'Self-discovery questions', habits: 'View habits', communication: 'Communication Lab', patterns: 'See my patterns', journal: 'Write a journal entry', astrology: 'Explore astrology', moon: 'Moon cycle', connect: 'Open Connect', questions: 'Question deck', compatibility: 'Compatibility', family: 'Family activities', kids: 'Kids activities', science: 'Science lessons', wellness: 'Wellness', create: 'Create something' }
                  return (
                    <button key={i} onClick={() => {
                      setSelectedDest(null)
                      if (link === 'today') onNav('today')
                      else if (link === 'connect') onNav('connect')
                      else onNav('explore')
                    }}>
                      {labels[link] || link}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  )
}
