import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import * as api from '../lib/api.js'
import { ROLES, INTERESTS } from '../lib/constants.js'

export default function Onboarding() {
  const { showToast, refreshProfile, refreshInterests } = useApp()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [selectedInterests, setSelectedInterests] = useState([])

  const finish = async () => {
    const profile = await api.getProfile()
    if (profile) {
      await api.updateProfile({
        name: name.trim(),
        role: role || 'Just exploring',
        onboarded: true,
      })
    } else {
      await api.createProfile({
        name: name.trim(),
        role: role || 'Just exploring',
        onboarded: true,
      })
    }
    for (const interest of selectedInterests) {
      await api.addInterest(interest)
    }
    await refreshProfile()
    await refreshInterests()
    showToast('🌱 Welcome to Novie!')
  }

  return (
    <div className="modalWrap show">
      <div className="modal" style={{ textAlign: 'center' }}>
        <img src="novie-logo.png" alt="Novie" style={{ width: '90px', margin: '0 auto 16px', display: 'block' }} />
        <span className="kicker">WELCOME TO NOVIE</span>
        <h2>Know yourself. Grow together.</h2>

        {step === 0 && (
          <>
            <p>This is not a test. Pick what brings you here, then wander.</p>
            <div className="roleGrid">
              {ROLES.map(r => (
                <button
                  key={r}
                  className={`roleBtn ${role === r ? 'chosen' : ''}`}
                  onClick={() => setRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              className="primary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setStep(1)}
              disabled={!role}
            >
              Continue
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <p>What should Novie call you? (Optional)</p>
            <input
              className="field"
              style={{ width: '100%', border: '1px solid var(--line)', borderRadius: '15px', padding: '13px', margin: '12px 0' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or nickname"
            />
            <p>What are you curious about? Pick a few.</p>
            <div className="interestGrid" style={{ marginTop: '12px' }}>
              {INTERESTS.map(i => (
                <button
                  key={i}
                  className={`interest ${selectedInterests.includes(i) ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedInterests(prev =>
                      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                    )
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
            <button
              className="primary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={finish}
            >
              Start exploring
            </button>
          </>
        )}
      </div>
    </div>
  )
}
