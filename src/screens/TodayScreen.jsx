import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { MOODS } from '../lib/constants.js'
import { buildContext, generateInsight, getDailyReflection, getDailyAffirmation } from '../lib/ai.js'
import { Modal, Card } from '../components/ui.jsx'
import NovieModal from '../components/NovieModal.jsx'
import CheckInModal from '../components/CheckInModal.jsx'
import CreateModal from '../components/CreateModal.jsx'
import * as api from '../lib/api.js'

export default function TodayScreen({ onNav }) {
  const { profile, checkins, goals, journal, reflections, memories, interests, awardXp, showToast, refreshProfile, refreshCheckins } = useApp()
  const [novieOpen, setNovieOpen] = useState(false)
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const ctx = useMemo(() => buildContext({ profile, checkins, journal, goals, reflections, memories, interests }), [profile, checkins, journal, goals, reflections, memories, interests])
  const insights = useMemo(() => generateInsight(ctx), [ctx])
  const dailyReflection = useMemo(() => getDailyReflection(ctx), [ctx])
  const affirmation = useMemo(() => getDailyAffirmation(), [])

  const name = profile?.name || ''
  const hello = name ? `Good to see you, ${name}.` : 'Welcome to Novie.'
  const xp = profile?.xp || 0
  const leaves = profile?.leaves || 1
  const streak = profile?.streak || 0
  const latestCheckin = checkins[0]
  const energy = latestCheckin?.energy ?? 60
  const stress = latestCheckin?.stress ?? 30
  const treeEmoji = leaves > 12 ? '🌳🌳🌳' : leaves > 6 ? '🌳🌳' : leaves > 3 ? '🌳' : '🌱'

  const quickPaths = [
    { icon: '🌿', label: 'Understand me', text: 'Help me understand myself.' },
    { icon: '❤️', label: 'Relationship', text: 'Help me think through a relationship.' },
    { icon: '🧭', label: "I'm stuck", text: "I'm stuck and need a smaller next step." },
    { icon: '🌙', label: 'Tiny reset', text: 'I need a tiny reset.' },
    { icon: '🎲', label: 'Something fun', text: 'Give me something fun.' },
    { icon: '✨', label: 'Surprise me', text: 'Surprise me.' },
  ]

  return (
    <>
      <section className="welcome">
        <div>
          <span className="kicker">KNOW YOURSELF. GROW TOGETHER.</span>
          <h1>{hello} 🌱</h1>
          <p className="lead">Novie helps you understand yourself, connect with people who matter, and discover what helps you grow.</p>
          <div className="actions">
            <button className="primary" onClick={() => setCheckinOpen(true)}>Check in · +15 XP</button>
            <button className="secondary" onClick={() => setNovieOpen(true)}>✦ Ask Novie</button>
          <button className="secondary" onClick={() => setCreateOpen(true)}>🎨 Create</button>
          </div>
        </div>
        <div className="treeCard">
          <div className="bigTree">{treeEmoji}</div>
          <strong>Your Novie is growing</strong>
          <small>{xp} XP · {leaves} leaves · {streak} day streak</small>
          <button className="textBtn" onClick={() => onNav('grow')}>See my growth →</button>
        </div>
      </section>

      <section className="thought section">
        <div>
          <span className="kicker">MEET NOVIE</span>
          <h2>{stress > 70 ? "Let's keep today gentle." : 'What feels worth exploring?'}</h2>
          <p className="lead">{energy < 35 ? 'Your energy looks low. We can do something tiny, playful, or nothing at all.' : 'Choose a direction, change your mind, or stop whenever you want. There is no path you have to finish.'}</p>
          <div className="chips" style={{ marginTop: '14px' }}>
            {quickPaths.map(p => (
              <button key={p.label} className="chip" onClick={() => setNovieOpen(true)}>{p.icon} {p.label}</button>
            ))}
          </div>
        </div>
        <div className="spark">✦</div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Novie noticed</h2>
          <span>Suggestions are clues, not conclusions.</span>
        </div>
        <div className="twoCol">
          {insights.slice(0, 2).map((ins, i) => (
            <Card key={i}>
              <span className="kicker">{ins.type === 'welcome' ? 'GETTING STARTED' : ins.type === 'energy' ? 'ENERGY' : ins.type === 'stress' ? 'STRESS' : ins.type === 'mood' ? 'MOOD PATTERN' : ins.type === 'goals' ? 'GOALS' : 'INTERESTS'}</span>
              <h2 style={{ fontSize: '20px', marginTop: '8px' }}>{ins.text}</h2>
              {ins.type === 'goals' && <button className="textBtn" onClick={() => onNav('grow')}>Open Grow →</button>}
              {ins.type === 'interests' && <button className="textBtn" onClick={() => onNav('explore')}>Open Explore →</button>}
            </Card>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Today's affirmation</h2>
        </div>
        <Card className="pattern">
          <span className="kicker">DAILY AFFIRMATION</span>
          <h2 style={{ fontSize: '22px', marginTop: '8px' }}>{affirmation}</h2>
        </Card>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Today's reflection</h2>
        </div>
        <Card className="pattern">
          <span className="kicker">DAILY PROMPT</span>
          <h2 style={{ fontSize: '22px', marginTop: '8px' }}>{dailyReflection}</h2>
          <p>You do not have to answer. You can save what feels worth keeping.</p>
          <button className="primary" onClick={() => onNav('grow')} style={{ marginTop: '10px' }}>Reflect in Grow →</button>
        </Card>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <h2>Quick stats</h2>
        </div>
        <div className="statsGrid">
          <Card className="stat">
            <span>Energy</span>
            <b>{energy}%</b>
            <div className="miniProgress"><i style={{ width: energy + '%' }} /></div>
          </Card>
          <Card className="stat">
            <span>Stress</span>
            <b>{stress}%</b>
            <div className="miniProgress"><i style={{ width: stress + '%' }} /></div>
          </Card>
          <Card className="stat">
            <span>Growth</span>
            <b>{xp % 100} XP</b>
            <div className="miniProgress"><i style={{ width: (xp % 100) + '%' }} /></div>
          </Card>
          <Card className="stat">
            <span>Streak</span>
            <b>{streak} days</b>
            <div className="miniProgress"><i style={{ width: Math.min(100, streak * 5) + '%' }} /></div>
          </Card>
        </div>
      </section>

      <CheckInModal open={checkinOpen} onClose={() => setCheckinOpen(false)} />
      <NovieModal open={novieOpen} onClose={() => setNovieOpen(false)} onNav={onNav} />
      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
