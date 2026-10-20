import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Modal } from './ui.jsx'
import * as api from '../lib/api.js'

const MEMORY_CATEGORIES = [
  { id: 'preference', label: 'Preferences', desc: 'Things you like and dislike' },
  { id: 'goal', label: 'Goals', desc: 'What you are working toward' },
  { id: 'value', label: 'Values', desc: 'What matters to you' },
  { id: 'fact', label: 'Personal facts', desc: 'Information you have shared' },
  { id: 'pattern', label: 'Observed patterns', desc: 'Things Novie noticed over time' },
]

const CATEGORY_CONTROLS = [
  { id: 'checkins', dbKey: 'checkins_enabled', label: 'Check-ins and mood history', desc: 'Energy, stress, mood, and connection data' },
  { id: 'journal', dbKey: 'journal_enabled', label: 'Journal entries', desc: 'Your written reflections' },
  { id: 'goals', dbKey: 'goals_enabled', label: 'Goals and habits', desc: 'What you are working on' },
  { id: 'habits', dbKey: 'habits_enabled', label: 'Habits detail', desc: 'Habit names and streaks' },
  { id: 'interests', dbKey: 'interests_enabled', label: 'Interests', desc: 'Topics you are curious about' },
  { id: 'reflections', dbKey: 'reflections_enabled', label: 'Reflections', desc: 'Self-discovery answers' },
  { id: 'astrology', dbKey: 'astrology_enabled', label: 'Astrology', desc: 'Birth info and astrology reflections' },
  { id: 'memories', dbKey: 'memories_enabled', label: 'Approved memories', desc: 'Information you have let Novie remember' },
  { id: 'artwork', dbKey: 'artwork_enabled', label: 'Artwork', desc: 'Your creative work count' },
]

export default function MemoryModal({ open, onClose }) {
  const { memories, aiPrivacy, refreshMemories, refreshAiPrivacy, showToast } = useApp()
  const [newMemory, setNewMemory] = useState('')
  const [newCategory, setNewCategory] = useState('preference')
  const [toggles, setToggles] = useState(null)
  const [savingToggles, setSavingToggles] = useState(false)

  useEffect(() => {
    if (!open) return
    if (aiPrivacy) {
      setToggles({
        checkins_enabled: aiPrivacy.checkins_enabled ?? true,
        journal_enabled: aiPrivacy.journal_enabled ?? true,
        goals_enabled: aiPrivacy.goals_enabled ?? true,
        habits_enabled: aiPrivacy.habits_enabled ?? true,
        interests_enabled: aiPrivacy.interests_enabled ?? true,
        reflections_enabled: aiPrivacy.reflections_enabled ?? true,
        astrology_enabled: aiPrivacy.astrology_enabled ?? false,
        memories_enabled: aiPrivacy.memories_enabled ?? true,
        artwork_enabled: aiPrivacy.artwork_enabled ?? true,
      })
    } else {
      setToggles({
        checkins_enabled: true, journal_enabled: true, goals_enabled: true,
        habits_enabled: true, interests_enabled: true, reflections_enabled: true,
        astrology_enabled: false, memories_enabled: true, artwork_enabled: true,
      })
    }
  }, [open, aiPrivacy])

  const addMemory = async () => {
    if (!newMemory.trim()) return
    await api.addMemory({
      content: newMemory.trim(),
      category: newCategory,
      source: 'user',
      approved: true,
    })
    await refreshMemories()
    showToast('Memory saved')
    setNewMemory('')
  }

  const removeMemory = async (id) => {
    await api.deleteMemory(id)
    await refreshMemories()
    showToast('Memory removed')
  }

  const toggleCategory = async (dbKey) => {
    if (!toggles) return
    const newVal = !toggles[dbKey]
    setToggles(prev => ({ ...prev, [dbKey]: newVal }))
    setSavingToggles(true)
    await api.saveAiPrivacySettings({ [dbKey]: newVal })
    await refreshAiPrivacy()
    setSavingToggles(false)
    showToast(`${newVal ? 'Enabled' : 'Disabled'} — Novie will ${newVal ? 'use' : 'not use'} this data`)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <span className="kicker">AI MEMORY & PRIVACY</span>
      <h2>What Novie remembers is up to you.</h2>
      <p className="muted">Review, add, or delete anything Novie knows. Control which categories of your information the AI can use. Changes take effect immediately.</p>

      <div style={{ marginTop: '18px' }}>
        <strong>Approved memories ({memories.length})</strong>
        {memories.length === 0 ? (
          <p className="muted" style={{ marginTop: '8px' }}>No memories saved yet. Add something you want Novie to remember.</p>
        ) : (
          <div style={{ marginTop: '10px' }}>
            {memories.map(m => (
              <div key={m.id} className="patternBox" style={{ alignItems: 'flex-start' }}>
                <div>
                  <span style={{ display: 'block' }}>{m.content}</span>
                  <small className="muted" style={{ fontWeight: '400' }}>
                    {MEMORY_CATEGORIES.find(c => c.id === m.category)?.label || m.category} · {m.source === 'user' ? 'You shared' : 'Novie noticed'}
                  </small>
                </div>
                <button className="textBtn" style={{ color: '#c44' }} onClick={() => removeMemory(m.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="field" style={{ marginTop: '18px' }}>
        <label>Add a memory</label>
        <textarea
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          placeholder="Something you want Novie to remember about you..."
          style={{ minHeight: '80px' }}
        />
        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ marginTop: '8px' }}>
          {MEMORY_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.label} — {c.desc}</option>
          ))}
        </select>
        <button className="primary" style={{ marginTop: '8px' }} onClick={addMemory}>Save memory</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <strong>What Novie can access</strong>
        <p className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>
          Toggle which categories Novie can use when responding to you. Disabling a category does not delete the data — it means the AI will not reference it. Changes are saved and enforced immediately.
        </p>
        <div className="toolList" style={{ marginTop: '12px' }}>
          {CATEGORY_CONTROLS.map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.dbKey)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <span style={{ display: 'block' }}>{cat.label}</span>
                <small className="muted" style={{ fontWeight: '400' }}>{cat.desc}</small>
              </div>
              <span style={{ fontWeight: '800', color: toggles?.[cat.dbKey] ? 'var(--green)' : 'var(--muted)' }}>
                {toggles?.[cat.dbKey] ? 'On' : 'Off'}
              </span>
            </button>
          ))}
        </div>
        {savingToggles && <p className="muted" style={{ fontSize: '12px', marginTop: '8px' }}>Saving...</p>}
      </div>

      <div style={{ marginTop: '16px', padding: '14px', background: '#fff', borderRadius: '14px', border: '1px solid var(--line)' }}>
        <small className="muted">
          Novie does not automatically turn every journal entry or sensitive disclosure into a permanent memory.
          Permission to use one category does not grant permission to use others.
          You can correct misunderstandings and delete anything at any time.
        </small>
      </div>
    </Modal>
  )
}
