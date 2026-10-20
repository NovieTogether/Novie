import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as api from '../lib/api.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [goals, setGoals] = useState([])
  const [journal, setJournal] = useState([])
  const [reflections, setReflections] = useState([])
  const [connections, setConnections] = useState([])
  const [interests, setInterests] = useState([])
  const [memories, setMemories] = useState([])
  const [gardenEvents, setGardenEvents] = useState([])
  const [achievements, setAchievements] = useState([])
  const [habits, setHabits] = useState([])
  const [artwork, setArtwork] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  // Load everything on mount
  const loadAll = useCallback(async () => {
    const [p, c, g, j, r, con, i, m, ge, a, h, art] = await Promise.all([
      api.getProfile(),
      api.getCheckins(30),
      api.getGoals(),
      api.getJournalEntries(50),
      api.getReflections(50),
      api.getConnections(),
      api.getInterests(),
      api.getMemories(),
      api.getGardenEvents(100),
      api.getAchievements(),
      api.getHabits(),
      api.getArtwork(50),
    ])
    setProfile(p)
    setCheckins(c)
    setGoals(g)
    setJournal(j)
    setReflections(r)
    setConnections(con)
    setInterests(i)
    setMemories(m)
    setGardenEvents(ge)
    setAchievements(a)
    setHabits(h)
    setArtwork(art)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const refreshProfile = useCallback(async () => {
    const p = await api.getProfile()
    setProfile(p)
  }, [])

  const refreshCheckins = useCallback(async () => {
    const c = await api.getCheckins(30)
    setCheckins(c)
  }, [])

  const refreshGoals = useCallback(async () => {
    const g = await api.getGoals()
    setGoals(g)
  }, [])

  const refreshJournal = useCallback(async () => {
    const j = await api.getJournalEntries(50)
    setJournal(j)
  }, [])

  const refreshReflections = useCallback(async () => {
    const r = await api.getReflections(50)
    setReflections(r)
  }, [])

  const refreshConnections = useCallback(async () => {
    const c = await api.getConnections()
    setConnections(c)
  }, [])

  const refreshInterests = useCallback(async () => {
    const i = await api.getInterests()
    setInterests(i)
  }, [])

  const refreshMemories = useCallback(async () => {
    const m = await api.getMemories()
    setMemories(m)
  }, [])

  const refreshGarden = useCallback(async () => {
    const ge = await api.getGardenEvents(100)
    setGardenEvents(ge)
  }, [])

  const refreshHabits = useCallback(async () => {
    const h = await api.getHabits()
    setHabits(h)
  }, [])

  const awardXp = useCallback(async (amount, activityType, description) => {
    await api.awardXp(amount, activityType, description)
    await refreshProfile()
    await refreshGarden()
  }, [refreshProfile, refreshGarden])

  const value = {
    profile, checkins, goals, journal, reflections, connections, interests,
    memories, gardenEvents, achievements, habits, artwork, loading, toast, showToast,
    refreshProfile, refreshCheckins, refreshGoals, refreshJournal,
    refreshReflections, refreshConnections, refreshInterests, refreshMemories,
    refreshGarden, refreshHabits, awardXp, loadAll,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
