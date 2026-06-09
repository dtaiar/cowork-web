/* ═══════════════════════════════════════════════════════════════
   STATE  (populated from Supabase on init)
═══════════════════════════════════════════════════════════════ */
let state = {
  captures:  [],
  tasks:     [],
  blockers:  [],
  questions: [],
  decisions: [],
  actions:   [],
  liPosts:   []
};

/* ═══════════════════════════════════════════════════════════════
   NAV STATE
═══════════════════════════════════════════════════════════════ */
let tab       = 'capture';
let selProj   = 'portal';
let selType   = 'idea';
let capFilt   = 'all';
let taskFilt  = 'all';
let intelTab  = 'blockers';
let intelFilt = 'all';

const PROJ  = { hedging:'Hedging', portal:'Portal', design:'Design', other:'Other' };
const TYPES = { idea:'💡 Idea', question:'❓ Question', link:'🔗 Link', obs:'👁 Observation' };
const TICON = { idea:'💡', question:'❓', link:'🔗', obs:'👁' };

const GLOSSARY_DATA = [
  {term:'HT',           meaning:'Hedging Tool — the main trading/hedging platform.',                     cat:'AXPO Terms'},
  {term:'DMA',          meaning:'Direct Market Access — trading directly on exchange.',                   cat:'AXPO Terms'},
  {term:'TGE',          meaning:'Towarowa Giełda Energii — Polish energy exchange. Gas pilot uses TGE.', cat:'AXPO Terms'},
  {term:'Mingle',       meaning:"AXPO's internal Confluence instance for specs and documentation.",       cat:'AXPO Terms'},
  {term:'RFQ',          meaning:'Request For Quote — client requests a price from a trader.',             cat:'AXPO Terms'},
  {term:'EMIS',         meaning:'Energy Management Information System — nominated volumes integration.',  cat:'AXPO Terms'},
  {term:'CMACH',        meaning:'C-MACH+ — Customer Portal feature for 15-min production data.',         cat:'AXPO Terms'},
  {term:'Intraday',     meaning:'Same-day energy trading. Intraday RFQ is a key Portal feature.',        cat:'AXPO Terms'},
  {term:'One Market',   meaning:'Cross-market product; controlled release targeting Switzerland.',        cat:'AXPO Terms'},
  {term:'DNA',          meaning:'Internal platform; migration caused lost-quotes risk for Intraday RFQ.',cat:'AXPO Terms'},
  {term:'Tranche',      meaning:'Polish comms word for hedge (use "Hedge" for EU, "Tranche" for Poland).', cat:'AXPO Terms'},
  {term:'!!!',          meaning:'High priority item.',                                                    cat:'Notation'},
  {term:'#🧑‍💻Pending',  meaning:'Blocked — waiting on info from PM or stakeholder.',                    cat:'Notation'},
  {term:'UX',           meaning:'User Experience.',                                                       cat:'Notation'},
  {term:'PRD',          meaning:'Product Requirements Document.',                                         cat:'Notation'},
  {term:'DS',           meaning:'Design System.',                                                         cat:'Notation'},
  {term:'TBC',          meaning:'To be confirmed.',                                                       cat:'Notation'},
];

/* ═══════════════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════════════ */
function goto(t) {
  tab = t;
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.id === 'nb-' + t)
  );
  render();
  document.getElementById('scrollBody').scrollTop = 0;
}

