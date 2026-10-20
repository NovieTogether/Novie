import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { MOODS } from '../lib/constants.js'
import { Modal } from './ui.jsx'
import * as api from '../lib/api.js'

export default function CheckInModal({ open, onClose }) {
  const { profile, showToast, refreshCheckins, refreshProfile, awardXp } = useApp()
  const [mood, setMood] = useState('')
  const [energy, setEnergy] = useState(60)
  const [stress, setStress] = useState(30)
  const [connection, setConnection] = useState(60)
  const [note, setNote] = useState('')

  const save = async () => {
    const today = new Date().toISOString().split('T')[0]
    await api.addCheckin({
      mood, energy, stress, connection, note: note.trim(),
    })
    const profileData = await api.getProfile()
    const lastCheckin = profileData?.last_checkin
    let newStreak = profileData?.streak || 0
    if (lastCheckin) {
      const last = new Date(lastCheckin)
      const diff = Math.floor((new Date(today) - last) / 86400000)
      if (diff === 1) newStreak += 1
      else if (diff > 1) newStreak = 1
    } else {
      newStreak = 1
    }
    await api.updateProfile({ last_checkin: today, streak: newStreak })
    await awardXp(15, 'checkin', 'Daily check-in')
    await refreshCheckins()
    await refreshProfile()
    showToast('🌱 Check-in saved. +15 XP')
    setMood(''); setNote(''); setEnergy(60); setStress(30); setConnection(60)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <span className="kicker">TODAY'S CHECK-IN</span>
      <h2>How are you arriving?</h2>
      <div className="moodGrid">
        {MOODS.map(m => (
          <button
            key={m.label}
            className={`moodBtn ${mood === m.label ? 'chosen' : ''}`}
            onClick={() => setMood(m.label)}
          >
            <b>{m.icon}</b>
            <small>{m.label}</small>
          </button>
        ))}
      </div>

      <div className="sliderRow">
        <label>Energy <span>{energy}</span></label>
        <input type="range" min="0" max="100" value={energy} onChange={e => setEnergy(+e.target.value)} />
      </div>
      <div className="sliderRow">
        <label>Stress <span>{stress}</span></label>
        <input type="range" min="0" max="100" value={stress} onChange={e => setStress(+e.target.value)} />
      </div>
      <div className="sliderRow">
        <label>Connection <span>{connection}</span></label>
        <input type="range" min="0" max="100" value={connection} onChange={e => setConnection(+e.target.value)} />
      </div>

      <div className="field">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What would make the next hour 5% easier? Optional."
        />
      </div>

      <button className="primary" style={{ width: '100%', marginTop: '10px' }} onClick={save}>
        Save check-in · +15 XP
      </button>
      <button style={{ width: '100%', marginTop: '8px' }} onClick={onClose}>Not today</button>
    </Modal>
  )
}
