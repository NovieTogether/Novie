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
  { id: 'checkins', label: 'Check-ins and mood history', desc: 'Energy, stress, mood, and connection data' },
  { id: 'journal', label: 'Journal entries', desc: 'Your written reflections' },
  { id: 'goals', label: 'Goals and habits', desc: 'What you are working on' },
  { id: 'interests', label: 'Interests', desc: 'Topics you are curious about' },
  { id: 'astrology', label: 'Astrology', desc: 'Birth info and astrology reflections' },
  { id: 'memories', label: 'Approved memories', desc: 'Information you have let Novie remember' },
]

export default function MemoryModal({ open, onClose }) {
  const { memories, refreshMemories, showToast } = useApp()
  const [newMemory, setNewMemory] = useState('')
  const [newCategory, setNewCategory] = useState('preference')
  const [enabledCategories, setEnabledCategories] = useState({
    checkins: true, journal: true, goals: true, interests: true, astrology: false, memories: true,
  })

  const addMemory = async () => {
    if (!newMemory.trim()) return
    await api.addMemory({
      content: newMemory.trim(),
      category: newCategory,
      source: 'user',
      approved: true,
    })
    await refreshMemories()
    showToast('💾 Memory saved')
    setNewMemory('')
  }

  const removeMemory = async (id) => {
    await api.deleteMemory(id)
    await refreshMemories()
    showToast('Memory removed')
  }

  const toggleCategory = (catId) => {
    setEnabledCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
    showToast(`${enabledCategories[catId] ? 'Disabled' : 'Enabled'} ${CATEGORY_CONTROLS.find(c => c.id === catId)?.label}`)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <span className="kicker">AI MEMORY & PRIVACY</span>
      <h2>What Novie remembers is up to you.</h2>
      <p className="muted">Review, add, or delete anything Novie knows. Control which categories of your information the AI can use.</p>

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
          onChange={e => setNewMemory(e.target.value)}
          placeholder="Something you want Novie to remember about you..."
          style={{ minHeight: '80px' }}
        />
        <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ marginTop: '8px' }}>
          {MEMORY_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.label} — {c.desc}</option>
          ))}
        </select>
        <button className="primary" style={{ marginTop: '8px' }} onClick={addMemory}>Save memory</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <strong>What Novie can access</strong>
        <p className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>
          Toggle which categories Novie can use when responding to you. Disabling a category does not delete the data — it just means the AI will not reference it.
        </p>
        <div className="toolList" style={{ marginTop: '12px' }}>
          {CATEGORY_CONTROLS.map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <span style={{ display: 'block' }}>{cat.label}</span>
                <small className="muted" style={{ fontWeight: '400' }}>{cat.desc}</small>
              </div>
              <span style={{ fontWeight: '800', color: enabledCategories[cat.id] ? 'var(--green)' : 'var(--muted)' }}>
                {enabledCategories[cat.id] ? 'On' : 'Off'}
              </span>
            </button>
          ))}
        </div>
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
