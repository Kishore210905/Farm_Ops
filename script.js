/* ===================== FarmOps – script.js =====================
   One script runs every page. The <body data-page="..."> value decides which
   page function (PAGES.xxx) builds the content. Data lives in localStorage. */

const KEY = 'farmops_data_v1';
const CROPS = ['Rice', 'Tomato', 'Cotton', 'Groundnut'];

// ---------- 1. DEMO DATA (used the first time, or after "Reset") ----------
const DEFAULTS = {
  waterPlanned: 40000, waterTotal: 60000,                  // litres per week
  waterDaily: [3800, 4100, 3600, 4200, 3900, 3700, 3900],  // Mon..Sun
  monthWater: [31000, 29500, 34000, 38500, 36200, 27200],  // May..Oct
  fertStock: 600,                                          // kg
  fields: [
    { field: 'Field A', crop: 'Rice', area: 2.5, soil: 'Clay', status: 'Cultivated', health: 'Good', water: 72, prod: 88 },
    { field: 'Field B', crop: 'Tomato', area: 1.5, soil: 'Loamy', status: 'Cultivated', health: 'Moderate', water: 81, prod: 74 },
    { field: 'Field C', crop: 'Cotton', area: 3, soil: 'Black', status: 'Cultivated', health: 'Good', water: 65, prod: 91 },
    { field: 'Field D', crop: 'Groundnut', area: 2, soil: 'Red Sandy', status: 'Cultivated', health: 'Excellent', water: 58, prod: 94 }],
  irrigation: [
    { field: 'Field A', crop: 'Rice', time: '6:00 AM', duration: 45, required: 1200, status: 'Scheduled' },
    { field: 'Field B', crop: 'Tomato', time: '6:45 AM', duration: 30, required: 900, status: 'Scheduled' },
    { field: 'Field C', crop: 'Cotton', time: '7:30 AM', duration: 40, required: 1000, status: 'Running' },
    { field: 'Field D', crop: 'Groundnut', time: '5:30 PM', duration: 25, required: 700, status: 'Completed' }],
  fert: [
    { field: 'Field A', crop: 'Rice', fert: 'Urea', required: 120, used: 95 },
    { field: 'Field B', crop: 'Tomato', fert: 'NPK 19:19:19', required: 90, used: 88 },
    { field: 'Field C', crop: 'Cotton', fert: 'DAP', required: 150, used: 135 },
    { field: 'Field D', crop: 'Groundnut', fert: 'Gypsum', required: 100, used: 80 }],
  workers: [
    { id: 'W001', name: 'Kumar', field: 'Field A', task: 'Irrigation', hours: 6, status: 'Working', att: 'Present' },
    { id: 'W002', name: 'Lakshmi', field: 'Field B', task: 'Weeding', hours: 7, status: 'Working', att: 'Present' },
    { id: 'W003', name: 'Murugan', field: 'Field C', task: 'Spraying', hours: 5, status: 'Working', att: 'Present' },
    { id: 'W004', name: 'Selvi', field: 'Field D', task: 'Fertilizing', hours: 6, status: 'Working', att: 'Present' },
    { id: 'W005', name: 'Raja', field: 'Field A', task: 'Transplanting', hours: 8, status: 'Working', att: 'Present' },
    { id: 'W006', name: 'Meena', field: 'Field C', task: 'Picking', hours: 6, status: 'Working', att: 'Present' },
    { id: 'W007', name: 'Anand', field: 'Field B', task: 'Staking', hours: 4, status: 'Working', att: 'Present' },
    { id: 'W008', name: 'Priya', field: 'Field D', task: 'Unassigned', hours: 0, status: 'Available', att: 'Present' },
    { id: 'W009', name: 'Siva', field: 'Field A', task: 'Unassigned', hours: 0, status: 'Available', att: 'Present' },
    { id: 'W010', name: 'Devi', field: 'Field C', task: 'Leave', hours: 0, status: 'On Leave', att: 'Absent' }],
  machines: [
    { name: 'Tractor 01', type: 'Tractor', field: 'Field B', status: 'In Use', fuel: 68, next: '2026-10-12' },
    { name: 'Tractor 02', type: 'Tractor', field: '-', status: 'Available', fuel: 85, next: '2026-11-20' },
    { name: 'Power Tiller', type: 'Tiller', field: 'Field A', status: 'In Use', fuel: 55, next: '2026-12-05' },
    { name: 'Sprayer 01', type: 'Sprayer', field: '-', status: 'Available', fuel: 90, next: '2026-11-02' },
    { name: 'Harvester', type: 'Harvester', field: '-', status: 'Maintenance', fuel: 20, next: '2026-10-08' },
    { name: 'Water Pump', type: 'Pump', field: 'Field C', status: 'In Use', fuel: 74, next: '2027-01-15' },
    { name: 'Seed Drill', type: 'Seeder', field: '-', status: 'Maintenance', fuel: 40, next: '2026-10-10' }]
};

