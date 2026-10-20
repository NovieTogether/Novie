import { supabase } from './supabase.js'

// Profile
export async function getProfile() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1).maybeSingle()
  if (error) { console.error('getProfile', error); return null }
  return data
}

export async function createProfile(profile) {
  const { data, error } = await supabase.from('profiles').insert(profile).select().maybeSingle()
  if (error) console.error('createProfile', error)
  return data
}

export async function updateProfile(updates) {
  const { data: existing } = await supabase.from('profiles').select('id').limit(1).maybeSingle()
  if (!existing) {
    return createProfile(updates)
  }
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select()
    .maybeSingle()
  if (error) console.error('updateProfile', error)
  return data
}

// Check-ins
export async function getCheckins(limit = 30) {
  const { data, error } = await supabase
    .from('checkins').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) console.error('getCheckins', error)
  return data || []
}

export async function addCheckin(checkin) {
  const { data, error } = await supabase.from('checkins').insert(checkin).select().maybeSingle()
  if (error) console.error('addCheckin', error)
  return data
}

export async function deleteCheckin(id) {
  const { error } = await supabase.from('checkins').delete().eq('id', id)
  if (error) console.error('deleteCheckin', error)
}

// Goals
export async function getGoals() {
  const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false })
  if (error) console.error('getGoals', error)
  return data || []
}

export async function addGoal(goal) {
  const { data, error } = await supabase.from('goals').insert(goal).select().maybeSingle()
  if (error) console.error('addGoal', error)
  return data
}

export async function updateGoal(id, updates) {
  const { data, error } = await supabase.from('goals').update(updates).eq('id', id).select().maybeSingle()
  if (error) console.error('updateGoal', error)
  return data
}

export async function deleteGoal(id) {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) console.error('deleteGoal', error)
}

// Journal
export async function getJournalEntries(limit = 50) {
  const { data, error } = await supabase
    .from('journal_entries').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) console.error('getJournalEntries', error)
  return data || []
}

export async function addJournalEntry(entry) {
  const { data, error } = await supabase.from('journal_entries').insert(entry).select().maybeSingle()
  if (error) console.error('addJournalEntry', error)
  return data
}

export async function deleteJournalEntry(id) {
  const { error } = await supabase.from('journal_entries').delete().eq('id', id)
  if (error) console.error('deleteJournalEntry', error)
}

// Reflections
export async function getReflections(limit = 50) {
  const { data, error } = await supabase
    .from('reflections').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) console.error('getReflections', error)
  return data || []
}

export async function addReflection(reflection) {
  const { data, error } = await supabase.from('reflections').insert(reflection).select().maybeSingle()
  if (error) console.error('addReflection', error)
  return data
}

// Connections
export async function getConnections() {
  const { data, error } = await supabase.from('connections').select('*').order('created_at', { ascending: false })
  if (error) console.error('getConnections', error)
  return data || []
}

export async function addConnection(conn) {
  const { data, error } = await supabase.from('connections').insert(conn).select().maybeSingle()
  if (error) console.error('addConnection', error)
  return data
}

export async function updateConnection(id, updates) {
  const { data, error } = await supabase.from('connections').update(updates).eq('id', id).select().maybeSingle()
  if (error) console.error('updateConnection', error)
  return data
}

export async function deleteConnection(id) {
  const { error } = await supabase.from('connections').delete().eq('id', id)
  if (error) console.error('deleteConnection', error)
}

// Interests
export async function getInterests() {
  const { data, error } = await supabase.from('interests').select('*').order('name')
  if (error) console.error('getInterests', error)
  return data || []
}

export async function addInterest(name, category = 'general') {
  const { data, error } = await supabase.from('interests').insert({ name, category }).select().maybeSingle()
  if (error) console.error('addInterest', error)
  return data
}

export async function removeInterest(id) {
  const { error } = await supabase.from('interests').delete().eq('id', id)
  if (error) console.error('removeInterest', error)
}