/* ═══════════════════════════════════════════════════════════════
   HEADER
═══════════════════════════════════════════════════════════════ */
function refreshHeader() {
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('hdDate').textContent =
    `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

  const count = state.captures.length;
  const sub   = document.getElementById('hdSubText');
  const badge = document.getElementById('capBadge');
  const dot   = document.getElementById('pendingDot');

  if (count > 0) {
    dot.style.display = 'block';
    sub.textContent   = `${count} capture${count !== 1 ? 's' : ''}`;
    badge.style.display = 'flex';
    badge.textContent   = count;
  } else {
    dot.style.display   = 'none';
    sub.textContent     = 'No captures yet';
    badge.style.display = 'none';
  }
}

/* ═══════════════════════════════════════════════════════════════
   RENDER ROUTER
═══════════════════════════════════════════════════════════════ */
function render() {
  const pane = document.getElementById('tabPane');
  pane.className = 'tab-pane';
  void pane.offsetWidth;
  pane.className = 'tab-pane';

  if (tab === 'capture')  pane.innerHTML = renderCapture();
  if (tab === 'tasks')    pane.innerHTML = renderTasks();
  if (tab === 'intel')    pane.innerHTML = renderIntel();
  if (tab === 'linkedin') pane.innerHTML = renderLinkedin();

  refreshHeader();
}

/* ═══════════════════════════════════════════════════════════════
   CAPTURE TAB
═══════════════════════════════════════════════════════════════ */
function renderCapture() {
  const caps = state.captures.filter(c => capFilt === 'all' || c.project === capFilt);

  const form = `
    <div class="card" style="margin-bottom:20px">
      <div class="field-label">Project</div>
      <div class="chip-group">
        ${Object.entries(PROJ).map(([k,v]) =>
          `<button class="chip c-${k} ${selProj===k?'on':''}" onclick="sp('${k}')">${v}</button>`
        ).join('')}
      </div>
      <div class="field-label">Type</div>
      <div class="chip-group">
        ${Object.entries(TYPES).map(([k,v]) =>
          `<button class="chip c-${k} ${selType===k?'on':''}" onclick="st('${k}')">${v}</button>`
        ).join('')}
      </div>
      <div class="field-label">Content</div>
      <textarea id="ct" placeholder="What's on your mind?"></textarea>
      <button class="btn btn-primary" onclick="addCap()">Save capture</button>
    </div>`;

  const fbar = `<div class="filter-bar">
    ${['all',...Object.keys(PROJ)].map(f =>
      `<button class="fp ${capFilt===f?'on':''}" onclick="setCF('${f}')">${f==='all'?'All':PROJ[f]}</button>`
    ).join('')}
  </div>`;

  const capCard = c => `
    <div class="cap-item">
      <div class="meta">
        <span class="badge b-${c.project}">${PROJ[c.project] || c.project}</span>
        <span style="font-size:13px">${TICON[c.type] || '📝'}</span>
        <span class="ts">${fmtRel(c.created_at)}</span>
      </div>
      <div class="body-t">${esc(c.content)}</div>
      <div class="cap-actions">
        <button class="btn btn-danger" onclick="delCap('${c.id}')">Delete</button>
      </div>
    </div>`;

  if (!state.captures.length) return form;

  let list = fbar;
  if (caps.length) {
    list += `<div class="sec">
      <span class="sec-label">Captures</span>
      <span class="sec-count">${caps.length}</span>
    </div>`;
    list += caps.map(capCard).join('');
  } else {
    list += empty('📭', 'No captures for this project');
  }

  return form + list;
}

/* ═══════════════════════════════════════════════════════════════
   TASKS TAB
═══════════════════════════════════════════════════════════════ */
function renderTasks() {
  const all  = state.tasks;
  const filt = taskFilt === 'all' ? all : all.filter(t => t.project === taskFilt);

  const fbar = `<div class="filter-bar">
    ${['all',...Object.keys(PROJ)].map(f =>
      `<button class="fp ${taskFilt===f?'on':''}" onclick="setTF('${f}')">${f==='all'?'All':PROJ[f]}</button>`
    ).join('')}
  </div>`;

  const SECS = [
    {key:'active',  label:'Active'},
    {key:'waiting', label:'Waiting on'},
    {key:'someday', label:'Someday'},
    {key:'done',    label:'Done'},
  ];

  const taskRow = t => `
    <div class="task-item ${t.priority?'t-priority':''} ${t.done?'t-done':''}">
      <div class="task-check ${t.done?'checked':''}" onclick="toggleTask('${t.id}')"></div>
      <div class="task-body">
        <div class="task-title">${esc(t.title)}</div>
        <div class="task-foot">
          <span class="badge b-${t.project}">${PROJ[t.project] || t.project || ''}</span>
          ${t.priority ? `<span class="pri-tag">PRIORITY</span>` : ''}
        </div>
      </div>
    </div>`;

  let html = fbar;
  let any  = false;

  SECS.forEach(s => {
    const items = filt.filter(t => t.section === s.key);
    if (!items.length) return;
    any = true;
    html += `<div class="sec"><span class="sec-label">${s.label}</span><span class="sec-count">${items.length}</span></div>`;
    html += items.map(taskRow).join('');
  });

  if (!any) html += empty('📭', 'No tasks here');
  return html;
}

/* ═══════════════════════════════════════════════════════════════
   INTEL TAB
═══════════════════════════════════════════════════════════════ */
function renderIntel() {
  const STABS = {blockers:'⚠️ Blockers', questions:'❓ Questions', decisions:'✅ Decisions', actions:'📋 Actions', glossary:'📖 Glossary'};

  const nav = `<div class="sub-tabs">
    ${Object.entries(STABS).map(([k,v]) =>
      `<button class="sub-tab ${intelTab===k?'on':''}" onclick="setIT('${k}')">${v}</button>`
    ).join('')}
  </div>`;

  const fbar = `<div class="filter-bar">
    ${['all','hedging','portal'].map(f =>
      `<button class="fp ${intelFilt===f?'on':''}" onclick="setIF('${f}')">${f==='all'?'All':PROJ[f]}</button>`
    ).join('')}
  </div>`;

  let body = nav + (intelTab !== 'glossary' ? fbar : '');

  if (intelTab === 'blockers') {
    const items = state.blockers.filter(b => intelFilt==='all' || b.project===intelFilt);
    if (!items.length) return body + empty('🎉','No blockers in scope');
    items.forEach(b => {
      const c = b.content || {};
      body += `<div class="card ${b.urgent?'card-urgent':''}">
        <div class="meta">
          <span class="badge b-${b.project}">${PROJ[b.project]||b.project||''}</span>
          ${b.urgent ? `<span class="badge b-urgent">URGENT</span>` : ''}
        </div>
        <div class="body-t">${esc(c.description||c.text||'')}</div>
        ${c.impact ? `<div class="sub-t">${esc(c.impact)}</div>` : ''}
        <div class="info-row">
          ${c.owner ? `<span>👤 ${esc(c.owner)}</span>` : ''}
          ${c.due   ? `<span>📅 ${esc(c.due)}</span>`   : ''}
        </div>
      </div>`;
    });
  }

  if (intelTab === 'questions') {
    const items = state.questions.filter(q => intelFilt==='all' || q.project===intelFilt);
    if (!items.length) return body + empty('🎉','No open questions');
    items.forEach(q => {
      const c = q.content || {};
      body += `<div class="card">
        <div class="meta">
          <span class="badge b-${q.project}">${PROJ[q.project]||q.project||''}</span>
          ${c.priority ? `<span class="badge b-${c.priority}">${c.priority}</span>` : ''}
          ${c.blocker  ? `<span class="badge b-blocker">Blocker</span>` : ''}
        </div>
        <div class="body-t">${esc(c.text||'')}</div>
        ${c.context ? `<div class="sub-t">${esc(c.context)}</div>` : ''}
      </div>`;
    });
  }

  if (intelTab === 'decisions') {
    const items = state.decisions.filter(d => intelFilt==='all' || d.project===intelFilt || (Array.isArray((d.content||{}).domains) && (d.content.domains.includes(intelFilt))));
    if (!items.length) return body + empty('📋','No decisions logged');
    items.forEach(d => {
      const c = d.content || {};
      body += `<div class="card">
        <div class="meta">
          <span class="badge b-${d.project}">${PROJ[d.project]||d.project||''}</span>
          <span class="ts">${fmtDate(d.created_at)}</span>
        </div>
        <div class="body-t">${esc(c.text||c.decision||'')}</div>
        ${c.approved_by ? `<div class="sub-t">↳ ${esc(c.approved_by)}</div>` : ''}
      </div>`;
    });
  }

  if (intelTab === 'actions') {
    const open = state.actions.filter(a => !(a.content||{}).done);
    const done = state.actions.filter(a =>  (a.content||{}).done);
    if (!state.actions.length) return body + empty('✅','No action items');

    if (open.length) {
      body += `<div class="sec"><span class="sec-label">Open</span><span class="sec-count">${open.length}</span></div>`;
      open.forEach(a => {
        const c = a.content || {};
        body += `<div class="card ${a.urgent?'card-urgent':''}">
          <div class="meta">
            ${a.urgent ? `<span class="badge b-urgent">URGENT</span>` : ''}
            ${c.due ? `<span class="ts">${esc(c.due)}</span>` : ''}
          </div>
          <div class="body-t">${esc(c.text||'')}</div>
          ${c.owner ? `<div class="sub-t">👤 ${esc(c.owner)}</div>` : ''}
        </div>`;
      });
    }
    if (done.length) {
      body += `<div class="sec"><span class="sec-label">Done</span><span class="sec-count">${done.length}</span></div>`;
      done.forEach(a => {
        const c = a.content || {};
        body += `<div class="card" style="opacity:.35"><div class="body-t" style="text-decoration:line-through">${esc(c.text||'')}</div></div>`;
      });
    }
  }

  if (intelTab === 'glossary') {
    const q = (document.getElementById('glossaryQ')?.value || '').toLowerCase();
    const items = GLOSSARY_DATA.filter(g =>
      !q || g.term.toLowerCase().includes(q) || g.meaning.toLowerCase().includes(q)
    );
    body += `<div style="margin-bottom:14px;">
      <input id="glossaryQ" type="search"
        style="width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:var(--rs);color:var(--t1);font-family:inherit;font-size:14px;padding:10px 14px;outline:none;"
        placeholder="Search terms…" oninput="setIT('glossary')" value="${esc(q)}">
    </div>`;
    if (!items.length) {
      body += empty('🔍', 'No matching terms');
    } else {
      const cats = [...new Set(items.map(g => g.cat))];
      cats.forEach(cat => {
        body += `<div class="sec" style="margin-top:12px;"><span class="sec-label">${esc(cat)}</span></div>`;
        items.filter(g => g.cat === cat).forEach(g => {
          body += `<div class="card" style="padding:11px 13px;margin-bottom:6px;">
            <div style="display:flex;gap:10px;align-items:baseline;">
              <code style="font-size:12px;color:var(--amber);background:var(--amber-d);padding:2px 7px;border-radius:5px;white-space:nowrap;flex-shrink:0;">${esc(g.term)}</code>
              <span style="font-size:13px;color:var(--t2);line-height:1.45;">${esc(g.meaning)}</span>
            </div>
          </div>`;
        });
      });
    }
  }

  return body;
}

/* ═══════════════════════════════════════════════════════════════
   LINKEDIN TAB
═══════════════════════════════════════════════════════════════ */
const LI_PILLARS = [
  { id:'p1', label:'UI craft + design systems',  color:'#378ADD', tag:'Core' },
  { id:'p2', label:'AI in design practice',       color:'#7F77DD', tag:'Timely' },
  { id:'p3', label:'Design in complex products',  color:'#1D9E75', tag:'B2B' },
  { id:'p4', label:'Designer career + growth',    color:'#BA7517', tag:'Community' },
];

let liSelPillar = 'p1';
function liPick(p) { liSelPillar = p; render(); }

function renderLinkedin() {
  const posts = state.liPosts;

  const pillarDots = LI_PILLARS.map(p => `
    <button onclick="liPick('${p.id}')" style="
      flex:1;border:1px solid ${liSelPillar===p.id ? p.color : 'rgba(255,255,255,0.08)'};
      background:${liSelPillar===p.id ? p.color+'22' : 'var(--s1)'};
      border-radius:10px;padding:10px 6px;cursor:pointer;text-align:left;position:relative;overflow:hidden;">
      <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${p.color};border-radius:3px 0 0 3px;"></div>
      <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:3px;padding-left:6px;">${p.tag}</div>
      <div style="font-size:11px;font-weight:500;color:${liSelPillar===p.id ? '#fff' : 'rgba(255,255,255,0.65)'};line-height:1.3;padding-left:6px;">${p.label}</div>
    </button>`).join('');

  const captureForm = `
    <div class="card" style="margin-bottom:20px">
      <div class="field-label">Pillar</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:14px;">${pillarDots}</div>
      <div class="field-label">Idea</div>
      <textarea id="liTxt" placeholder="Post angle, observation, hook…" style="min-height:80px"></textarea>
      <button class="btn btn-primary" onclick="liSaveIdea()">Save idea</button>
    </div>`;

  const postRow = p => {
    const pillar = LI_PILLARS.find(x => x.id === p.topic) || LI_PILLARS[0];
    return `
      <div style="background:var(--s1);border:1px solid rgba(255,255,255,0.06);border-radius:10px;
                  padding:10px 12px 10px 14px;display:flex;align-items:center;gap:10px;
                  position:relative;overflow:hidden;margin-bottom:8px;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${pillar.color};border-radius:3px 0 0 3px;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:500;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.hook||p.content||'Untitled')}</div>
          <div style="display:flex;gap:6px;margin-top:3px;align-items:center;">
            <span style="font-size:10px;padding:1px 6px;border-radius:99px;font-weight:500;background:${pillar.color}22;color:${pillar.color};">${pillar.label.split('&')[0].trim()}</span>
            <span style="font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(255,255,255,0.06);color:var(--t2);">${p.status}</span>
            <span class="ts">${fmtRel(p.created_at)}</span>
          </div>
        </div>
      </div>`;
  };

  let html = captureForm;
  if (posts.length) {
    html += `<div class="sec"><span class="sec-label">Post ideas</span><span class="sec-count">${posts.length}</span></div>`;
    html += posts.map(postRow).join('');
  } else {
    html += empty('✍️','No post ideas yet — add one above');
  }
  return html;
}

/* ═══════════════════════════════════════════════════════════════
   CAPTURE ACTIONS
═══════════════════════════════════════════════════════════════ */
const sp    = p => { selProj = p; render(); };
const st    = t => { selType = t; render(); };
const setCF = f => { capFilt = f; render(); };

async function addCap() {
  const el = document.getElementById('ct');
  const content = el?.value?.trim();
  if (!content) { toast('Write something first'); return; }
  const cap = await Captures.add({ project: selProj, type: selType, content });
  if (cap) state.captures.unshift(cap);
  el.value = '';
  toast('Saved ✓');
  render();
  refreshHeader();
}

async function delCap(id) {
  if (!confirm('Delete?')) return;
  await Captures.remove(id);
  state.captures = state.captures.filter(c => c.id !== id);
  render();
  refreshHeader();
}

/* ═══════════════════════════════════════════════════════════════
   TASK ACTIONS
═══════════════════════════════════════════════════════════════ */
const setTF = f => { taskFilt = f; render(); };

async function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  const nowDone = !t.done;
  const updated = await Tasks.update(id, {
    done: nowDone,
    section: nowDone ? 'done' : 'active'
  });
  if (updated) Object.assign(t, updated);
  render();
  toast(nowDone ? 'Done ✓' : 'Reopened');
}

/* ═══════════════════════════════════════════════════════════════
   INTEL ACTIONS
═══════════════════════════════════════════════════════════════ */
const setIT = t => { intelTab = t; intelFilt = 'all'; render(); };
const setIF = f => { intelFilt = f; render(); };

/* ═══════════════════════════════════════════════════════════════
   LINKEDIN ACTIONS
═══════════════════════════════════════════════════════════════ */
async function liSaveIdea() {
  const txt = document.getElementById('liTxt')?.value?.trim();
  if (!txt) { toast('Write something first'); return; }
  const post = await LI.add({ topic: liSelPillar, hook: txt, content: '', status: 'idea' });
  if (post) state.liPosts.unshift(post);
  document.getElementById('liTxt').value = '';
  toast('Idea saved ✓');
  render();
}

/* ═══════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════ */
function fmtRel(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h/24);
  if (dd === 1) return 'yesterday';
  if (dd < 7)  return `${dd}d ago`;
  return new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
function fmtDate(s) {
  return new Date(s).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}
function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function empty(icon, msg) {
  return `<div class="empty"><div class="empty-icon">${icon}</div><div class="empty-text">${msg}</div></div>`;
}
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

/* ═══════════════════════════════════════════════════════════════
   LOADING STATE
═══════════════════════════════════════════════════════════════ */
function showLoading() {
  document.getElementById('tabPane').innerHTML = `
    <div class="empty">
      <div class="empty-icon">⏳</div>
      <div class="empty-text">Loading…</div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
async function init() {
  await requireAuth();
  showLoading();

  const [caps, tasks, intel, li] = await Promise.all([
    Captures.list(),
    Tasks.list(),
    Intel.list(),
    LI.list()
  ]);

  state.captures  = caps;
  state.tasks     = tasks;
  state.blockers  = intel.filter(i => i.type === 'blocker');
  state.questions = intel.filter(i => i.type === 'question');
  state.decisions = intel.filter(i => i.type === 'decision');
  state.actions   = intel.filter(i => i.type === 'action');
  state.liPosts   = li;

  render();
  refreshHeader();

  // Real-time: refresh captures when any device adds/removes one
  Captures.subscribe(async () => {
    state.captures = await Captures.list();
    if (tab === 'capture') render();
    refreshHeader();
  });

  // Real-time: refresh tasks when dashboard changes them
  Tasks.subscribe(async () => {
    state.tasks = await Tasks.list();
    if (tab === 'tasks') render();
  });
}

init();
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshHeader(); });