// ---------- 2. STORAGE ----------
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.fields) return d; } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULTS));
}
let S = load();
const save = () => localStorage.setItem(KEY, JSON.stringify(S));

// ---------- 3. SMALL HELPERS ----------
const $ = (s) => document.querySelector(s);
const sum = (a, f) => a.reduce((t, x) => t + (+f(x) || 0), 0);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fieldNames = () => S.fields.map((f) => f.field);
const BC = { Scheduled: 'blue', Running: 'amber', Completed: 'green', Available: 'green', 'In Use': 'blue', Maintenance: 'red',
  Working: 'blue', 'On Leave': 'amber', Cultivated: 'green', Fallow: 'amber', OK: 'green', 'Near limit': 'amber', Exceeded: 'red',
  Optimal: 'green', High: 'amber', Low: 'amber', Over: 'red', Present: 'green', Absent: 'red' };
const badge = (v) => `<span class="badge ${BC[v] || 'gray'}">${v}</span>`;
// status of a percentage value -> [label, colour class]
function stat(p) { return p > 100 ? ['Over', 'bad'] : p > 85 ? ['High', 'warn'] : p >= 60 ? ['Optimal', 'ok'] : ['Low', 'warn']; }
const eff = (v) => Math.max(0, Math.round(100 - Math.abs(v - 85))); // efficiency: best when usage is ~85% of plan

// ---------- 4. METRICS: every dashboard number is calculated from the data ----------
function metrics() {
  const m = {};
  m.waterUsed = sum(S.waterDaily, (x) => x);
  m.water = pct(m.waterUsed, S.waterPlanned);
  m.fReq = sum(S.fert, (x) => x.required); m.fUsed = sum(S.fert, (x) => x.used);
  m.fert = pct(m.fUsed, m.fReq);
  const active = S.workers.filter((w) => w.status !== 'On Leave');
  m.working = S.workers.filter((w) => w.status === 'Working').length;
  m.labour = pct(m.working, active.length);
  m.mt = S.machines.length;
  m.inUse = S.machines.filter((x) => x.status === 'In Use').length;
  m.maint = S.machines.filter((x) => x.status === 'Maintenance').length;
  m.mAvail = m.mt - m.maint;
  m.mach = pct(m.inUse, m.mt);
  m.area = sum(S.fields, (f) => f.area);
  m.cult = sum(S.fields.filter((f) => f.status === 'Cultivated'), (f) => f.area);
  m.land = pct(m.cult, m.area);
  m.prod = S.fields.length ? Math.round(sum(S.fields, (f) => f.prod) / S.fields.length) : 0;
  return m;
}

// ---------- 5. RESOURCE OPTIMIZATION RULES (IF-THEN) ----------
function recs(m) {
  const r = [], add = (lvl, icon, msg, tip) => r.push({ lvl, icon, msg, tip });
  if (m.water > 100) add('bad', '💧', `Water usage is ${m.water - 100}% higher than planned.`, 'Reduce irrigation frequency; irrigate during early morning.');
  else if (m.water > 85) add('warn', '💧', `Water usage is ${m.water}% of plan and nearly at the limit.`, 'Schedule irrigation during early morning to cut evaporation.');
  if (m.fert > 100) add('bad', '🧪', 'Fertilizer usage exceeds the recommended quantity.', 'Review fertilizer allocation immediately.');
  else if (m.fert > 85) add('warn', '🧪', `Fertilizer usage (${m.fert}%) is approaching the limit.`, 'Review fertilizer allocation for the Tomato field.');
  if (m.labour < 60) add('warn', '👷', `Labour utilization is low (${m.labour}%).`, 'Redistribute available workers.');
  else if (m.labour > 90) add('warn', '👷', `Labour utilization is high (${m.labour}%).`, 'Redistribute workers between Field A and Field C.');
  if (m.mach < 50) add('warn', '🚜', `Machinery utilization is low (${m.mach}%).`, 'Consider scheduling machinery for another field (e.g. Field B).');
  if (m.land < 80) add('warn', '🌱', `Land utilization is ${m.land}%.`, 'Consider planning an additional crop on unused land.');
  if (m.prod > 85) add('ok', '✅', `Average productivity is ${m.prod}%.`, 'Current resource allocation is performing efficiently.');
  if (!r.length) add('ok', '✅', 'All resources are within limits.', 'No action required.');
  return r;
}
const recHTML = (r) => r.map((x) => `<div class="rec ${x.lvl}"><span>${x.icon}</span><div><b>${x.msg}</b><small>Recommendation: ${x.tip}</small></div></div>`).join('');

