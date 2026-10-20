import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { PLANT_TYPES, SEASONAL_THEMES, PLANT_STAGES } from '../lib/constants.js'
import { recommendPlant } from '../lib/ai.js'
import { Modal } from './ui.jsx'
import * as api from '../lib/api.js'

export default function GardenModal({ open, onClose }) {
  const { profile, interests, goals, checkins, awardXp, showToast } = useApp()
  const [plantType, setPlantType] = useState('seedling')
  const [seasonalTheme, setSeasonalTheme] = useState('none')
  const [autoSeasonal, setAutoSeasonal] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showRecommendation, setShowRecommendation] = useState(false)

  useEffect(() => {
    if (!open || loaded) return
    const load = async () => {
      const prefs = await api.getGardenPrefs()
      if (prefs) {
        setPlantType(prefs.plant_type || 'seedling')
        setSeasonalTheme(prefs.seasonal_theme || 'none')
        setAutoSeasonal(prefs.auto_seasonal || false)
      }
      setLoaded(true)
    }
    load()
  }, [open, loaded])

  const save = async () => {
    await api.saveGardenPrefs({ plant_type: plantType, seasonal_theme: seasonalTheme, auto_seasonal: autoSeasonal })
    showToast('🌱 Garden preferences saved')
    setLoaded(false)
    onClose()
  }

  const xp = profile?.xp || 0
  const leaves = profile?.leaves || 1
  const streak = profile?.streak || 0

  const stage = [...PLANT_STAGES].reverse().find(s => leaves >= s.minLeaves) || PLANT_STAGES[0]
  const plant = PLANT_TYPES.find(p => p.id === plantType) || PLANT_TYPES[0]
  const season = SEASONAL_THEMES.find(s => s.id === seasonalTheme)

  const getRecommendation = () => {
    const ctx = {
      interestNames: interests?.map(i => i.name) || [],
      goalTitles: goals?.filter(g => g.status === 'active').map(g => g.title) || [],
      checkinCount: checkins?.length || 0,
    }
    const rec = recommendPlant(ctx)
    if (rec) {
      setShowRecommendation(rec)
    }
  }

  const plantDisplay = seasonalTheme === 'halloween' ? '🎃' :
    seasonalTheme === 'christmas' ? '🎄' :
    seasonalTheme === 'autumn' ? '🍂' :
    seasonalTheme === 'winter' ? '❄️' :
    seasonalTheme === 'spring' ? '🌸' :
    seasonalTheme === 'summer' ? '🌻' :
    plant.icon

  return (
    <Modal open={open} onClose={() => { setLoaded(false); onClose() }}>
      <span className="kicker">YOUR GARDEN</span>
      <h2>Make your Garden yours.</h2>

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <div style={{ fontSize: '80px' }}>{plantDisplay}</div>
        <strong style={{ fontSize: '20px', display: 'block', marginTop: '8px' }}>{plant.name}</strong>
        <small className="muted">{stage.label} · {leaves} leaves · {xp} XP</small>
        {season && seasonalTheme !== 'none' && (
          <small className="muted" style={{ display: 'block', marginTop: '4px' }}>{season.icon} {season.name} theme</small>
        )}
      </div>

      <div className="field">
        <label>Choose your plant</label>
        <p className="muted" style={{ fontSize: '13px', marginBottom: '8px' }}>
          {plant.desc} Changing plants never affects your XP, achievements, or growth history.
        </p>
        <div className="interestGrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {PLANT_TYPES.map(p => (
            <button
              key={p.id}
              className={`interest ${plantType === p.id ? 'selected' : ''}`}
              onClick={() => setPlantType(p.id)}
              style={{ textAlign: 'center', display: 'grid', placeItems: 'center', gap: '4px' }}
            >
              <div style={{ fontSize: '28px' }}>{p.icon}</div>
              <strong style={{ fontSize: '13px' }}>{p.name}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Seasonal theme (optional)</label>
        <p className="muted" style={{ fontSize: '13px', marginBottom: '8px' }}>
          Holiday visuals are a layer over your permanent Garden. You can return to your usual plant anytime.
        </p>
        <div className="interestGrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {SEASONAL_THEMES.map(s => (
            <button
              key={s.id}
              className={`interest ${seasonalTheme === s.id ? 'selected' : ''}`}
              onClick={() => setSeasonalTheme(s.id)}
              style={{ textAlign: 'center', display: 'grid', placeItems: 'center', gap: '4px' }}
            >
              <div style={{ fontSize: '24px' }}>{s.icon}</div>
              <strong style={{ fontSize: '11px' }}>{s.name}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={autoSeasonal}
            onChange={e => setAutoSeasonal(e.target.checked)}
            style={{ width: 'auto' }}
          />
          Automatically suggest seasonal themes
        </label>
      </div>

      <button className="secondary" style={{ width: '100%', marginBottom: '10px' }} onClick={getRecommendation}>
        ✦ Ask Novie to recommend a plant
      </button>

      {showRecommendation && (
        <div className="rewrite" style={{ background: '#fff4e3' }}>
          <strong>Novie's recommendation: {PLANT_TYPES.find(p => p.id === showRecommendation.plantId)?.icon} {PLANT_TYPES.find(p => p.id === showRecommendation.plantId)?.name}</strong>
          <p style={{ color: 'var(--ink)', marginTop: '8px' }}>
            {showRecommendation.reasons.join(' ')} This is a suggestion, not a definition of who you are. You can accept, decline, or pick something completely different.
          </p>
          <div className="chips" style={{ marginTop: '10px' }}>
            <button className="chip" onClick={() => { setPlantType(showRecommendation.plantId); setShowRecommendation(false); showToast('🌱 Plant updated') }}>Accept</button>
            <button className="chip" onClick={() => setShowRecommendation(false)}>Keep my choice</button>
          </div>
        </div>
      )}

      <button className="primary" style={{ width: '100%', marginTop: '12px' }} onClick={save}>Save Garden preferences</button>

      <div style={{ marginTop: '16px', padding: '14px', background: '#fff', borderRadius: '14px', border: '1px solid var(--line)' }}>
        <small className="muted">
          Your XP ({xp}), leaves ({leaves}), achievements, and growth history are permanent.
          Changing your plant or theme never resets your progress.
          Returning after a break is always a positive step — never a failure.
        </small>
      </div>
    </Modal>
  )
}
