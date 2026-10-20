import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PLAY_TILES, WOULD_YOU_RATHER, CONNECTION_QUESTIONS, KID_ACTIVITIES } from '../lib/constants.js'
import { Modal, Card, PageHead, Tile } from '../components/ui.jsx'

export default function PlayScreen({ onNav }) {
  const { awardXp, showToast } = useApp()
  const [activeModal, setActiveModal] = useState(null)
  const [wyrIndex, setWyrIndex] = useState(0)
  const [qIndex, setQIndex] = useState(0)

  const nextWyr = async () => {
    await awardXp(3, 'play', 'Would You Rather round')
    setWyrIndex((wyrIndex + 1) % WOULD_YOU_RATHER.length)
    showToast('🎲 +3 XP')
  }

  const nextQuestion = async () => {
    await awardXp(5, 'play', 'Connection question')
    setQIndex((qIndex + 1) % CONNECTION_QUESTIONS.length)
    showToast('💛 +5 XP for a good question')
  }

  const doChallenge = async (challenge) => {
    await awardXp(10, 'challenge', `Challenge: ${challenge}`)
    showToast(`🏆 +10 XP · ${challenge}`)
    setActiveModal(null)
  }

  return (
    <>
      <PageHead label="PLAY" title="Connection can be fun." subtitle="Play for two minutes or twenty. Stop whenever you want." />

      <section className="section">
        <div className="featureGrid">
          {PLAY_TILES.map(t => (
            <Tile key={t.screen} icon={t.icon} title={t.title} desc={t.desc}
              gradient={t.gradient}
              onClick={() => {
                if (t.screen === 'wyr') { setWyrIndex(0); setActiveModal('wyr') }
                else if (t.screen === 'appreciation') setActiveModal('appreciation')
                else if (t.screen === 'questions') { setQIndex(0); setActiveModal('questions') }
                else if (t.screen === 'challenge') setActiveModal('challenge')
              }} />
          ))}
        </div>
      </section>

      {/* Would You Rather */}
      <Modal open={activeModal === 'wyr'} onClose={() => setActiveModal(null)}>
        <span className="kicker">PLAY · WOULD YOU RATHER</span>
        <h2>{WOULD_YOU_RATHER[wyrIndex]}</h2>
        <div className="twoCol" style={{ marginTop: '16px' }}>
          <button className="primary" onClick={nextWyr}>Option A</button>
          <button className="primary" onClick={nextWyr}>Option B</button>
        </div>
        <button style={{ width: '100%', marginTop: '12px' }} onClick={() => setActiveModal(null)}>Stop playing</button>
      </Modal>

      {/* Appreciation */}
      <Modal open={activeModal === 'appreciation'} onClose={() => setActiveModal(null)}>
        <span className="kicker">APPRECIATION</span>
        <h2>Say one thing you genuinely appreciate.</h2>
        <div className="field" style={{ marginTop: '16px' }}>
          <textarea id="apText" placeholder="I appreciate..." style={{ minHeight: '120px' }} />
        </div>
        <button className="primary" style={{ width: '100%' }}
          onClick={() => {
            const text = document.querySelector('#apText')?.value || ''
            navigator.clipboard?.writeText(text)
            showToast('💛 Ready to share')
            setActiveModal(null)
          }}>
          Copy message
        </button>
      </Modal>

      {/* Question Deck */}
      <Modal open={activeModal === 'questions'} onClose={() => setActiveModal(null)}>
        <span className="kicker">QUESTION DECK</span>
        <h2>{CONNECTION_QUESTIONS[qIndex]}</h2>
        <p className="muted">Take turns. Listen more than you answer.</p>
        <button className="primary" style={{ width: '100%', marginTop: '16px' }} onClick={nextQuestion}>Next question · +5 XP</button>
        <button style={{ width: '100%', marginTop: '8px' }} onClick={() => setActiveModal(null)}>Done</button>
      </Modal>

      {/* Mini Challenge */}
      <Modal open={activeModal === 'challenge'} onClose={() => setActiveModal(null)}>
        <span className="kicker">OPTIONAL CHALLENGE</span>
        <h2>Pick a tiny quest.</h2>
        <div className="toolList" style={{ marginTop: '16px' }}>
          {['Send an appreciation', 'Take a walk together', 'Ask one curious question', 'Try something neither of you usually picks'].map(c => (
            <button key={c} onClick={() => doChallenge(c)}>🏆 {c}</button>
          ))}
        </div>
      </Modal>
    </>
  )
}