// ---------- 6. CHART HELPER (destroys the old chart, draws a new one) ----------
const CH = {};
const COL = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e'];
function chart(id, type, labels, sets, opt = {}) {
  if (CH[id]) CH[id].destroy();
  if (typeof Chart === 'undefined') return; // CDN not reachable (offline)
  sets.forEach((s, i) => { if (!s.backgroundColor) s.backgroundColor = type === 'doughnut' ? COL : COL[i]; if (type === 'line' && !s.borderColor) s.borderColor = COL[i]; });
  CH[id] = new Chart($('#' + id), { type, data: { labels, datasets: sets }, options: Object.assign({ responsive: true, maintainAspectRatio: false }, opt) });
}
const cv = (id, title) => `<div class="panel"><h3>${title}</h3><div class="cb"><canvas id="${id}"></canvas></div></div>`;
const tile = (t, v, s = '') => `<div class="card"><div class="ct">${t}</div><div class="big">${v}</div><div class="sub">${s}</div></div>`;
const head = (t, s, addKey, label) => `<div class="ph"><div><h1>${t}</h1><p>${s}</p></div>${addKey ? `<button class="btn" data-add="${addKey}">+ ${label}</button>` : ''}</div>`;
const page = (h) => ($('#page').innerHTML = h);

// ---------- 7. GENERIC ADD / EDIT / DELETE (tables + modal form) ----------
// Field format: [key, label, type(text|number|date|select|status), options, unit suffix]
const CFG = {
  irrigation: { key: 'irrigation', name: 'Irrigation Schedule', f: [['field', 'Field', 'select', fieldNames], ['crop', 'Crop', 'select', CROPS], ['time', 'Scheduled Time', 'text'],
    ['duration', 'Duration', 'number', 0, ' min'], ['required', 'Water Required', 'number', 0, ' L'], ['status', 'Status', 'status', ['Scheduled', 'Running', 'Completed']]] },
  fert: { key: 'fert', name: 'Fertilizer Allocation', f: [['field', 'Field', 'select', fieldNames], ['crop', 'Crop', 'select', CROPS], ['fert', 'Fertilizer', 'text'],
    ['required', 'Required', 'number', 0, ' kg'], ['used', 'Used', 'number', 0, ' kg']],
    extra: [['Remaining', (r) => Math.max(0, r.required - r.used) + ' kg'], ['Status', (r) => badge(r.used > r.required ? 'Exceeded' : r.used >= 0.9 * r.required ? 'Near limit' : 'OK')]] },
  workers: { key: 'workers', name: 'Worker', f: [['id', 'Worker ID', 'text'], ['name', 'Worker Name', 'text'], ['field', 'Field', 'select', fieldNames], ['task', 'Task', 'text'],
    ['hours', 'Hours', 'number', 0, ' hrs'], ['status', 'Status', 'status', ['Working', 'Available', 'On Leave']]],
    extra: [['Attendance', (r, i) => `<button class="btn sm gray" data-att="${i}">${r.att || 'Present'} ⇄</button>`]],
    init: () => ({ id: 'W' + String(S.workers.length + 1).padStart(3, '0'), att: 'Present' }) },
  machines: { key: 'machines', name: 'Machinery', f: [['name', 'Machine', 'text'], ['type', 'Type', 'text'], ['field', 'Assigned Field', 'select', () => ['-', ...fieldNames()]],
    ['status', 'Status', 'status', ['Available', 'In Use', 'Maintenance']], ['fuel', 'Fuel', 'number', 0, '%'], ['next', 'Next Maintenance', 'date']] },
  fields: { key: 'fields', name: 'Field', f: [['field', 'Field', 'text'], ['area', 'Area', 'number', 0, ' acres'], ['crop', 'Crop', 'select', CROPS], ['soil', 'Soil Type', 'text'],
    ['status', 'Status', 'status', ['Cultivated', 'Fallow']], ['prod', 'Productivity', 'number', 0, '%']], init: () => ({ health: 'Good', water: 60 }) }
};
const cell = (f, v) => (f[2] === 'status' ? badge(v) : (v ?? '') + (f[4] || ''));
function tableHTML(cfg, rows) { // rows = [{r: record, i: index in S[key]}]
  const ex = cfg.extra || [];
  return '<div class="tw"><table><thead><tr>' + cfg.f.map((f) => `<th>${f[1]}</th>`).join('') + ex.map((e) => `<th>${e[0]}</th>`).join('') + '<th>Actions</th></tr></thead><tbody>' +
    (rows.length ? rows.map(({ r, i }) => '<tr>' + cfg.f.map((f) => `<td>${cell(f, r[f[0]])}</td>`).join('') + ex.map((e) => `<td>${e[1](r, i)}</td>`).join('') +
      `<td><button class="btn sm" data-k="${cfg.key}" data-edit="${i}">Edit</button> <button class="btn sm red" data-k="${cfg.key}" data-del="${i}">Delete</button></td></tr>`).join('')
      : '<tr><td colspan="99" class="empty">No records found.</td></tr>') + '</tbody></table></div>';
}
const allRows = (key) => S[key].map((r, i) => ({ r, i }));