// Memories
export async function getMemories() {
  const { data, error } = await supabase.from('memories').select('*').order('created_at', { ascending: false })
  if (error) console.error('getMemories', error)
  return data || []
}

export async function addMemory(memory) {
  const { data, error } = await supabase.from('memories').insert(memory).select().maybeSingle()
  if (error) console.error('addMemory', error)
  return data
}

export async function deleteMemory(id) {
  const { error } = await supabase.from('memories').delete().eq('id', id)
  if (error) console.error('deleteMemory', error)
}

// Garden events
export async function getGardenEvents(limit = 100) {
  const { data, error } = await supabase
    .from('garden_events').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) console.error('getGardenEvents', error)
  return data || []
}

export async function addGardenEvent(event) {
  const { data, error } = await supabase.from('garden_events').insert(event).select().maybeSingle()
  if (error) console.error('addGardenEvent', error)
  return data
}

// Achievements
export async function getAchievements() {
  const { data, error } = await supabase.from('achievements').select('*').order('created_at', { ascending: false })
  if (error) console.error('getAchievements', error)
  return data || []
}

export async function addAchievement(achievement) {
  const { data, error } = await supabase.from('achievements').insert(achievement).select().maybeSingle()
  if (error) console.error('addAchievement', error)
  return data
}

// Habits
export async function getHabits() {
  const { data, error } = await supabase.from('habits').select('*').order('created_at', { ascending: false })
  if (error) console.error('getHabits', error)
  return data || []
}

export async function addHabit(habit) {
  const { data, error } = await supabase.from('habits').insert(habit).select().maybeSingle()
  if (error) console.error('addHabit', error)
  return data
}

export async function updateHabit(id, updates) {
  const { data, error } = await supabase.from('habits').update(updates).eq('id', id).select().maybeSingle()
  if (error) console.error('updateHabit', error)
  return data
}

export async function deleteHabit(id) {
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) console.error('deleteHabit', error)
}

// Shared activities
export async function getSharedActivities(connectionId) {
  const { data, error } = await supabase
    .from('shared_activities').select('*').eq('connection_id', connectionId).order('created_at', { ascending: false })
  if (error) console.error('getSharedActivities', error)
  return data || []
}

export async function addSharedActivity(activity) {
  const { data, error } = await supabase.from('shared_activities').insert(activity).select().maybeSingle()
  if (error) console.error('addSharedActivity', error)
  return data
}

// Award XP and update garden
export async function awardXp(amount, activityType, description) {
  const profile = await getProfile()
  if (!profile) return

  const newXp = (profile.xp || 0) + amount
  const newLeaves = Math.max(1, Math.floor(newXp / 100) + 1)

  await updateProfile({ xp: newXp, leaves: newLeaves })
  await addGardenEvent({
    activity_type: activityType,
    description,
    xp_earned: amount,
  })
}

// Artwork
export async function getArtwork(limit = 50) {
  const { data, error } = await supabase.from('artwork').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) console.error('getArtwork', error)
  return data || []
}

export async function addArtwork(art) {
  const { data, error } = await supabase.from('artwork').insert(art).select().maybeSingle()
  if (error) console.error('addArtwork', error)
  return data
}

export async function deleteArtwork(id) {
  const { error } = await supabase.from('artwork').delete().eq('id', id)
  if (error) console.error('deleteArtwork', error)
}

// Garden preferences
export async function getGardenPrefs() {
  const { data, error } = await supabase.from('garden_preferences').select('*').limit(1).maybeSingle()
  if (error) console.error('getGardenPrefs', error)
  return data
}

export async function saveGardenPrefs(prefs) {
  const { data: existing } = await supabase.from('garden_preferences').select('id').limit(1).maybeSingle()
  if (existing) {
    const { data, error } = await supabase.from('garden_preferences').update(prefs).eq('id', existing.id).select().maybeSingle()
    if (error) console.error('saveGardenPrefs', error)
    return data
  }
  const { data, error } = await supabase.from('garden_preferences').insert(prefs).select().maybeSingle()
  if (error) console.error('saveGardenPrefs', error)
  return data
}
