// ═══════════════════════════════════════════════════════════════
//  CoWork — shared Supabase client + data helpers
//  ① Replace the two constants below with your project values:
//     supabase.com → your project → Settings → API
//  ② Include BEFORE this file: supabase CDN script tag
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://mfvosoixkmruycuaxlej.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdm9zb2l4a21ydXljdWF4bGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NjA1NDYsImV4cCI6MjA5NjUzNjU0Nn0.mpsBEjBnCSVOMiHHEeI_3AnfYSzBaD3sovh7F5bTsOc'

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
})

// ── Auth ─────────────────────────────────────────────────────
async function getUser() {
  const { data: { user } } = await sb.auth.getUser()
  return user
}

async function requireAuth() {
  const user = await getUser()
  if (!user) { window.location.href = 'login.html'; return null }
  return user
}

async function signIn(email, password) {
  return sb.auth.signInWithPassword({ email, password })
}

async function signOut() {
  await sb.auth.signOut()
  window.location.href = 'login.html'
}

// ── Captures ─────────────────────────────────────────────────
const Captures = {
  async list() {
    const { data, error } = await sb.from('captures')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('Captures.list:', error)
    return data || []
  },

  async add({ project, type, content }) {
    const user = await getUser()
    if (!user) { window.location.href = 'login.html'; return null }
    const { data, error } = await sb.from('captures')
      .insert({ project, type, content, user_id: user.id })
      .select().single()
    if (error) { console.error('Captures.add:', error); return null }
    return data
  },

  async remove(id) {
    const { error } = await sb.from('captures').delete().eq('id', id)
    if (error) console.error('Captures.remove:', error)
  },

  // Real-time: callback receives { new: row } or { old: row }
  subscribe(callback) {
    return sb.channel('captures-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captures' }, callback)
      .subscribe()
  }
}

// ── Tasks ────────────────────────────────────────────────────
const Tasks = {
  async list() {
    const { data, error } = await sb.from('tasks')
      .select('*')
      .order('section')
      .order('sort_order')
      .order('created_at')
    if (error) console.error('Tasks.list:', error)
    return data || []
  },

  async add({ title, section = 'active', project = null, priority = false, notes = null }) {
    const user = await getUser()
    const { data, error } = await sb.from('tasks')
      .insert({ title, section, project, priority, notes, user_id: user.id })
      .select().single()
    if (error) console.error('Tasks.add:', error)
    return data
  },

  async update(id, changes) {
    const { data, error } = await sb.from('tasks')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single()
    if (error) console.error('Tasks.update:', error)
    return data
  },

  async remove(id) {
    const { error } = await sb.from('tasks').delete().eq('id', id)
    if (error) console.error('Tasks.remove:', error)
  },

  subscribe(callback) {
    return sb.channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
      .subscribe()
  }
}

// ── Intel ────────────────────────────────────────────────────
const Intel = {
  async list(type = null) {
    let q = sb.from('intel').select('*').order('created_at', { ascending: false })
    if (type) q = q.eq('type', type)
    const { data, error } = await q
    if (error) console.error('Intel.list:', error)
    return data || []
  },

  async add({ type, project, content, urgent = false }) {
    const user = await getUser()
    const { data, error } = await sb.from('intel')
      .insert({ type, project, content, urgent, user_id: user.id })
      .select().single()
    if (error) console.error('Intel.add:', error)
    return data
  },

  async update(id, changes) {
    const { data, error } = await sb.from('intel')
      .update(changes)
      .eq('id', id)
      .select().single()
    if (error) console.error('Intel.update:', error)
    return data
  },

  async remove(id) {
    const { error } = await sb.from('intel').delete().eq('id', id)
    if (error) console.error('Intel.remove:', error)
  },

  subscribe(callback) {
    return sb.channel('intel-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'intel' }, callback)
      .subscribe()
  }
}

// ── LinkedIn Posts ───────────────────────────────────────────
const LI = {
  async list() {
    const { data, error } = await sb.from('linkedin_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('LI.list:', error)
    return data || []
  },

  async add({ topic, hook = '', content = '', status = 'idea' }) {
    const user = await getUser()
    const { data, error } = await sb.from('linkedin_posts')
      .insert({ topic, hook, content, status, user_id: user.id })
      .select().single()
    if (error) console.error('LI.add:', error)
    return data
  },

  async update(id, changes) {
    const { data, error } = await sb.from('linkedin_posts')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single()
    if (error) console.error('LI.update:', error)
    return data
  },

  async remove(id) {
    const { error } = await sb.from('linkedin_posts').delete().eq('id', id)
    if (error) console.error('LI.remove:', error)
  },

  subscribe(callback) {
    return sb.channel('li-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'linkedin_posts' }, callback)
      .subscribe()
  }
}

// ── Stats (for hub index page) ───────────────────────────────
const Stats = {
  async get() {
    const [captures, tasks, intel, li] = await Promise.all([
      sb.from('captures').select('id', { count: 'exact', head: true }),
      sb.from('tasks').select('id', { count: 'exact', head: true }).eq('done', false).neq('section', 'done'),
      sb.from('intel').select('id', { count: 'exact', head: true }).eq('resolved', false),
      sb.from('linkedin_posts').select('id', { count: 'exact', head: true }).eq('status', 'ready')
    ])
    return {
      captures: captures.count || 0,
      activeTasks: tasks.count || 0,
      openIntel: intel.count || 0,
      liReady: li.count || 0
    }
  }
}