let REFRESH = () => {}; // each page sets this; called after any data change
function openForm(cfg, i) { // open the modal form (i == undefined -> Add, otherwise Edit)
  const rec = i === undefined ? (cfg.init ? cfg.init() : {}) : S[cfg.key][i];
  const m = $('#modal');
  m.innerHTML = `<form class="box"><h3>${i === undefined ? 'Add' : 'Edit'} ${cfg.name}</h3>` + cfg.f.map((f) => {
    const v = rec[f[0]] ?? '', o = typeof f[3] === 'function' ? f[3]() : f[3];
    const inp = f[2] === 'select' || f[2] === 'status' ? `<select name="${f[0]}">${o.map((x) => `<option ${x == v ? 'selected' : ''}>${x}</option>`).join('')}</select>`
      : `<input name="${f[0]}" type="${f[2]}" value="${v}" required step="any" ${f[2] === 'number' ? 'min="0"' : ''}>`;
    return `<label>${f[1]}${inp}</label>`;
  }).join('') + '<div class="row"><button type="button" class="btn gray" id="cx">Cancel</button><button class="btn">Save</button></div></form>';
  m.classList.add('show');
  $('#cx').onclick = () => m.classList.remove('show');
  m.querySelector('form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target), vals = {};
    cfg.f.forEach((f) => (vals[f[0]] = f[2] === 'number' ? +fd.get(f[0]) : String(fd.get(f[0])).trim()));
    if (i === undefined) S[cfg.key].push(Object.assign({}, cfg.init ? cfg.init() : {}, vals)); else Object.assign(S[cfg.key][i], vals);
    save(); m.classList.remove('show'); REFRESH();
  };
}
// one click listener handles Add / Edit / Delete / Attendance buttons on every page
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.dataset.add) openForm(CFG[t.dataset.add]);
  else if (t.dataset.edit !== undefined) openForm(CFG[t.dataset.k], +t.dataset.edit);
  else if (t.dataset.del !== undefined) { if (confirm('Delete this record?')) { S[t.dataset.k].splice(+t.dataset.del, 1); save(); REFRESH(); } }
  else if (t.dataset.att !== undefined) { // mark attendance: Present <-> Absent
    const w = S.workers[+t.dataset.att]; w.att = w.att === 'Absent' ? 'Present' : 'Absent';
    w.status = w.att === 'Absent' ? 'On Leave' : 'Available'; save(); REFRESH();
  }
});

