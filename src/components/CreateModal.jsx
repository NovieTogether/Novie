import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { EMOTIONS_CREATE, CREATIVE_ACTIVITIES } from '../lib/constants.js'
import { getCreativeSuggestion } from '../lib/ai.js'
import { Modal } from './ui.jsx'
import DrawingCanvas from './DrawingCanvas.jsx'
import * as api from '../lib/api.js'

export default function CreateModal({ open, onClose }) {
  const { awardXp, showToast } = useApp()
  const [step, setStep] = useState('choose')
  const [selectedEmotion, setSelectedEmotion] = useState(null)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [artTitle, setArtTitle] = useState('')

  const pickEmotion = (emotionId) => {
    setSelectedEmotion(emotionId)
    const suggestion = getCreativeSuggestion(emotionId, null)
    if (suggestion) {
      setSelectedActivity(suggestion.activity.id)
      setStep('draw')
    }
  }

  const pickActivity = (activityId) => {
    setSelectedActivity(activityId)
    setStep('draw')
  }

  const saveArtwork = async (dataUrl, templateId) => {
    const activityLabel = templateId
      ? `coloring_${templateId}`
      : (selectedActivity || 'free')
    await api.addArtwork({
      title: artTitle.trim() || `${CREATIVE_ACTIVITIES.find(a => a.id === selectedActivity)?.label || 'Untitled'}`,
      image_data: dataUrl,
      mood_tag: selectedEmotion || '',
      activity_type: activityLabel,
    })
    await awardXp(8, 'creative', 'Created artwork')
    showToast('🎨 Artwork saved. +8 XP')
  }

  const handleClose = () => {
    setStep('choose')
    setSelectedEmotion(null)
    setSelectedActivity(null)
    setArtTitle('')
    onClose()
  }

  const currentActivity = CREATIVE_ACTIVITIES.find(a => a.id === selectedActivity)
  const currentEmotion = EMOTIONS_CREATE.find(e => e.id === selectedEmotion)

  return (
    <Modal open={open} onClose={handleClose}>
      {step === 'choose' && (
        <>
          <span className="kicker">CREATE FOR HOW YOU FEEL</span>
          <h2>You do not have to find the right words.</h2>
          <p className="muted">Pick how you feel, or skip and just create. Art is for enjoyment and self-reflection — no artistic ability needed.</p>

          <div className="emotionGrid" style={{ marginTop: '16px' }}>
            {EMOTIONS_CREATE.map(e => (
              <button
                key={e.id}
                className="moodBtn"
                onClick={() => pickEmotion(e.id)}
              >
                <b>{e.icon}</b>
                <small>{e.label}</small>
              </button>
            ))}
          </div>

          <div style={{ marginTop: '18px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
            <p className="muted" style={{ marginBottom: '10px' }}>Or just start creating:</p>
            <div className="styleGrid">
              {CREATIVE_ACTIVITIES.map(a => (
                <button key={a.id} className="styleGridBtn" onClick={() => pickActivity(a.id)}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {step === 'draw' && (
        <>
          <span className="kicker">{currentActivity?.icon} {currentActivity?.label}</span>
          <h2>{currentActivity?.desc}</h2>
          {currentEmotion && (
            <div className="rewrite" style={{ background: '#fff4e3', borderColor: '#fff0bf' }}>
              <p style={{ color: 'var(--ink)', margin: 0 }}>
                <strong>{currentEmotion.icon} {currentEmotion.label}.</strong> {currentEmotion.reason}
              </p>
            </div>
          )}
          <p className="muted" style={{ marginTop: '10px' }}>
            This is not a test of artistic ability. Draw freely, breathe, and let your hand move without overthinking.
          </p>

          <div className="field" style={{ marginTop: '14px' }}>
            <input
              value={artTitle}
              onChange={e => setArtTitle(e.target.value)}
              placeholder="Title (optional)"
            />
          </div>

          <DrawingCanvas onSave={saveArtwork} activityType={selectedActivity} />

          <div className="chips" style={{ marginTop: '16px' }}>
            <button className="chip" onClick={() => setStep('choose')}>← Back</button>
            <button className="chip" onClick={handleClose}>Done</button>
          </div>
        </>
      )}
    </Modal>
  )
}