// ---------- 8. PAGE LAYOUT (sidebar + top bar are the same on every page) ----------
const NAV = [['index', '▣', 'Dashboard'], ['water', '💧', 'Water'], ['fertilizer', '🧪', 'Fertilizer'], ['labour', '👷', 'Labour'], ['machinery', '🚜', 'Machinery'], ['land', '🌱', 'Land'], ['reports', '📊', 'Reports']];
function buildShell() {
  const cur = document.body.dataset.page, n = recs(metrics()).filter((x) => x.lvl !== 'ok').length;
  $('#app').innerHTML = `<div class="layout"><aside class="side" id="side"><div class="logo">🌾 Farm<b>Ops</b></div>` +
    NAV.map((x) => `<a href="${x[0]}.html" class="${x[0] === cur ? 'on' : ''}">${x[1]} ${x[2]}</a>`).join('') +
    `<div class="bottom"><button id="reset">⚙ Settings </button><a href="index.html#about">👤 Farm Manager</a></div></aside>
    <div class="main"><div class="demo"></div>
    <header class="top"><button class="burger" id="burger">☰</button><span class="farm">🌾 Green Valley Farm</span><span class="date">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
    <input id="gs" placeholder="Search page (e.g. water)…"><button class="bell" id="bell">🔔<i>${n}</i></button><div class="me"><div class="av">FM</div>Farm Manager</div></header>
    <main id="page"></main></div></div>`;
  $('#burger').onclick = () => $('#side').classList.toggle('open');
  $('#reset').onclick = () => { if (confirm('Reset all data to the demo values?')) { localStorage.removeItem(KEY); location.reload(); } };
  $('#bell').onclick = () => alert('Alerts:\n\n' + recs(metrics()).map((x) => x.icon + ' ' + x.msg).join('\n'));
  $('#gs').onkeydown = (e) => { // global search: jump to the matching page
    if (e.key !== 'Enter') return;
    const q = e.target.value.toLowerCase(), hit = NAV.find((x) => x[2].toLowerCase().includes(q) || (q === 'fertilizer' && x[0] === 'fertilizer'));
    if (hit && q) location.href = hit[0] + '.html'; else alert('No matching page found.');
  };
}

// ---------- 9. PAGES ----------
const PAGES = {};
const cropStats = (c) => { // water/productivity from fields, fertilizer % from allocations
  const f = S.fields.filter((x) => x.crop === c), fr = S.fert.filter((x) => x.crop === c);
  return { water: f.length ? Math.round(sum(f, (x) => x.water) / f.length) : 0, prod: f.length ? Math.round(sum(f, (x) => x.prod) / f.length) : 0, fert: pct(sum(fr, (x) => x.used), sum(fr, (x) => x.required)) };
};
const ring = (l, v) => `<div class="rw"><div class="ring" style="--p:${v};--c:${v >= 80 ? '#14b8a6' : v >= 60 ? '#f59e0b' : '#ef4444'}"><span>${v}%</span></div>${l}</div>`;

PAGES.index = () => {
  REFRESH = () => {
    const m = metrics();

    const cards = [
      ['💧', 'Water Used', m.water + '%', `Planned: ${S.waterPlanned.toLocaleString()} L/week`, m.water],
      ['🧪', 'Fertilizer Usage', m.fert + '%', `Recommended: ${m.fReq} kg`, m.fert],
      ['👷', 'Labour Utilization', m.labour + '%', 'Target: 85%', m.labour],
      ['🚜', 'Machinery Availability', `${m.mAvail}/${m.mt}`, 'Target: all operational', pct(m.mAvail, m.mt)],
      ['🌱', 'Land Utilization', m.land + '%', 'Target: 90%', m.land]
    ];

    const sel = $('#crop') ? $('#crop').value : 'All';

    page(
      head(
        'Farm Operations Overview',
        'Monitor resources and optimize farm productivity.'
      ) +

      '<div class="cards">' +
      cards.map((c) => {
        const s = stat(c[4]);

        return `
          <div class="card">
            <div class="ct">${c[0]} ${c[1]}</div>
            <div class="big">${c[2]}</div>
            <div class="sub">${c[3]}</div>

            <div class="bar">
              <i class="${s[1]}" style="width:${Math.min(c[4], 100)}%"></i>
            </div>

            <div class="cf">
              <span>${c[4]}% of target</span>
              ${badge(s[0])}
            </div>
          </div>
        `;
      }).join('') +
      '</div>' +

      `
      <div class="panel">
        <div class="ph" style="margin:0 0 8px">
          <h3>Crop Productivity vs Resource Usage</h3>

          <select id="crop" class="btn gray">
            <option>All</option>
            ${CROPS.map((c) => `<option>${c}</option>`).join('')}
          </select>
        </div>

        <div class="cb" style="height:300px">
          <canvas id="c1"></canvas>
        </div>
      </div>
      ` +

      `
      <div class="grid2">
        <div class="panel">
          <h3>Resource Efficiency</h3>

          <div class="rings">
            ${ring('Water', eff(m.water))}
            ${ring('Fertilizer', eff(m.fert))}
            ${ring('Labour', eff(m.labour))}
            ${ring('Machinery', eff(m.mach))}
            ${ring('Land', m.land)}
          </div>
        </div>

        <div class="panel">
          <h3>Smart Recommendations / Resource Optimization</h3>
          ${recHTML(recs(m))}
        </div>
      </div>
      ` +

      `
      <div class="panel">
        <h3>Farm Field Overview</h3>

        <div class="fields">
          ${S.fields.map((f) => `
            <div class="tile ${f.health}">
              <h4>
                ${f.field}
                <span>${f.status === 'Fallow' ? 'Fallow' : f.crop}</span>
              </h4>

              <p>Area: ${f.area} acres · Health: ${f.health}</p>
              <p>💧 Water: ${f.water}%</p>
              <p>📈 Productivity: ${f.prod}%</p>

              <div class="bar">
                <i style="width:${f.prod}%"></i>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      `
    );

    $('#crop').value = sel;
    $('#crop').onchange = REFRESH;

    // productivity chart: all crops grouped, or one selected crop
    const list = sel === 'All' ? CROPS : [sel];
    const st = list.map(cropStats);

    chart(
      'c1',
      'bar',
      list,
      [
        {
          label: 'Water usage %',
          data: st.map((x) => x.water)
        },
        {
          label: 'Fertilizer usage %',
          data: st.map((x) => x.fert)
        },
        {
          label: 'Productivity %',
          data: st.map((x) => x.prod)
        }
      ],
      {
        scales: {
          y: {
            max: 110,
            beginAtZero: true
          }
        }
      }
    );
  };

  REFRESH();
};

PAGES.water = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  page(head('Water Management', 'Track consumption and plan irrigation.', 'irrigation', 'Add Schedule') + '<div class="cards" id="st"></div>' +
    `<div class="grid2">${cv('c1', 'Daily Water Consumption (L)')}${cv('c2', 'Water Required per Field (from schedule)')}</div>
    <div class="panel"><h3>Log Daily Consumption</h3><div class="inl"><select id="wd">${days.map((d) => `<option>${d}</option>`).join('')}</select><input id="wv" type="number" min="0" placeholder="Litres used"><button class="btn" id="wb">Update</button></div></div>
    <div class="panel"><h3>Irrigation Schedule</h3><div id="tbl"></div></div>`);
  $('#wb').onclick = () => { const v = $('#wv').value; if (v === '' || v < 0) return alert('Enter litres used.'); S.waterDaily[days.indexOf($('#wd').value)] = +v; save(); REFRESH(); };
  REFRESH = () => {
    const m = metrics();
    $('#st').innerHTML = tile('Total Water Available', S.waterTotal.toLocaleString() + ' L', 'per week') + tile('Water Used', m.waterUsed.toLocaleString() + ' L', m.water + '% of plan') +
      tile('Water Remaining', (S.waterTotal - m.waterUsed).toLocaleString() + ' L', 'this week') + tile('Daily Consumption', S.waterDaily[6].toLocaleString() + ' L', 'latest day (Sun)') + tile('Weekly Consumption', m.waterUsed.toLocaleString() + ' L', 'avg ' + Math.round(m.waterUsed / 7) + ' L/day');
    chart('c1', 'line', days, [{ label: 'Litres', data: S.waterDaily, fill: true, tension: .3 }]);
    chart('c2', 'bar', S.irrigation.map((x) => x.field), [{ label: 'Litres required', data: S.irrigation.map((x) => x.required) }]);
    $('#tbl').innerHTML = tableHTML(CFG.irrigation, allRows('irrigation'));
  };
  REFRESH();
};

PAGES.fertilizer = () => {
  page(head('Fertilizer Management', 'Compare fertilizer use with the recommended quantity.', 'fert', 'Add Allocation') + '<div id="warn"></div><div class="cards" id="st"></div>' + cv('c1', 'Fertilizer Usage: Required vs Used (kg)') +
    `<div class="panel"><h3>Fertilizer Allocation</h3><div class="filters"><input id="q" placeholder="Search field, crop, fertilizer…"><select id="cf"><option value="">All crops</option>${CROPS.map((c) => `<option>${c}</option>`).join('')}</select></div><div id="tbl"></div></div>`);
  REFRESH = () => {
    const m = metrics();
    $('#warn').innerHTML = m.fUsed > m.fReq ? '<div class="alert">⚠ Total fertilizer usage exceeds the recommended quantity!</div>' : S.fert.some((x) => x.used > x.required) ? '<div class="alert">⚠ One or more fields have used more fertilizer than recommended.</div>' : '';
    $('#st').innerHTML = tile('Total Fertilizer Stock', S.fertStock + ' kg') + tile('Used Quantity', m.fUsed + ' kg', m.fert + '% of recommended') + tile('Remaining Stock', S.fertStock - m.fUsed + ' kg') + tile('Monthly Usage', m.fUsed + ' kg', 'this month') + tile('Recommended Quantity', m.fReq + ' kg');
    chart('c1', 'bar', S.fert.map((x) => x.field + ' (' + x.crop + ')'), [{ label: 'Required', data: S.fert.map((x) => x.required) }, { label: 'Used', data: S.fert.map((x) => x.used) }]);
    const q = $('#q').value.toLowerCase(), c = $('#cf').value; // search + crop filter
    $('#tbl').innerHTML = tableHTML(CFG.fert, allRows('fert').filter(({ r }) => (!c || r.crop === c) && (r.field + r.crop + r.fert).toLowerCase().includes(q)));
  };
  $('#q').oninput = $('#cf').onchange = () => REFRESH();
  REFRESH();
};

PAGES.labour = () => {
  page(head('Labour Management', 'Assign workers, track attendance and utilization.', 'workers', 'Add Worker') + '<div class="cards" id="st"></div>' +
    `<div class="grid2">${cv('c1', 'Labour Utilization')}${cv('c2', 'Working Hours per Field')}</div><div class="panel"><h3>Labour Allocation</h3><div id="tbl"></div></div>`);
  REFRESH = () => {
    const m = metrics(), av = S.workers.filter((w) => w.status === 'Available').length, lv = S.workers.filter((w) => w.status === 'On Leave').length;
    $('#st').innerHTML = tile('Total Workers', S.workers.length) + tile('Available', av) + tile('Working', m.working) + tile('On Leave', lv) + tile('Utilization', m.labour + '%', 'working / present workers');
    chart('c1', 'doughnut', ['Working', 'Available', 'On Leave'], [{ data: [m.working, av, lv] }]);
    const fn = fieldNames();
    chart('c2', 'bar', fn, [{ label: 'Hours', data: fn.map((f) => sum(S.workers.filter((w) => w.field === f), (w) => w.hours)) }]);
    $('#tbl').innerHTML = tableHTML(CFG.workers, allRows('workers'));
  };
  REFRESH();
};

PAGES.machinery = () => {
  page(head('Machinery Management', 'Assign machines and watch maintenance.', 'machines', 'Add Machinery') + '<div class="cards" id="st"></div>' +
    `<div class="grid2">${cv('c1', 'Machinery Status')}${cv('c2', 'Fuel Level (%)')}</div><div class="panel"><h3>Machinery List</h3><div id="tbl"></div></div>`);
  REFRESH = () => {
    const m = metrics(), av = S.machines.filter((x) => x.status === 'Available').length;
    $('#st').innerHTML = tile('Total Machinery', m.mt) + tile('Available', av) + tile('In Use', m.inUse) + tile('Under Maintenance', m.maint) + tile('Utilization', m.mach + '%', 'in use / total');
    chart('c1', 'doughnut', ['Available', 'In Use', 'Maintenance'], [{ data: [av, m.inUse, m.maint], backgroundColor: ['#22c55e', '#3b82f6', '#ef4444'] }]);
    chart('c2', 'bar', S.machines.map((x) => x.name), [{ label: 'Fuel %', data: S.machines.map((x) => x.fuel) }], { scales: { y: { max: 100, beginAtZero: true } } });
    $('#tbl').innerHTML = tableHTML(CFG.machines, allRows('machines'));
  };
  REFRESH();
};

PAGES.land = () => {
  page(head('Land Management', 'Field allocation and land utilization.', 'fields', 'Add Field') + '<div class="cards" id="st"></div>' +
    `<div class="grid2">${cv('c1', 'Land Utilization')}${cv('c2', 'Area by Crop (acres)')}</div><div class="panel"><h3>Field Allocation</h3><div id="tbl"></div></div>`);
  REFRESH = () => {
    const m = metrics(), crops = [...new Set(S.fields.filter((f) => f.status === 'Cultivated').map((f) => f.crop))];
    $('#st').innerHTML = tile('Total Farm Area', m.area + ' acres') + tile('Cultivated Area', m.cult + ' acres', 'Cultivated: ' + m.land + '%') + tile('Unused Area', +(m.area - m.cult).toFixed(2) + ' acres', 'Unused: ' + (m.area ? 100 - m.land : 0) + '%') + tile('Crop Diversity', crops.length + ' crops', crops.join(', '));
    chart('c1', 'doughnut', ['Cultivated', 'Unused'], [{ data: [m.cult, +(m.area - m.cult).toFixed(2)], backgroundColor: ['#22c55e', '#e5e7eb'] }]);
    chart('c2', 'bar', S.fields.map((f) => f.field + ' (' + f.crop + ')'), [{ label: 'Acres', data: S.fields.map((f) => f.area) }]);
    $('#tbl').innerHTML = tableHTML(CFG.fields, allRows('fields'));
  };
  REFRESH();
};

PAGES.reports = () => {
  REFRESH = () => {
    const m = metrics(), E = [['Water Efficiency', eff(m.water)], ['Fertilizer Efficiency', eff(m.fert)], ['Labour Efficiency', eff(m.labour)], ['Machinery Utilization', m.mach], ['Land Utilization', m.land], ['Overall Farm Productivity', m.prod]];
    page(head('Farm Resource Analytics', 'Efficiency indicators and charts for Green Valley Farm.') + '<div class="cards">' + E.map((e) => tile(e[0], e[1] + '%', stat(e[1])[0])).join('') + '</div>' +
      `<div class="grid2">${cv('r1', 'Resource Usage Comparison')}${cv('r2', 'Monthly Water Consumption (L)')}</div><div class="grid2">${cv('r3', 'Fertilizer Usage (kg)')}${cv('r4', 'Labour Utilization')}</div>
      <div class="grid2">${cv('r5', 'Machinery Utilization')}${cv('r6', 'Crop Productivity (%)')}</div>
      <div class="ph noprint"><button class="btn" id="gen">Generate Report</button></div><div class="panel" id="report"></div>`);
    chart('r1', 'bar', ['Water', 'Fertilizer', 'Labour', 'Machinery', 'Land'], [{ label: 'Usage / utilization %', data: [m.water, m.fert, m.labour, m.mach, m.land] }]);
    chart('r2', 'line', ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], [{ label: 'Litres', data: S.monthWater, tension: .3, fill: true }]);
    chart('r3', 'bar', S.fert.map((x) => x.field), [{ label: 'Required', data: S.fert.map((x) => x.required) }, { label: 'Used', data: S.fert.map((x) => x.used) }]);
    chart('r4', 'doughnut', ['Working', 'Available', 'On Leave'], [{ data: [m.working, S.workers.filter((w) => w.status === 'Available').length, S.workers.filter((w) => w.status === 'On Leave').length] }]);
    chart('r5', 'doughnut', ['Available', 'In Use', 'Maintenance'], [{ data: [m.mt - m.inUse - m.maint, m.inUse, m.maint], backgroundColor: ['#22c55e', '#3b82f6', '#ef4444'] }]);
    chart('r6', 'bar', S.fields.map((f) => f.field + ' ' + f.crop), [{ label: 'Productivity %', data: S.fields.map((f) => f.prod) }], { scales: { y: { max: 100, beginAtZero: true } } });
    $('#gen').onclick = () => { // printable summary report shown on screen
      const r = $('#report');
      r.innerHTML = `<h3>FarmOps Summary Report – Green Valley Farm</h3><p>Generated: ${new Date().toLocaleString()} · Demo data for academic project</p><br>
        <div class="tw"><table><thead><tr><th>Indicator</th><th>Value</th><th>Status</th></tr></thead><tbody>${E.map((e) => `<tr><td>${e[0]}</td><td>${e[1]}%</td><td>${badge(stat(e[1])[0])}</td></tr>`).join('')}</tbody></table></div>
        <br><h3>Recommendations</h3>${recHTML(recs(m))}<div class="row noprint"><button class="btn" onclick="window.print()">🖨 Print / Save as PDF</button></div>`;
      r.classList.add('show'); r.scrollIntoView({ behavior: 'smooth' });
    };
  };
  REFRESH();
};

// ---------- 10. START ----------
buildShell();
PAGES[document.body.dataset.page]();
