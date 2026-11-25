/* Qualities — app shell, router, all role portals. Demo mode stores data in this browser (localStorage).
   When config.js has Supabase keys, Q.api (js/api.js) syncs the same objects to the database. */
{
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = Q.t, L = Q.L, I = Q.icon, N = Q.num;
const root = $('#app');

/* ---------------- store ---------------- */
const KEY = 'q_db_v3';
function seed() {
  const db = { students: structuredClone(Q.STUDENTS), sups: structuredClone(Q.SUPERVISORS), subs: [], files: [], moods: [], audit: [], drafts: {},
    stations: Object.fromEntries(Q.STATIONS.map(s => [s.id, { open: null, due: s.due }])),
    ayat: { shared: ['2:195', '3:76'], experts: ['2:195', '3:134'], ambassadors: ['2:195', '16:128'], action: ['2:195', '3:134'] },
    review: {}, recs: [], challenge: {} };
  const missions = ['أن أكون سببًا في ابتسامة كل من أقابله، وأن أُتقن كل عمل أبدؤه.', 'أن أستخدم موهبتي في الرسم لأنشر الخير وأُسعد الأطفال في المستشفيات.',
    'أن أكون عادلًا مع إخوتي وأصدقائي، وأن أساعد من لا يجد من يساعده.', 'أن أتعلم كثيرًا لأعلّم غيري، فالعلم صدقة لا تنقطع.'];
  db.students.forEach((s, i) => {
    if (s.done.includes('s1')) db.subs.push({ id: 'sub' + i, sid: s.id, st: 's1', status: 'ok', at: '2026-11-2' + (i % 4 + 1), answers: { mission: missions[i % 4], scale: s.happyBefore },
      rubric: { honesty: 3 + (i % 2), understanding: 3, life: 3 + (i % 2), craft: 3 }, comment: 'ما شاء الله، رسالتك صادقة وواضحة. حاول أن تربطها بعمل يومي صغير.' });
  });
  // three fresh submissions waiting for review (for the supervisor demo)
  [[2, 'أن أنشر التفاؤل في فصلي، وأكون أول من يشجّع زملائي.'], [10, 'أن أكون صادقًا في كل كلمة، وأن أبتسم في وجه كل من أقابله.'], [5, 'أن أُحسن إلى والديّ وأساعد في البيت دون أن يُطلب مني.'], [8, 'أن أُتقن دراستي وأساعد زملائي في الرياضيات.']].forEach(([i, m]) =>
    db.subs.push({ id: 'subp' + i, sid: db.students[i].id, st: 's1', status: 'sub', at: '2026-11-25', answers: { mission: m, scale: db.students[i].happyBefore, text: 'أنسى الوقت عندما ألعب كرة القدم مع أصدقائي.', pillars: ['O', 'A'] } }));
  db.students[0].done = []; // demo student Maryam is mid-way through Station 1
  db.subs = db.subs.filter(x => x.sid !== 'st1');
  db.files.push({ id: 'f1', sid: 'st1', st: 's1', name: 'جدار-الامتنان.jpg', type: 'image/jpeg', size: 482000, at: '2026-11-24' });
  for (let d = 13; d >= 0; d--) db.moods.push(...db.students.slice(0, 12 + (d % 5)).map((s, k) => ({ sid: s.id, d, v: 3 + ((k + d) % 3) })));
  db.audit.push({ at: '2026-11-25 09:02', who: 'admin', what: 'Imported roster: 20 students, 5 supervisors (sample)' });
  return db;
}
let db; try { db = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { db = seed(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} Q.api?.push?.(db); };
const log = (what) => { db.audit.unshift({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), who: me()?.name || '—', what }); save(); };

let session; try { session = JSON.parse(localStorage.getItem('q_session') || sessionStorage.getItem('q_session')); } catch {}
const me = () => !session ? null : session.role === 'student' ? db.students.find(s => s.id === session.id) : session.role === 'sup' ? db.sups.find(s => s.id === session.id) : session.role === 'principal' ? Q.PRINCIPAL : Q.OWNER;
const team = (id) => Q.TEAMS.find(x => x.id === id);
const station = (id) => Q.STATIONS.find(s => s.id === id);
const virtue = (id) => Q.VIRTUES.find(v => v.id === id);
const subOf = (sid, st) => db.subs.find(x => x.sid === sid && x.st === st);
const sharedSt = Q.STATIONS.filter(s => s.track === 'shared');
const trackSt = (tid) => Q.STATIONS.filter(s => s.track === tid);
const daysTo = (iso) => Math.floor((new Date(iso + 'T23:59:00') - Q.TODAY) / 864e5);
const initials = (n) => n.replace(/^أ\/\s*/, '').trim()[0];

function status(stu, s) {
  const sub = subOf(stu.id, s.id); if (sub) return sub.status; // ok | sub | back
  const cfg = db.stations[s.id] || {};
  if (cfg.open === false) return 'locked';
  const list = s.track === 'shared' ? sharedSt : trackSt(s.track);
  const prev = list[list.indexOf(s) - 1] || (s.track !== 'shared' ? sharedSt.at(-1) : null);
  const prevOk = !prev || subOf(stu.id, prev.id)?.status === 'ok';
  if (cfg.open === true) return db.drafts[stu.id]?.[s.id] ? 'draft' : 'open';
  if (!prevOk || (s.opens && new Date(s.opens) > Q.TODAY)) return 'locked';
  return db.drafts[stu.id]?.[s.id] ? 'draft' : 'open';
}
const stChip = (st) => ({ locked: `<span class="chip gray">${I('lock', 'width=13')} ${t('st_locked')}</span>`, open: `<span class="chip o">${t('st_open')}</span>`,
  draft: `<span class="chip o">${t('st_draft')}</span>`, sub: `<span class="chip blue">${t('st_sub')}</span>`, ok: `<span class="chip">${I('check', 'width=13')} ${t('st_ok')}</span>`,
  back: `<span class="chip red">${t('st_back')}</span>` }[st]);

/* ---------------- ui helpers ---------------- */
function toast(msg) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.append(d); setTimeout(() => d.remove(), 2600); }
function sheet(html, onMount) {
  const s = document.createElement('div'); s.className = 'scrim'; s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  s.addEventListener('click', e => { if (e.target === s || e.target.closest('[data-close]')) s.remove(); });
  document.body.append(s); onMount && onMount(s); return s;
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.append(c);
  const x = c.getContext('2d'), cols = ['#F39A1E', '#1E6B3C', '#2B7BB9', '#D2453B', '#ffd27a'];
  const ps = Array.from({ length: 120 }, () => ({ x: innerWidth / 2, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: Math.random() * -14 - 4, r: Math.random() * 6 + 4, c: cols[Math.random() * 5 | 0], a: Math.random() * 6 }));
  let f = 0; (function loop() { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; p.a += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (++f < 110) requestAnimationFrame(loop); else c.remove(); })();
}
function setLang(l) { Q.lang = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'; try { localStorage.setItem('q_lang', l); } catch {} render(); }
const topbar = (extra = '') => `<header class="top"><img class="seal" src="icons/gpis-logo.png" alt="GPIS"><div class="grow"><div class="t1">${t('appName')}</div><div class="t2">${t('appSub')}</div></div>
  ${extra}<button class="langbtn" data-lang>${t('lang')}</button><button class="iconbtn" data-logout aria-label="${t('logout')}">${I('logout')}</button></header>`;

/* ---------------- login ---------------- */
function viewLogin() {
  root.className = ''; root.innerHTML = `<div class="login">
  <div class="cover"><div class="seal" style="margin:auto"><img src="icons/gpis-logo.png" alt="GPIS"></div><h1>${t('appName')}</h1><p>${t('appSub')}</p><p class="tiny" style="opacity:.8;margin-top:4px">${t('school')}</p>${window.QCONFIG?.SUPABASE_URL ? '' : `<p class="tiny" style="opacity:.7;margin-top:10px">${t('demoBanner')}</p>`}</div>
  <form class="panel card stack" id="lf" autocomplete="on">
    <label class="field"><span>${t('user')}</span><input class="input" name="u" autocomplete="username" autocapitalize="none" required></label>
    <label class="field"><span>${t('pass')}</span><input class="input" name="p" type="password" autocomplete="current-password" required></label>
    <label class="row small"><input type="checkbox" name="k" checked style="width:20px;height:20px;accent-color:var(--g)"> ${t('keep')}</label>
    <p id="lerr" class="small" style="color:var(--red)" hidden>${t('wrong')}</p>
    <button class="btn block">${t('signIn')}</button>
    <div class="row between small"><button type="button" class="muted" data-trouble>${t('trouble')}</button><button type="button" class="langbtn" data-lang>${t('lang')}</button></div>
    <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
    <p class="tiny muted" style="text-align:center">${t('demo')}</p>
    <div class="seg">${[['student', 'asStudent'], ['sup', 'asSup'], ['principal', 'asPrin'], ['owner', 'asAdmin']].map(([r, k]) => `<button type="button" data-demo="${r}">${t(k)}</button>`).join('')}</div>
    <div class="row between small" style="margin-top:6px"><button type="button" class="muted" data-howto>${I('help', 'width=16')} ${t('howTo')}</button><button type="button" class="muted" data-install>${I('phone', 'width=16')} ${t('install')}</button></div>
  </form></div>`;
  $('#lf').onsubmit = (e) => { e.preventDefault(); const f = new FormData(e.target), u = f.get('u').trim().toLowerCase(), p = f.get('p');
    let s = db.students.find(x => x.user === u && x.pass === p) && { role: 'student', id: db.students.find(x => x.user === u).id };
    s ||= db.sups.find(x => x.email.split('@')[0] === u && x.pass === p) && { role: 'sup', id: db.sups.find(x => x.email.split('@')[0] === u).id };
    s ||= u === Q.PRINCIPAL.user && p === Q.PRINCIPAL.pass && { role: 'principal' };
    s ||= u === Q.OWNER.user && p === Q.OWNER.pass && { role: 'owner' };
    if (!s) { $('#lerr').hidden = false; return; } login(s, f.get('k')); };
  $('[data-trouble]').onclick = () => toast(t('troubleMsg'));
  $$('[data-demo]').forEach(b => b.onclick = () => login({ role: b.dataset.demo, id: b.dataset.demo === 'student' ? 'st1' : b.dataset.demo === 'sup' ? 'sup1' : undefined }, true));
}
function login(s, keep) { session = s; try { (keep ? localStorage : sessionStorage).setItem('q_session', JSON.stringify(s)); } catch {}
  location.hash = { student: 'home', sup: 'review', principal: 'dash', owner: 'admin' }[s.role]; render(); }

/* ---------------- student ---------------- */
const tabs = [['home', 'home'], ['journey', 'map'], ['quran', 'book'], ['portfolio', 'folder'], ['team', 'users']];
const tabbar = (on) => `<nav class="tabbar" aria-label="main"><div class="in">${tabs.map(([k, ic]) => `<a class="tab ${on === k ? 'on' : ''}" href="#${k}">${I(ic)}<span>${t(k)}</span>${on === k ? '<i class="dot"></i>' : ''}</a>`).join('')}</div></nav>`;

function currentStation(stu) { return sharedSt.find(s => ['open', 'draft', 'back'].includes(status(stu, s))) || trackSt(stu.team).find(s => ['open', 'draft', 'back'].includes(status(stu, s))); }

function viewHome() {
  const stu = me(), cur = currentStation(stu), doneN = db.subs.filter(x => x.sid === stu.id && x.status === 'ok').length, total = sharedSt.length + trackSt(stu.team).length;
  const tm = team(stu.team), todayMood = db.moods.find(m => m.sid === stu.id && m.d === 0 && m.mine);
  const pct = Math.round(doneN / total * 100), first = stu.name.split(' ')[0];
  root.innerHTML = `${topbar()}<main class="stack-lg">
  <section class="card hero stack">
    <div class="row between"><div><p class="muted small">${t('hello')} ${esc(first)}</p><h1>${Q.lang === 'ar' ? 'كل يوم أحسن من اللي فات' : 'Better than yesterday, every day'}</h1></div>
      <div class="ring" style="--p:${pct}"><b>${N(doneN)}/${N(total)}</b></div></div>
    <div class="row wrap"><span class="chip o">${I('flame', 'width=14')} ${N(stu.streak)} ${t('streak')}</span><span class="chip" style="background:#ffffff22;color:#fff">${esc(L(tm))}</span>
      <span class="chip" style="background:#ffffff22;color:#fff">${I('heart', 'width=14')} ${esc(Q.lang === 'ar' ? virtue(stu.virtue).ar : virtue(stu.virtue).en)}</span></div>
    ${cur ? `<a href="#station-${cur.id}" class="card" style="display:flex;gap:12px;align-items:center;color:var(--ink);text-decoration:none;padding:12px">
      <span class="badge" style="background:var(--o3);color:var(--o2)">${I(cur.icon)}</span><span class="grow"><span class="tiny muted">${t('next')}</span><b style="display:block">${esc(L(cur))}</b>
      ${cur.due ? `<span class="tiny" style="color:var(--o2);font-weight:700">${t('daysLeft', { n: N(Math.max(0, daysTo(db.stations[cur.id].due || cur.due))) })}</span>` : ''}</span><span class="btn o sm">${t(db.drafts[stu.id]?.[cur.id] ? 'continue' : 'start')}</span></a>` : ''}
  </section>
  <section class="card stack"><h3>${t('mood')}</h3><div class="row between" id="mood">${['😔', '😐', '🙂', '😊', '🤩'].map((e, i) => `<button class="iconbtn" style="width:54px;height:54px;font-size:28px;${todayMood?.v === i + 1 ? 'border-color:var(--o);background:var(--o3)' : ''}" data-mood="${i + 1}" aria-label="${i + 1}">${e}</button>`).join('')}</div></section>
  <section class="card stack"><div class="row between"><div><h3>${t('daily3')}</h3><p class="small muted">${t('daily3Sub')}</p></div><span class="badge">${I('sparkle')}</span></div><button class="btn ghost block" data-recall>${t('start')}</button></section>
  <section class="stack"><div class="row between"><h2>${t('pillars')}</h2><span class="tiny muted">${t('tapFlip')}</span></div>
    <div class="flips">${Q.OMAR.map(o => `<button class="flip" style="--c:${o.c}"><div class="in"><div class="f"><b>${o.k}</b><span>${esc(L(o))}</span></div><div class="b">${esc(L(o, 'd'))}</div></div></button>`).join('')}</div></section>
  <section class="card stack"><div class="row between"><h3>${esc(L(tm))}</h3><a class="small" style="color:var(--g);font-weight:700" href="#team">${t('team')} ${I('chev', 'width=14 style="transform:scaleX(var(--flip,1))"')}</a></div><p class="small muted">${esc(L(tm, 'mission'))}</p></section>
  <div class="gpis"><img src="icons/gpis-logo.png" alt=""> Green Land – Pré Vert International Schools</div><p class="tiny muted" style="text-align:center">${Q.lang === 'ar' ? 'رسالة المدرسة: أن نساهم في جعل العالم مكانًا أسعد من خلال إحسان الأقوال والأفعال.' : 'Our mission: to make the world a happier place through excellence in words and deeds.'}</p>
  </main>${tabbar('home')}`;
  $$('.flip').forEach(f => f.onclick = () => f.classList.toggle('on'));
  $$('[data-mood]').forEach(b => b.onclick = () => { db.moods = db.moods.filter(m => !(m.sid === stu.id && m.d === 0)); db.moods.push({ sid: stu.id, d: 0, v: +b.dataset.mood, mine: true }); save(); toast(t('moodSaved')); viewHome(); });
  $('[data-recall]').onclick = recall;
}
function recall() {
  const pool = Q.STATIONS.flatMap(s => s.steps.filter(x => x.t === 'quiz')).sort(() => Math.random() - .5).slice(0, 3); let i = 0, score = 0;
  const s = sheet(`<div id="rc"></div>`);
  const draw = () => { const q = pool[i], box = $('#rc', s);
    if (!q) { box.innerHTML = `<div class="stack" style="text-align:center"><h2>${N(score)} / ${N(pool.length)}</h2><p class="muted">${Q.lang === 'ar' ? 'سنعيد عليك ما نسيته بعد يومين — هكذا يثبت الحفظ.' : "We'll bring back what you missed in 2 days — that's how memory sticks."}</p><button class="btn block" data-close>${Q.lang === 'ar' ? 'تم' : 'Done'}</button></div>`; if (score === pool.length) confetti(); return; }
    box.innerHTML = `<p class="tiny muted">${t('stepOf', { a: N(i + 1), b: N(pool.length) })}</p><h3 style="margin:6px 0 14px">${esc(L(q))}</h3>${q.opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(Q.lang === 'ar' ? o[0] : o[1])}</button>`).join('')}<div id="ex"></div>`;
    $$('.opt', box).forEach(b => b.onclick = () => { if (box.dataset.done) return; box.dataset.done = 1; const k = +b.dataset.k; const ok = k === q.ok; if (ok) score++;
      b.classList.add(ok ? 'ok' : 'no'); $$('.opt', box)[q.ok].classList.add('ok');
      $('#ex', box).innerHTML = `<div class="explain stack"><b>${ok ? t('correct') : t('notQuite')}</b><p>${esc(L(q, 'why'))}</p><button class="btn block" data-n>${t('nextBtn')}</button></div>`;
      $('[data-n]', box).onclick = () => { i++; delete box.dataset.done; draw(); }; }); };
  draw();
}

function viewJourney() {
  const stu = me(), tm = team(stu.team);
  const road = (list) => `<div class="road">${list.map(s => { const st = status(stu, s), cur = ['open', 'draft', 'back'].includes(st);
    return `<div class="stop ${st === 'ok' ? 'ok' : ''} ${cur ? 'now' : ''} ${st === 'locked' ? 'locked' : ''}"><span class="pin">${st === 'ok' ? I('check', 'width=15') : N(s.n)}</span>
    <button class="card" data-st="${s.id}"><span class="badge">${I(s.icon)}</span><span class="grow"><b style="display:block;line-height:1.35">${esc(L(s))}</b>
    <span class="row wrap" style="gap:6px;margin-top:5px">${stChip(st)}${s.due ? `<span class="tiny muted">${st === 'locked' && s.opens ? t('opensOn', { d: Q.date(s.opens) }) : t('dueOn', { d: Q.date(db.stations[s.id].due || s.due) })}</span>` : ''}</span></span></button></div>`; }).join('')}</div>`;
  const done = db.subs.filter(x => x.sid === stu.id && x.status === 'ok').length, total = sharedSt.length + trackSt(stu.team).length;
  root.innerHTML = `${topbar()}<main class="stack-lg"><section class="card stack"><div class="row between"><h2>${t('journey')}</h2><b>${N(done)}/${N(total)}</b></div><div class="bar"><i style="width:${done / total * 100}%"></i></div></section>
  <section class="stack"><h3>${t('shared')}</h3>${road(sharedSt)}</section>
  <section class="stack"><h3 class="row">${t('teamTrack')}: <span style="color:${tm.color}">${esc(L(tm))}</span></h3>${road(trackSt(stu.team))}</section></main>${tabbar('journey')}`;
  $$('[data-st]').forEach(b => b.onclick = () => { const s = station(b.dataset.st), st = status(stu, s);
    if (st === 'locked') return sheet(`<div class="stack" style="text-align:center"><span class="badge" style="margin:auto">${I('lock')}</span><h3>${esc(L(s))}</h3><p class="muted">${s.opens && new Date(s.opens) > Q.TODAY ? t('opensOn', { d: Q.date(s.opens) }) : (Q.lang === 'ar' ? 'تُفتح بعد اعتماد المحطة السابقة.' : 'Opens after the previous station is approved.')}</p><button class="btn block" data-close>OK</button></div>`);
    location.hash = 'station-' + s.id; });
}

/* ---------- station player ---------- */
function viewStation(id) {
  const stu = me(), s = station(id); if (!s) return go('journey');
  const st = status(stu, s), sub = subOf(stu.id, s.id), readOnly = st === 'ok' || st === 'sub';
  const steps = [{ t: 'goals' }, ...s.steps];
  db.drafts[stu.id] ||= {}; const ans = db.drafts[stu.id][s.id] ||= (sub ? structuredClone(sub.answers) : {});
  let i = readOnly ? steps.length : (ans._i || 0);
  const draw = () => {
    if (i >= steps.length) return summary();
    const step = steps[i]; ans._i = i; save();
    root.innerHTML = `<main class="stack"><div class="row between"><button class="iconbtn" data-x aria-label="${t('back')}">${I('x')}</button><span class="tiny muted">${t('stepOf', { a: N(i + 1), b: N(steps.length) })}</span><span class="chip o">${I(s.icon, 'width=14')} ${N(s.n)}</span></div>
    <div class="stepbar">${steps.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</div>
    <p class="tiny" style="color:var(--o2);font-weight:700">${esc(L(s))}</p><div id="sb" class="stack"></div></main>
    <div class="sticky-actions"><div class="in"><button class="btn ghost" data-prev ${i ? '' : 'disabled'}>${t('back')}</button><button class="btn grow" data-next>${i === steps.length - 1 ? t('submit') : t('nextBtn')}</button></div></div>`;
    renderStep(step, $('#sb'), ans, stu, s);
    $('[data-x]').onclick = () => go('journey');
    $('[data-prev]').onclick = () => { i--; draw(); scrollTo(0, 0); };
    $('[data-next]').onclick = () => { if (step.t === 'quiz' && ans['q' + (i - 1)] == null) return toast(Q.lang === 'ar' ? 'اختر إجابة أولًا' : 'Pick an answer first');
      i++; if (i === steps.length) submit(); else { draw(); scrollTo(0, 0); } };
  };
  const submit = () => { const a = structuredClone(ans); delete a._i;
    db.subs = db.subs.filter(x => !(x.sid === stu.id && x.st === s.id)); db.subs.push({ id: 'sub' + Date.now(), sid: stu.id, st: s.id, status: 'sub', at: new Date().toISOString().slice(0, 10), answers: a });
    stu.streak++; save(); confetti(); toast(t('submitted')); summary(); };
  const summary = () => { const sb = subOf(stu.id, s.id);
    root.innerHTML = `${topbar()}<main class="stack-lg"><button class="row small" style="color:var(--g);font-weight:700" data-back>${I('back', 'width=16 style="transform:scaleX(var(--flip,1))"')} ${t('journey')}</button>
    <section class="card hero stack"><span class="chip o" style="align-self:flex-start">${Q.lang === 'ar' ? 'المحطة' : 'Station'} ${N(s.n)}</span><h1>${esc(L(s))}</h1>${stChip(sb?.status || st)}</section>
    ${sb?.status === 'ok' || sb?.status === 'back' ? `<section class="card stack"><h3>${t('feedback')}</h3>${Q.RUBRIC.map(r => `<div class="hbar"><span class="small">${esc(L(r))}</span><div class="bar"><i style="width:${(sb.rubric?.[r.id] || 0) * 25}%"></i></div><b class="small">${N(sb.rubric?.[r.id] || 0)}/${N(4)}</b></div>`).join('')}
      <div class="paper">${esc(sb.comment || '')}</div></section>` : ''}
    ${sb?.answers?.mission ? `<section class="card stack"><h3>${Q.lang === 'ar' ? 'رسالتي في الحياة' : 'My life mission'}</h3><div class="paper" style="font-size:18px">${esc(sb.answers.mission)}</div></section>` : ''}
    ${sb?.status === 'back' ? `<button class="btn o block" data-edit>${Q.lang === 'ar' ? 'عدّل وأعد التسليم' : 'Edit & resubmit'}</button>` : ''}</main>${tabbar('journey')}`;
    $('[data-back]').onclick = () => go('journey');
    $('[data-edit]') && ($('[data-edit]').onclick = () => { sb.status = 'draft'; db.subs = db.subs.filter(x => x !== sb); i = 1; save(); draw(); });
  };
  draw();
}
function renderStep(step, box, ans, stu, s) {
  const k = 'q' + s.steps.indexOf(step), upd = () => { save(); };
  const head = (txt) => `<h2 style="margin:4px 0 6px">${esc(txt)}</h2>`;
  switch (step.t) {
    case 'goals': box.innerHTML = `<section class="card hero stack"><h1>${esc(L(s))}</h1><p class="muted">${Q.lang === 'ar' ? 'خذ نفسًا عميقًا. لا توجد إجابة خاطئة حين تكتب عن نفسك — الخطأ الوحيد ألّا تكون صادقًا.' : "Take a breath. There's no wrong answer when you write about yourself — only not being honest."}</p></section>
      ${s.goalsAr ? `<section class="card stack"><h3>${t('goals')}</h3>${(Q.lang === 'ar' ? s.goalsAr : s.goalsEn).map(g => `<p class="row" style="align-items:flex-start">${I('target', 'width=18 style="flex:none;margin-top:4px;color:var(--o2)"')} ${esc(g)}</p>`).join('')}</section>` : ''}
      <p class="small muted">${t('saved')}</p>`; break;
    case 'video': box.innerHTML = `${head(L(step))}<div class="video"><div class="stack">${I('play', 'width=46 height=46 style="margin:auto"')}<p>${t('videoNote')}</p></div></div><button class="btn ghost block" data-w>${ans[k] ? I('check', 'width=18') + ' ' : ''}${t('watched')}</button>`;
      $('[data-w]', box).onclick = () => { ans[k] = true; upd(); renderStep(step, box, ans, stu, s); }; break;
    case 'quiz': box.innerHTML = `${head(L(step))}<p class="tiny muted">${Q.lang === 'ar' ? 'إجابتك الأولى هي التي تُحسب — فكّر قبل أن تختار.' : 'Your first answer counts — think before you tap.'}</p>${step.opts.map((o, j) => `<button class="opt ${ans[k] != null ? (j === step.ok ? 'ok' : j === ans[k] ? 'no' : '') : ''}" data-j="${j}">${esc(Q.lang === 'ar' ? o[0] : o[1])}</button>`).join('')}
      ${ans[k] != null ? `<div class="explain"><b>${ans[k] === step.ok ? t('correct') : t('notQuite')}</b> ${esc(L(step, 'why'))}</div>` : ''}`;
      $$('[data-j]', box).forEach(b => b.onclick = () => { if (ans[k] != null) return; ans[k] = +b.dataset.j; if (ans[k] === step.ok) confetti(); upd(); renderStep(step, box, ans, stu, s); }); break;
    case 'scale': case 'self': box.innerHTML = `${head(L(step))}<div class="scale">${Array.from({ length: 10 }, (_, j) => `<button class="${ans.scale === j + 1 ? 'on' : ''}" data-v="${j + 1}">${N(j + 1)}</button>`).join('')}</div>
      <div class="row between tiny muted"><span>${Q.lang === 'ar' ? 'قليلًا' : 'A little'}</span><span>${Q.lang === 'ar' ? 'جدًّا' : 'Very'}</span></div>
      <label class="field"><span>${t('why')}</span><textarea data-t placeholder="${t('writeHere')}">${esc(ans.scaleWhy || '')}</textarea></label>`;
      $$('[data-v]', box).forEach(b => b.onclick = () => { ans.scale = +b.dataset.v; upd(); $$('[data-v]', box).forEach(x => x.classList.toggle('on', x === b)); });
      $('[data-t]', box).oninput = (e) => { ans.scaleWhy = e.target.value; upd(); }; break;
    case 'pillars': ans.pillars ||= []; box.innerHTML = `${head(L(step))}<div>${Q.OMAR.map(o => `<button class="pill ${ans.pillars.includes(o.k) ? 'on' : ''}" style="--c:${o.c}" data-p="${o.k}"><b style="color:${o.c}">${o.k}</b> ${esc(L(o))}</button>`).join('')}</div>
      <label class="field"><span>${Q.lang === 'ar' ? 'أيّ ركن ينقصك؟ وكيف تقوّيه؟' : 'Which pillar is missing? How will you grow it?'}</span><textarea data-t placeholder="${t('writeHere')}">${esc(ans.missing || '')}</textarea></label>`;
      $$('[data-p]', box).forEach(b => b.onclick = () => { const p = b.dataset.p; ans.pillars = ans.pillars.includes(p) ? ans.pillars.filter(x => x !== p) : [...ans.pillars, p]; b.classList.toggle('on'); upd(); });
      $('[data-t]', box).oninput = (e) => { ans.missing = e.target.value; upd(); }; break;
    case 'text': box.innerHTML = `${head(L(step))}<textarea data-t placeholder="${t('writeHere')}" style="min-height:200px">${esc(ans[k] || '')}</textarea><p class="tiny muted" data-c></p>`;
      { const ta = $('[data-t]', box), c = $('[data-c]', box), cnt = () => c.textContent = (Q.lang === 'ar' ? 'عدد الكلمات: ' : 'Words: ') + N(ta.value.trim().split(/\s+/).filter(Boolean).length);
        cnt(); ta.oninput = () => { ans[k] = ta.value; if (k === 'q' + s.steps.findIndex(x => x.t === 'text')) ans.text = ta.value; cnt(); upd(); }; } break;
    case 'mission': ans.mission ??= L(step, 'draft'); box.innerHTML = `${head(L(step))}<p class="small muted">${Q.lang === 'ar' ? 'هذه مسودّة لتبدأ منها. غيّر فيها حتى تصبح رسالتك أنت.' : 'A draft to start from. Change it until it is truly yours.'}</p><div class="paper"><textarea data-t style="border:0;background:transparent;font-size:19px;min-height:150px">${esc(ans.mission)}</textarea></div>`;
      $('[data-t]', box).oninput = (e) => { ans.mission = e.target.value; upd(); }; break;
    case 'upload': { const mine = db.files.filter(f => f.sid === stu.id && f.st === s.id);
      box.innerHTML = `${head(L(step))}${dropZone()}<p class="tiny muted">${t('filesTo', { p: drivePath(stu, s) })}</p><div class="list">${mine.map(fileRow).join('')}</div>`;
      bindDrop(box, stu, s, () => renderStep(step, box, ans, stu, s)); break; }
    case 'cards': box.innerHTML = `${head(L(step))}<div class="flips">${Q.OMAR.map(o => `<button class="flip" style="--c:${o.c}"><div class="in"><div class="f"><b>${o.k}</b><span>${esc(L(o))}</span></div><div class="b">${esc(L(o, 'd'))}</div></div></button>`).join('')}</div>`;
      $$('.flip', box).forEach(f => f.onclick = () => f.classList.toggle('on')); break;
    case 'cards-virtues': box.innerHTML = `${head(L(step))}${Q.VIRTUES.map(v => `<details class="card flat"><summary>${esc(v.ar)} — ${esc(v.people)}</summary><p class="small"><b>${Q.lang === 'ar' ? 'لغةً' : 'Literally'}:</b> ${esc(v.lugha)}</p><p class="small"><b>${Q.lang === 'ar' ? 'اصطلاحًا' : 'Meaning'}:</b> ${esc(v.istilah)}</p><a class="small" style="color:var(--g);font-weight:700" href="#quran-${v.ayah.replace(':', '-')}">${I('book', 'width=15')} ${Q.lang === 'ar' ? 'استمع لآية الحب' : 'Hear the love verse'}</a></details>`).join('')}`; break;
    case 'recite': { const key = step.ayah === 'virtue' ? virtue(stu.virtue).ayah : step.ayah;
      box.innerHTML = `${head(L(step))}<div class="mushaf"><p class="ayah" data-a>${t('q_loading')}</p></div><a class="btn o block" href="#quran-${key.replace(':', '-')}">${I('book', 'width=18')} ${t('q_title')}</a>`;
      Q.Quran.text(key).then(v => { $('[data-a]', box).innerHTML = `${esc(v.uthmani)} <span class="num">${N(v.n)}</span><br><span class="tiny muted" style="font-family:var(--f)">${esc(v.surah)}</span>`; }).catch(() => $('[data-a]', box).textContent = t('q_offline')); break; }
    case 'choose-team': box.innerHTML = `${head(L(step))}${Q.TEAMS.map(tm => `<button class="opt ${(ans.team || stu.team) === tm.id ? 'ok' : ''}" data-tm="${tm.id}"><b style="color:${tm.color}">${esc(L(tm))}</b><span class="small muted" style="display:block;font-weight:400">${esc(L(tm, 'mission'))}</span></button>`).join('')}`;
      $$('[data-tm]', box).forEach(b => b.onclick = () => { ans.team = b.dataset.tm; upd(); renderStep(step, box, ans, stu, s); }); break;
    case 'choose-virtue': box.innerHTML = `${head(L(step))}<div>${Q.VIRTUES.map(v => `<button class="pill ${(ans.virtue || stu.virtue) === v.id ? 'on' : ''}" style="--c:var(--g)" data-v="${v.id}">${esc(v.ar)}</button>`).join('')}</div>`;
      $$('[data-v]', box).forEach(b => b.onclick = () => { ans.virtue = b.dataset.v; upd(); renderStep(step, box, ans, stu, s); }); break;
    case 'challenge': ans.days ||= []; box.innerHTML = `${head(L(step))}<p class="small muted">${Q.lang === 'ar' ? 'كل يوم تعمل فيه عملًا من أعمال صفتك، اضغط على اليوم.' : 'Tap each day you practised your virtue.'}</p>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">${Array.from({ length: 30 }, (_, d) => `<button class="iconbtn" style="width:auto;aspect-ratio:1;${ans.days.includes(d) ? 'background:var(--g);color:#fff;border-color:var(--g)' : ''}" data-d="${d}">${N(d + 1)}</button>`).join('')}</div>`;
      $$('[data-d]', box).forEach(b => b.onclick = () => { const d = +b.dataset.d; ans.days = ans.days.includes(d) ? ans.days.filter(x => x !== d) : [...ans.days, d]; upd(); renderStep(step, box, ans, stu, s); }); break;
  }
}
const drivePath = (stu, s) => `Qualities / ${L(team(stu.team))} / ${stu.name}${s ? ' / ' + (Q.lang === 'ar' ? 'المحطة ' : 'Station ') + N(s.n) : ''}`;
const dropZone = () => `<label class="drop">${I('upload')}<b>${t('uploadHint')}</b><span class="tiny">JPG · PNG · MP4 · PDF · DOCX · MP3</span><input type="file" multiple hidden accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"></label>`;
const fileRow = (f) => `<div><span class="badge">${I(f.type.startsWith('image') ? 'sun' : f.type.startsWith('audio') ? 'mic' : f.type.startsWith('video') ? 'play' : 'file')}</span><span class="grow"><b class="small" style="display:block;overflow-wrap:anywhere">${esc(f.name)}</b><span class="tiny muted">${(f.size / 1024 / 1024).toFixed(1)} MB · ${esc(f.at)}</span></span>${f.url ? `<audio controls src="${f.url}" style="height:34px;max-width:150px"></audio>` : `<span class="chip">${I('drive', 'width=13')} Drive</span>`}</div>`;
function bindDrop(box, stu, s, after) {
  $('input[type=file]', box).onchange = async (e) => { for (const f of e.target.files) {
    const rec = { id: 'f' + Date.now() + Math.random(), sid: stu.id, st: s?.id || 'general', name: f.name, type: f.type || 'application/octet-stream', size: f.size, at: new Date().toISOString().slice(0, 10) };
    db.files.push(rec); Q.api?.upload?.(f, { student: stu, team: team(stu.team), station: s }); }
    save(); toast(Q.lang === 'ar' ? 'رُفع الملف إلى درايف ✓' : 'Uploaded to Drive ✓'); after(); };
}

/* ---------- Quran studio ---------- */
let player = null;
function viewQuran(pre) {
  const stu = me(); const keys = [...new Set([...(pre ? [pre] : []), virtue(stu.virtue).ayah, ...(db.ayat[stu.team] || []), ...db.ayat.shared])];
  let mode = 'listen', sel = 0, level = 0, opts = { speed: 1, repeat: 1, gap: false, teacher: false }, verses = [];
  player?.pause(); player = Q.Quran.player(st => { $$('.ayah-row').forEach((r, k) => r.classList.toggle('playing', st.playing && k === st.i)); const pb = $('[data-play]'); pb && (pb.innerHTML = I(st.playing ? 'pause' : 'play') + ' ' + t(st.playing ? 'q_pause' : 'q_play')); });
  root.innerHTML = `${topbar()}<main class="stack-lg"><section class="card hero stack"><h1>${t('q_title')}</h1><p class="muted">${t('q_sub')}</p></section>
  <div class="seg3" role="tablist">${['listen', 'mem', 'recite'].map(m => `<button data-m="${m}" class="${m === mode ? 'on' : ''}">${t('q_' + m)}</button>`).join('')}</div>
  <div class="row wrap" id="keys"></div><div id="qb" class="stack"><p class="muted">${t('q_loading')}</p></div></main>${tabbar('quran')}`;
  $$('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; $$('[data-m]').forEach(x => x.classList.toggle('on', x === b)); player.pause(); draw(); });
  Promise.all(keys.map(k => Q.Quran.text(k).catch(() => null))).then(vs => { verses = vs.filter(Boolean); if (!verses.length) { $('#qb').innerHTML = `<p class="card">${t('q_offline')}</p>`; return; } player.set(verses.map(v => v.key)); draw(); });
  const sname = (v) => v.surah.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/^سورة\s*/, '');
  const tokens = (v) => v.uthmani.split(/\s+/).filter(w => /[ء-يٱ]/.test(w));
  function keyChips() { $('#keys').innerHTML = verses.map((v, k) => `<button class="chip ${k === sel ? 'o' : 'gray'}" data-k="${k}">${esc(sname(v))} ${N(v.n)}</button>`).join('');
    $$('[data-k]').forEach(b => b.onclick = () => { sel = +b.dataset.k; player.pause(); draw(); }); }
  function draw() {
    keyChips(); const qb = $('#qb');
    if (mode === 'listen') {
      qb.innerHTML = `<div class="mushaf">${verses.map((v, k) => `<div class="ayah-row" data-row="${k}"><p class="ayah">${esc(v.uthmani)} <span class="num">${N(v.n)}</span></p><p class="tiny muted">${esc(sname(v))} · ${esc(v.surahEn)} ${v.key}</p></div>`).join('')}</div>
      <section class="card stack"><button class="btn block" data-play>${I('play')} ${t('q_play')}</button>
        <div class="row between"><b class="small">${t('q_speed')}</b><div class="speeds">${[0.5, 0.75, 1, 1.25, 1.5].map(x => `<button data-sp="${x}" class="${opts.speed === x ? 'on' : ''}">${x}×</button>`).join('')}</div></div>
        <div class="row between"><b class="small">${t('q_repeat')}</b><div class="row"><button class="iconbtn" data-rp="-1">${I('minus')}</button><b style="min-width:28px;text-align:center" data-rpv>${N(opts.repeat)}</b><button class="iconbtn" data-rp="1">${I('plus')}</button></div></div>
        <div class="row between"><b class="small">${t('q_gap')}</b><button class="toggle ${opts.gap ? 'on' : ''}" data-tg="gap" aria-label="${t('q_gap')}"></button></div>
        <div class="row between"><b class="small">${t('q_teacher')}</b><button class="toggle ${opts.teacher ? 'on' : ''}" data-tg="teacher" aria-label="${t('q_teacher')}"></button></div></section>`;
      $('[data-play]').onclick = () => player.playing ? player.pause() : player.play();
      $$('[data-row]').forEach(r => r.onclick = () => player.play(+r.dataset.row));
      $$('[data-sp]').forEach(b => b.onclick = () => { opts.speed = +b.dataset.sp; player.opt(opts); $$('[data-sp]').forEach(x => x.classList.toggle('on', x === b)); });
      $$('[data-rp]').forEach(b => b.onclick = () => { opts.repeat = Math.min(10, Math.max(1, opts.repeat + +b.dataset.rp)); player.opt(opts); $('[data-rpv]').textContent = N(opts.repeat); });
      $$('[data-tg]').forEach(b => b.onclick = () => { opts[b.dataset.tg] = !opts[b.dataset.tg]; b.classList.toggle('on'); player.opt({ ...opts }); });
    } else if (mode === 'mem') {
      const v = verses[sel], tk = tokens(v);
      qb.innerHTML = `<div class="seg3">${t('q_lv').map((l, k) => `<button data-lv="${k}" class="${k === level ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="mushaf"><p class="ayah">${tk.map((w, k) => `<span class="w ${level === 2 ? 'hid' : ''}" data-w="${k}">${level === 1 ? esc(Q.Quran.firstLetters(w)) : esc(w)}</span>`).join(' ')} <span class="num">${N(v.n)}</span></p></div>
      <p class="tiny muted" style="text-align:center">${t('q_tapPeek')}</p><button class="btn ghost block" data-hear>${I('play')} ${t('q_listen')}</button>`;
      $$('[data-lv]').forEach(b => b.onclick = () => { level = +b.dataset.lv; draw(); });
      $$('[data-w]').forEach(w => w.onclick = () => { w.textContent = tk[+w.dataset.w]; w.classList.remove('hid'); w.classList.add('peek'); });
      $('[data-hear]').onclick = () => player.play(sel);
    } else {
      const v = verses[sel], tk = tokens(v), clean = Q.Quran.words(v.clean), useClean = clean.length === tk.length;
      qb.innerHTML = `<div class="mushaf"><p class="ayah" data-rv>${tk.map((w, k) => `<span class="w hid" data-w="${k}">${esc(w)}</span>`).join(' ')} <span class="num">${N(v.n)}</span></p></div>
      <section class="card stack" style="text-align:center"><button class="mic" data-mic aria-label="${t('q_mic')}">${I('mic')}</button><b data-ms>${t('q_mic')}</b><p class="tiny muted" data-heard></p>
      ${Q.Quran.hasSR ? '' : `<p class="small" style="color:var(--o2)">${t('q_noSR')}</p>`}<p class="tiny muted">${t('q_note')}</p></section>`;
      let rec = null, recog = null, live = false;
      const paint = (heard, final) => { const res = Q.Quran.check(useClean ? clean.join(' ') : tk.join(' '), heard); let got = 0;
        $$('[data-w]').forEach((w, k) => { w.classList.remove('hid', 'ok', 'no'); if (res[k]) { w.classList.add('ok'); got++; } else if (final) w.classList.add('no'); else w.classList.add('hid'); });
        return got; };
      $('[data-mic]').onclick = async () => {
        if (live) { live = false; recog?.stop(); const blob = await rec?.stop(); $('[data-mic]').classList.remove('live'); $('[data-ms]').textContent = t('q_mic');
          if (blob) { db.recs.push({ sid: stu.id, key: v.key, at: new Date().toISOString().slice(0, 10) }); db.files.push({ id: 'r' + Date.now(), sid: stu.id, st: 'quran', name: `تسميع ${v.surah} ${v.n}.webm`, type: 'audio/webm', size: blob.size, at: new Date().toISOString().slice(0, 10), url: URL.createObjectURL(blob) });
            Q.api?.upload?.(blob, { student: stu, team: team(stu.team), station: { n: 'Quran' }, name: `recite-${v.key}.webm` }); stu.reciteMin = (stu.reciteMin || 0) + 1; save(); toast(t('q_rec')); }
          return; }
        live = true; $('[data-mic]').classList.add('live'); $('[data-ms]').textContent = t('q_listening'); $$('[data-w]').forEach(w => { w.className = 'w hid'; });
        try { rec = await Q.Quran.recorder(); } catch { rec = null; }
        recog = Q.Quran.listen(txt => { $('[data-heard]').textContent = txt.trim().split(' ').slice(-8).join(' '); paint(txt, false); },
          (final) => { if (!final) return; const got = paint(final, true); $('[data-ms]').textContent = t('q_score', { a: N(got), b: N(tk.length) }); if (got / tk.length >= .9) confetti(); });
      };
    }
  }
}

/* ---------- portfolio & team ---------- */
function viewPortfolio() {
  const stu = me(), mine = db.files.filter(f => f.sid === stu.id);
  root.innerHTML = `${topbar()}<main class="stack-lg"><section class="card hero stack"><h1>${t('myFiles')}</h1><p class="muted">${t('filesTo', { p: drivePath(stu) })}</p></section>
  <section class="stack"><h3>${t('uploadNew')}</h3><label class="field"><span>${t('stations')}</span><select id="pst">${[...sharedSt, ...trackSt(stu.team)].map(s => `<option value="${s.id}">${N(s.n)} · ${esc(L(s))}</option>`).join('')}</select></label>${dropZone()}</section>
  <section class="card"><div class="list">${mine.length ? mine.slice().reverse().map(fileRow).join('') : `<p class="muted">${t('noFiles')}</p>`}</div></section></main>${tabbar('portfolio')}`;
  bindDrop(document, stu, { get id() { return $('#pst').value; } }, viewPortfolio);
}
function viewTeam() {
  const stu = me(), tm = team(stu.team), mates = db.students.filter(s => s.team === tm.id);
  const prog = (s) => db.subs.filter(x => x.sid === s.id && x.status === 'ok').length;
  const tp = Math.round(mates.reduce((a, s) => a + prog(s), 0) / (mates.length * (sharedSt.length + trackSt(tm.id).length)) * 100);
  const badges = [['star', 'أول محطة', 'First station', prog(stu) > 0], ['flame', '٧ أيام متتالية', '7-day streak', stu.streak >= 7], ['book', 'صوت الإحسان', 'First recitation', db.recs.some(r => r.sid === stu.id)],
    ['heart', 'قلب ممتن', 'Grateful heart', db.moods.some(m => m.sid === stu.id && m.mine)], ['users', 'روح الفريق', 'Team spirit', tp >= 50], ['sparkle', 'حافظ الآيات', 'Verse keeper', (stu.reciteMin || 0) >= 30]];
  root.innerHTML = `${topbar()}<main class="stack-lg"><section class="card hero stack" style="background:linear-gradient(135deg,${tm.color},var(--g2))"><span class="badge" style="background:#ffffff22;color:#fff">${I(tm.icon)}</span><h1>${esc(L(tm))}</h1><p class="muted">${esc(L(tm, 'mission'))}</p>
    <div><div class="row between small"><span>${t('teamProg')}</span><b>${N(tp)}${Q.lang === 'ar' ? '٪' : '%'}</b></div><div class="bar"><i style="width:${tp}%"></i></div></div></section>
  <section class="card"><h3>${t('members')}</h3><div class="list">${mates.map(s => `<div><span class="av" style="background:${tm.color}">${esc(initials(s.name))}</span><span class="grow"><b class="small">${esc(s.name)}${s.id === stu.id ? (Q.lang === 'ar' ? ' (أنت)' : ' (you)') : ''}</b><span class="tiny muted" style="display:block">${esc(virtue(s.virtue).ar)}</span></span><span class="chip o">${I('flame', 'width=13')} ${N(s.streak)}</span></div>`).join('')}</div></section>
  <section class="stack"><h3>${t('badges')}</h3><div class="grid g3" style="grid-template-columns:repeat(3,minmax(0,1fr))">${badges.map(([ic, ar, en, on]) => `<div class="card flat" style="text-align:center;padding:12px;${on ? '' : 'opacity:.45;filter:grayscale(1)'}"><span class="badge" style="margin:0 auto 6px;${on ? 'background:var(--o3);color:var(--o2)' : ''}">${I(ic)}</span><b class="tiny">${Q.lang === 'ar' ? ar : en}</b></div>`).join('')}</div></section></main>${tabbar('team')}`;
}

/* ---------------- supervisor ---------------- */
function viewReview(subId) {
  const sup = me(), mine = db.students.filter(s => s.sup === sup.id), pending = db.subs.filter(x => x.status === 'sub' && mine.some(s => s.id === x.sid));
  if (subId) return reviewOne(db.subs.find(x => x.id === subId));
  root.className = 'app'; root.innerHTML = `${topbar()}<main class="stack-lg"><section class="card hero stack"><p class="muted">${t('hello')} ${esc(sup.name)}</p><h1>${N(pending.length)} ${t('inbox')}</h1></section>
  <div class="tabs"><button class="on" data-tb="in">${t('inbox')}</button><button data-tb="st">${t('myStudents')} (${N(mine.length)})</button></div>
  <section id="sv"></section></main>`;
  const inbox = () => $('#sv').innerHTML = pending.length ? `<div class="card"><div class="list">${pending.map(x => { const s = db.students.find(y => y.id === x.sid);
    return `<a href="#review-${x.id}" style="color:inherit;text-decoration:none"><span class="av" style="background:${team(s.team).color}">${esc(initials(s.name))}</span><span class="grow"><b class="small">${esc(s.name)}</b><span class="tiny muted" style="display:block">${esc(L(station(x.st)))} · ${esc(x.at)}</span></span>${I('chev', 'width=18 style="transform:scaleX(var(--flip,1))"')}</a>`; }).join('')}</div></div>` : `<p class="card muted">${t('empty')}</p>`;
  const studs = () => $('#sv').innerHTML = `<div class="card"><div class="list">${mine.map(s => { const n = db.subs.filter(x => x.sid === s.id && x.status === 'ok').length, mood = db.moods.filter(m => m.sid === s.id).at(-1);
    return `<div><span class="av" style="background:${team(s.team).color}">${esc(initials(s.name))}</span><span class="grow"><b class="small">${esc(s.name)}</b><span class="tiny muted" style="display:block">${esc(L(team(s.team)))} · ${N(n)} ${Q.lang === 'ar' ? 'محطات' : 'stations'} · ${N(s.reciteMin || 0)} ${Q.lang === 'ar' ? 'د تلاوة' : 'min recited'}</span></span><span style="font-size:22px">${['😔', '😐', '🙂', '😊', '🤩'][(mood?.v || 3) - 1]}</span></div>`; }).join('')}</div></div>`;
  $$('[data-tb]').forEach(b => b.onclick = () => { $$('[data-tb]').forEach(x => x.classList.toggle('on', x === b)); b.dataset.tb === 'in' ? inbox() : studs(); }); inbox();
}
function reviewOne(x) {
  if (!x) return go('review'); const s = db.students.find(y => y.id === x.sid), stn = station(x.st), a = x.answers || {}; x.rubric ||= {};
  const qa = stn.steps.map((st, k) => { const v = st.t === 'quiz' ? (a['q' + k] != null ? (a['q' + k] === st.ok ? '✓ ' : '✗ ') + (Q.lang === 'ar' ? st.opts[a['q' + k]][0] : st.opts[a['q' + k]][1]) : null)
    : st.t === 'scale' ? (a.scale ? N(a.scale) + ' / ' + N(10) + (a.scaleWhy ? ' — ' + a.scaleWhy : '') : null) : st.t === 'pillars' ? (a.pillars || []).join(' · ') + (a.missing ? ' — ' + a.missing : '')
    : st.t === 'mission' ? a.mission : st.t === 'text' ? (a['q' + k] || (k === stn.steps.findIndex(y => y.t === 'text') ? a.text : '')) : null;
    return v ? `<div class="stack" style="padding:10px 0;border-bottom:1px solid var(--line)"><p class="tiny muted">${esc(L(st))}</p><p>${esc(v)}</p></div>` : ''; }).join('');
  const files = db.files.filter(f => f.sid === s.id && (f.st === x.st || f.st === 'quran'));
  root.innerHTML = `${topbar()}<main class="stack-lg"><button class="row small" style="color:var(--g);font-weight:700" data-back>${I('back', 'width=16 style="transform:scaleX(var(--flip,1))"')} ${t('inbox')}</button>
  <section class="card stack"><div class="row"><span class="av" style="background:${team(s.team).color}">${esc(initials(s.name))}</span><div><h3>${esc(s.name)}</h3><p class="tiny muted">${esc(L(team(s.team)))} · ${esc(L(stn))}</p></div></div>${qa}
  ${files.length ? `<div class="list">${files.map(fileRow).join('')}</div>` : ''}</section>
  <section class="card stack"><h3>${t('grade')}</h3>${Q.RUBRIC.map(r => `<div class="row between wrap"><b class="small">${esc(L(r))}</b><div class="stars">${[1, 2, 3, 4].map(n => `<button data-r="${r.id}" data-n="${n}" class="${x.rubric[r.id] >= n ? 'on' : ''}">${N(n)}</button>`).join('')}</div></div>`).join('')}
  <label class="field"><span>${t('comment')}</span><textarea id="cm" placeholder="${Q.lang === 'ar' ? 'ابدأ بما أحسن فيه، ثم خطوة واحدة للتحسين…' : 'Start with what they did well, then one step to grow…'}">${esc(x.comment || '')}</textarea></label>
  <div class="grid g2 m1"><button class="btn ghost" data-sb>${t('sendBack')}</button><button class="btn" data-ap>${t('approve')}</button></div></section></main>`;
  $('[data-back]').onclick = () => go('review');
  $$('[data-r]').forEach(b => b.onclick = () => { x.rubric[b.dataset.r] = +b.dataset.n; $$(`[data-r="${b.dataset.r}"]`).forEach(y => y.classList.toggle('on', +y.dataset.n <= +b.dataset.n)); save(); });
  const done = (stt) => { x.comment = $('#cm').value; x.status = stt; save(); log(`${stt === 'ok' ? 'Approved' : 'Returned'} ${stn.id} for ${s.name}`); toast(stt === 'ok' ? '✓' : '↩'); go('review'); };
  $('[data-ap]').onclick = () => done('ok'); $('[data-sb]').onclick = () => done('back');
}

/* ---------------- principal ---------------- */
function viewDash() {
  root.className = 'app wide'; const S = db.students, n = S.length, owner = session.role === 'owner';
  const active = new Set([...db.subs.map(x => x.sid), ...db.moods.filter(m => m.d <= 6).map(m => m.sid)]).size;
  const okSubs = db.subs.filter(x => x.status === 'ok').length, pend = db.subs.filter(x => x.status === 'sub').length;
  const hb = S.reduce((a, s) => a + s.happyBefore, 0) / n, hn = S.reduce((a, s) => a + s.happyNow, 0) / n, mins = S.reduce((a, s) => a + (s.reciteMin || 0), 0);
  const byTeam = Q.TEAMS.map(tm => { const m = S.filter(s => s.team === tm.id); return { tm, p: Math.round(m.filter(s => subOf(s.id, 's1')?.status === 'ok').length / m.length * 100), n: m.length }; });
  const act = Array.from({ length: 14 }, (_, k) => new Set(db.moods.filter(m => m.d === 13 - k).map(m => m.sid)).size);
  const spots = db.subs.filter(x => x.status === 'ok' && x.answers?.mission).slice(0, 3);
  const f1 = (v) => N(v.toFixed(1));
  root.innerHTML = `${topbar(owner ? `<a class="langbtn" href="#admin">${t('admin')}</a>` : '')}<main class="stack-lg">
  <section class="stack"><p class="small muted">${t('dash')} · ${Q.date('2026-11-25')}</p><h1 style="max-width:30ch">${Q.lang === 'ar' ? `${N(Math.round(active / n * 100))}٪ من الطلاب بدأوا رحلتهم، والسعادة ارتفعت من ${f1(hb)} إلى ${f1(hn)}` : `${Math.round(active / n * 100)}% of students have started, and happiness rose from ${hb.toFixed(1)} to ${hn.toFixed(1)}`}</h1></section>
  <section class="grid g4">${[[t('participation'), N(Math.round(active / n * 100)) + '٪', `${N(active)}/${N(n)}`], [t('completion'), N(okSubs), `${N(pend)} ${Q.lang === 'ar' ? 'بانتظار المراجعة' : 'awaiting review'}`],
    [t('happiness'), f1(hn) + '/١٠', `▲ ${f1(hn - hb)} ${Q.lang === 'ar' ? 'منذ البداية' : 'since start'}`], [t('recitation'), N(mins), Q.lang === 'ar' ? 'دقيقة استماع وتسميع' : 'minutes listened & recited']]
    .map(([a, b, c]) => `<div class="card kpi"><p class="small muted">${a}</p><b>${b.replace('/١٠', Q.lang === 'ar' ? '/١٠' : '/10').replace('٪', Q.lang === 'ar' ? '٪' : '%')}</b><span class="delta">${c}</span></div>`).join('')}</section>
  <section class="grid g2 m1"><div class="card stack"><h3>${t('byTeam')} — ${Q.lang === 'ar' ? 'المحطة ١' : 'Station 1'}</h3>${byTeam.map(b => `<div class="hbar"><span class="small"><b style="color:${b.tm.color}">●</b> ${esc(L(b.tm))}</span><div class="bar"><i style="width:${b.p}%;background:${b.tm.color}"></i></div><b class="small">${N(b.p)}${Q.lang === 'ar' ? '٪' : '%'}</b></div>`).join('')}</div>
    <div class="card stack"><h3>${t('activity')}</h3><div class="fig" style="min-height:130px"><svg class="spark" id="sp"></svg></div><p class="tiny muted">${Q.lang === 'ar' ? 'عدد الطلاب النشطين يوميًا (تسجيل مزاج، محطة، أو تلاوة)' : 'Daily active students (mood check-in, station or recitation)'}</p></div></section>
  <section class="grid g2 m1"><div class="card stack"><h3>${t('kpis')}</h3>${[[Q.lang === 'ar' ? 'مبادرات ناجحة (الهدف ٣)' : 'Successful initiatives (target 3)', 1, 3], [Q.lang === 'ar' ? 'رضا المستفيدين (الهدف ٨٠٪)' : 'Beneficiary satisfaction (target 80%)', 0, 80], [Q.lang === 'ar' ? 'المحطات المشتركة المنجزة' : 'Shared stations completed', 1, 10]]
      .map(([l, v, g]) => `<div class="hbar" style="grid-template-columns:minmax(0,1.4fr) 1fr 56px"><span class="small">${l}</span><div class="bar"><i style="width:${v / g * 100}%"></i></div><b class="small">${N(v)}/${N(g)}</b></div>`).join('')}
      <p class="tiny muted">${Q.lang === 'ar' ? 'أرقام تجريبية للعرض.' : 'Sample figures for the demo.'}</p></div>
    <div class="card stack"><h3>${t('spotlight')}</h3>${spots.map(x => { const s = S.find(y => y.id === x.sid); return `<div class="paper"><p>«${esc(x.answers.mission)}»</p><p class="tiny muted" style="margin-top:6px">— ${esc(s.name)} · ${esc(L(team(s.team)))}</p></div>`; }).join('')}</div></section>
  <section class="card"><h3>${t('supervisors')}</h3><div class="scroll"><table class="stack-m"><thead><tr><th>${Q.lang === 'ar' ? 'المشرف' : 'Supervisor'}</th><th class="num">${t('students')}</th><th class="num">${t('inbox')}</th><th class="num">${Q.lang === 'ar' ? 'معتمدة' : 'Approved'}</th></tr></thead><tbody>
  ${db.sups.map(sp => { const ids = S.filter(s => s.sup === sp.id).map(s => s.id); return `<tr><td>${esc(sp.name)}</td><td class="num">${N(ids.length)}</td><td class="num">${N(db.subs.filter(x => x.status === 'sub' && ids.includes(x.sid)).length)}</td><td class="num">${N(db.subs.filter(x => x.status === 'ok' && ids.includes(x.sid)).length)}</td></tr>`; }).join('')}</tbody></table></div></section>
  <p class="tiny muted" style="text-align:center">${t('demoBanner')}</p></main>`;
  const sp = $('#sp'), drawSp = () => { const W = sp.clientWidth, H = sp.clientHeight, mx = Math.max(...act, 1), px = (k) => 8 + k * (W - 16) / 13, py = (v) => H - 14 - v / mx * (H - 30);
    const d = act.map((v, k) => `${k ? 'L' : 'M'}${px(k)},${py(v)}`).join('');
    sp.innerHTML = `<path d="${d} L${px(13)},${H - 14} L${px(0)},${H - 14}Z" fill="#F39A1E22"/><path d="${d}" fill="none" stroke="#F39A1E" stroke-width="3" stroke-linejoin="round"/>${act.map((v, k) => k === 13 ? `<circle cx="${px(k)}" cy="${py(v)}" r="5" fill="#1E6B3C"/><text x="${px(k) - 6}" y="${py(v) - 10}" font-size="13" font-weight="700" fill="#1E6B3C" text-anchor="end">${N(v)}</text>` : '').join('')}`; };
  new ResizeObserver(drawSp).observe(sp);
}

/* ---------------- owner / admin ---------------- */
let adminTab = 'students';
function viewAdmin() {
  root.className = 'app wide';
  const tabsA = [['students', 'users'], ['supervisors', 'shield'], ['stations', 'map'], ['ayat', 'book'], ['drive', 'drive'], ['audit', 'file']];
  root.innerHTML = `${topbar(`<a class="langbtn" href="#dash">${t('dash')}</a>`)}<main class="stack-lg"><section class="stack"><h1>${t('admin')}</h1><p class="muted small">${Q.lang === 'ar' ? 'هذه الصفحة لك وحدك. كل عرض لكلمة مرور يُسجَّل في السجلّ.' : 'Only you can see this page. Every password view is written to the audit log.'}</p></section>
  <div class="tabs">${tabsA.map(([k, ic]) => `<button data-at="${k}" class="${k === adminTab ? 'on' : ''}">${I(ic, 'width=15 style="vertical-align:-2px"')} ${t(k)}</button>`).join('')}</div><section id="ap"></section></main>`;
  $$('[data-at]').forEach(b => b.onclick = () => { adminTab = b.dataset.at; viewAdmin(); });
  const ap = $('#ap');
  if (adminTab === 'students') {
    ap.innerHTML = `<div class="card stack"><div class="row wrap"><input class="input grow" id="q" placeholder="${t('search')}" style="max-width:320px"><button class="btn ghost sm" data-csv>${I('copy', 'width=16')} CSV</button></div><div class="scroll"><table class="stack-m"><thead><tr><th>${Q.lang === 'ar' ? 'الطالب' : 'Student'}</th><th>${t('team')}</th><th>${Q.lang === 'ar' ? 'المشرف' : 'Supervisor'}</th><th>${t('user')}</th><th>${t('pass')}</th><th class="num">${t('journey')}</th></tr></thead><tbody id="tb"></tbody></table></div></div>`;
    const rows = (q = '') => $('#tb').innerHTML = db.students.filter(s => s.name.includes(q)).map(s => `<tr><td><b>${esc(s.name)}</b><br><span class="tiny muted">${esc(s.grade)}</span></td>
      <td><select data-f="team" data-id="${s.id}" style="min-height:38px;padding:6px 10px">${Q.TEAMS.map(tm => `<option value="${tm.id}" ${tm.id === s.team ? 'selected' : ''}>${esc(L(tm))}</option>`).join('')}</select></td>
      <td><select data-f="sup" data-id="${s.id}" style="min-height:38px;padding:6px 10px">${db.sups.map(sp => `<option value="${sp.id}" ${sp.id === s.sup ? 'selected' : ''}>${esc(sp.name)}</option>`).join('')}</select></td>
      <td><span class="mono">${esc(s.user)}</span></td><td><span class="row" style="gap:4px"><span class="mono" data-pw="${s.id}">••••••••</span><button class="iconbtn" style="width:34px;height:34px" data-eye="${s.id}" aria-label="${t('show')}">${I('eye')}</button><button class="iconbtn" style="width:34px;height:34px" data-rs="${s.id}" aria-label="${t('reset')}">${I('refresh')}</button></span></td>
      <td class="num">${N(db.subs.filter(x => x.sid === s.id && x.status === 'ok').length)}</td></tr>`).join('');
    rows(); $('#q').oninput = (e) => { rows(e.target.value); bind(); };
    const bind = () => {
      $$('[data-f]').forEach(sel => sel.onchange = () => { const s = db.students.find(x => x.id === sel.dataset.id); s[sel.dataset.f] = sel.value; log(`Changed ${sel.dataset.f} of ${s.name} → ${sel.value}`); toast('✓'); });
      $$('[data-eye]').forEach(b => b.onclick = () => { const s = db.students.find(x => x.id === b.dataset.eye), el = $(`[data-pw="${s.id}"]`), on = el.textContent.startsWith('•');
        el.textContent = on ? s.pass : '••••••••'; b.innerHTML = I(on ? 'eyeoff' : 'eye'); if (on) log(`Viewed password of ${s.name}`); });
      $$('[data-rs]').forEach(b => b.onclick = () => { const s = db.students.find(x => x.id === b.dataset.rs); s.pass = ['Rose', 'Palm', 'Nile', 'Star', 'Moon'][Math.random() * 5 | 0] + (1000 + Math.random() * 9000 | 0); log(`Reset password of ${s.name}`);
        sheet(`<div class="stack" style="text-align:center"><h3>${esc(s.name)}</h3><p>${t('newPass', { p: `<b class="mono" style="font-size:22px">${esc(s.pass)}</b>` })}</p><button class="btn block" data-cp>${t('copy')}</button><button class="btn ghost block" data-close>OK</button></div>`,
          sc => $('[data-cp]', sc).onclick = () => navigator.clipboard?.writeText(s.pass).then(() => toast(t('copied'))).catch(() => {})); rows($('#q').value); bind(); });
    }; bind();
    $('[data-csv]').onclick = () => { const csv = ['name,grade,team,supervisor,username,password', ...db.students.map(s => [s.name, s.grade, L(team(s.team)), db.sups.find(x => x.id === s.sup).name, s.user, s.pass].join(','))].join('\n');
      navigator.clipboard?.writeText(csv).then(() => toast(t('copied'))).catch(() => {}); log('Copied roster CSV'); };
  } else if (adminTab === 'supervisors') {
    ap.innerHTML = `<div class="card scroll"><table class="stack-m"><thead><tr><th>${Q.lang === 'ar' ? 'المشرف' : 'Supervisor'}</th><th>${t('user')}</th><th>${t('pass')}</th><th class="num">${t('students')}</th></tr></thead><tbody>${db.sups.map(sp => `<tr><td><b>${esc(sp.name)}</b><br><span class="tiny muted mono">${esc(sp.email)}</span></td><td class="mono">${esc(sp.email.split('@')[0])}</td><td class="mono">${esc(sp.pass)}</td><td class="num">${N(db.students.filter(s => s.sup === sp.id).length)}</td></tr>`).join('')}</tbody></table></div>`;
  } else if (adminTab === 'stations') {
    ap.innerHTML = `<div class="card scroll"><table class="stack-m"><thead><tr><th>#</th><th>${t('stations')}</th><th>${Q.lang === 'ar' ? 'المسار' : 'Track'}</th><th>${Q.lang === 'ar' ? 'موعد التسليم' : 'Due date'}</th><th>${Q.lang === 'ar' ? 'فتح يدوي' : 'Force open'}</th></tr></thead><tbody>${Q.STATIONS.map(s => `<tr><td>${N(s.n)}</td><td><b>${esc(L(s))}</b></td><td>${s.track === 'shared' ? `<span class="chip gray">${t('shared')}</span>` : `<span class="chip" style="background:${team(s.track).color}22;color:${team(s.track).color}">${esc(L(team(s.track)))}</span>`}</td>
      <td><input type="date" class="input" style="min-height:38px;padding:6px 10px;max-width:170px" data-due="${s.id}" value="${db.stations[s.id].due || ''}"></td><td><button class="toggle ${db.stations[s.id].open ? 'on' : ''}" data-op="${s.id}" aria-label="open"></button></td></tr>`).join('')}</tbody></table></div>`;
    $$('[data-due]').forEach(i => i.onchange = () => { db.stations[i.dataset.due].due = i.value; log(`Due date ${i.dataset.due} → ${i.value}`); });
    $$('[data-op]').forEach(b => b.onclick = () => { const c = db.stations[b.dataset.op]; c.open = c.open ? null : true; b.classList.toggle('on'); log(`${c.open ? 'Opened' : 'Reset'} ${b.dataset.op}`); });
  } else if (adminTab === 'ayat') {
    ap.innerHTML = `<div class="grid g2 m1">${[['shared', t('shared')], ...Q.TEAMS.map(tm => [tm.id, L(tm)])].map(([k, nm]) => `<div class="card stack"><h3>${esc(nm)}</h3><div class="row wrap">${db.ayat[k].map(a => `<span class="chip">${a} <button data-rm="${k}|${a}" aria-label="remove">${I('x', 'width=13')}</button></span>`).join('')}</div>
      <div class="row"><input class="input" placeholder="${t('addAyah')}" data-in="${k}" inputmode="numeric" style="direction:ltr"><button class="btn sm" data-ad="${k}">${t('add')}</button></div></div>`).join('')}</div>
      <p class="small muted" style="margin-top:12px">${Q.lang === 'ar' ? 'الصوت بصوت الحصري يُضاف تلقائيًا لأي آية. مثال: 3:134 تعني آل عمران آية ١٣٤.' : 'Al-Husary audio is attached automatically to any verse. Example: 3:134 = Al-Imran verse 134.'}</p>`;
    $$('[data-rm]').forEach(b => b.onclick = () => { const [k, a] = b.dataset.rm.split('|'); db.ayat[k] = db.ayat[k].filter(x => x !== a); log(`Removed ${a} from ${k}`); viewAdmin(); });
    $$('[data-ad]').forEach(b => b.onclick = () => { const k = b.dataset.ad, v = $(`[data-in="${k}"]`).value.trim(); if (!/^\d{1,3}:\d{1,3}$/.test(v)) return toast('3:134'); db.ayat[k] = [...new Set([...db.ayat[k], v])]; log(`Added ${v} to ${k}`); viewAdmin(); });
  } else if (adminTab === 'drive') {
    const cfg = window.QCONFIG || {};
    ap.innerHTML = `<div class="grid g2 m1"><div class="card stack"><h3>${Q.lang === 'ar' ? 'الربط بدرايف المدرسة' : 'School Drive connection'}</h3>
      <p class="small">${cfg.DRIVE_WEBAPP_URL ? `<span class="chip">${I('check', 'width=13')} ${Q.lang === 'ar' ? 'متصل' : 'Connected'}</span>` : `<span class="chip o">${Q.lang === 'ar' ? 'غير متصل بعد — وضع العرض' : 'Not connected yet — demo mode'}</span>`}</p>
      <p class="small muted">${Q.lang === 'ar' ? 'كل ملف يرفعه الطالب يذهب تلقائيًا إلى مجلد: الفريق ← الطالب ← المحطة، داخل درايف حساب المدرسة الخاص بك فقط.' : "Every student upload is filed automatically as Team → Student → Station, inside your school account's Drive only."}</p>
      ${cfg.DRIVE_ROOT_URL ? `<a class="btn" href="${esc(cfg.DRIVE_ROOT_URL)}" target="_blank" rel="noopener">${I('drive')} ${Q.lang === 'ar' ? 'افتح المجلد' : 'Open folder'}</a>` : ''}</div>
      <div class="card"><h3>${Q.lang === 'ar' ? 'شكل المجلدات' : 'Folder structure'}</h3><pre class="small" style="line-height:1.9;white-space:pre-wrap">Qualities/\n${Q.TEAMS.map(tm => `├─ ${L(tm)}/\n${db.students.filter(s => s.team === tm.id).slice(0, 2).map(s => `│  ├─ ${s.name}/\n│  │  ├─ ${Q.lang === 'ar' ? 'المحطة' : 'Station'} 1/\n│  │  └─ Quran/`).join('\n')}\n│  └─ …`).join('\n')}</pre></div></div>`;
  } else {
    ap.innerHTML = `<div class="card scroll"><table><thead><tr><th>${Q.lang === 'ar' ? 'الوقت' : 'Time'}</th><th>${Q.lang === 'ar' ? 'من' : 'Who'}</th><th>${Q.lang === 'ar' ? 'ماذا' : 'What'}</th></tr></thead><tbody>${db.audit.slice(0, 80).map(a => `<tr><td class="mono tiny">${esc(a.at)}</td><td class="small">${esc(a.who)}</td><td class="small">${esc(a.what)}</td></tr>`).join('')}</tbody></table></div>
    <button class="btn ghost sm" style="margin-top:12px" data-wipe>${Q.lang === 'ar' ? 'إعادة بيانات العرض' : 'Reset demo data'}</button>`;
    $('[data-wipe]').onclick = () => { db = seed(); save(); toast('✓'); viewAdmin(); };
  }
}

/* ---------------- help & install ---------------- */
function howTo() {
  const faq = Q.lang === 'ar' ? [['كيف أدخل؟', 'اكتب اسم المستخدم وكلمة المرور اللذين أعطاك إياهما مشرفك، ثم غيّر كلمة المرور من ملفك.'], ['كيف أحل محطة؟', 'من «رحلتي» اضغط المحطة المفتوحة. كل خطوة في صفحة، وكل ما تكتبه يُحفظ تلقائيًا. في النهاية اضغط «سلّم للمشرف».'],
    ['كيف أحفظ الآيات؟', 'من «القرآن»: استمع للحصري وكرّر الآية بالسرعة التي تناسبك، ثم «احفظ» لإخفاء الكلمات تدريجيًا، ثم «سمّع» ليصحّح لك التطبيق.'], ['أين تذهب ملفاتي؟', 'كل ملف ترفعه يُحفظ في مجلدك على درايف المدرسة، مرتّبًا حسب المحطة.'], ['نسيت كلمة المرور', 'كلّم مشرفك أو مسؤول المشروع، ويعيد ضبطها في ثوانٍ.']]
    : [['How do I sign in?', 'Use the username and password from your supervisor.'], ['How do I do a station?', 'Open Journey and tap the open station. One step per screen, everything saves automatically. Submit at the end.'],
    ['How do I memorize verses?', 'In Quran: listen to Al-Husary at your own speed and repeat, then Memorize to hide words step by step, then Recite to get checked.'], ['Where do my files go?', 'Into your folder on the school Drive, sorted by station.'], ['I forgot my password', 'Ask your supervisor or the project lead — instant reset.']];
  sheet(`<div class="stack"><h2>${t('howTo')}</h2>${faq.map(([q, a]) => `<details class="card flat"><summary>${q}</summary><p class="small muted">${a}</p></details>`).join('')}<button class="btn o block" data-ins>${I('phone')} ${t('install')}</button></div>`, s => $('[data-ins]', s).onclick = () => { s.remove(); install(); });
}
let deferredPrompt = null; addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
function install() {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; return; }
  const ar = Q.lang === 'ar';
  sheet(`<div class="stack"><h2>${t('install')}</h2><p class="small muted">${ar ? 'يعمل كتطبيق حقيقي بملء الشاشة، بدون متجر تطبيقات.' : 'Works like a real full-screen app — no app store needed.'}</p>
  <h3>iPhone (Safari)</h3><ol class="steps-ios"><li>${ar ? 'افتح الرابط في Safari' : 'Open the link in Safari'}</li><li>${ar ? 'اضغط زر المشاركة' : 'Tap the Share button'} <span class="ios-share">${I('share', 'width=16')}</span></li><li>${ar ? 'مرّر لأسفل واختر «إضافة إلى الشاشة الرئيسية»' : 'Scroll and choose “Add to Home Screen”'}</li><li>${ar ? 'اضغط «إضافة» — ستجد أيقونة Qualities بجانب تطبيقاتك' : 'Tap “Add” — the Qualities icon appears next to your apps'}</li></ol>
  <h3>Android (Chrome)</h3><ol class="steps-ios"><li>${ar ? 'اضغط القائمة ⋮ أعلى الشاشة' : 'Tap the ⋮ menu'}</li><li>${ar ? 'اختر «تثبيت التطبيق»' : 'Choose “Install app”'}</li></ol><button class="btn block" data-close>OK</button></div>`);
}

/* ---------------- router ---------------- */
function go(h) { location.hash = h; }
function render() {
  document.documentElement.style.setProperty('--flip', Q.lang === 'ar' ? -1 : 1);
  const h = location.hash.slice(1) || '';
  if (!session || !me()) return viewLogin();
  root.className = 'app'; player && !h.startsWith('quran') && player.pause();
  const r = session.role;
  if (r === 'student') {
    if (h.startsWith('station-')) viewStation(h.slice(8));
    else if (h.startsWith('quran')) viewQuran(h.length > 6 ? h.slice(6).replace('-', ':') : null);
    else ({ journey: viewJourney, portfolio: viewPortfolio, team: viewTeam }[h] || viewHome)();
  } else if (r === 'sup') viewReview(h.startsWith('review-') ? h.slice(7) : null);
  else if (r === 'principal') viewDash();
  else (h === 'dash' ? viewDash : viewAdmin)();
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-lang]')) setLang(Q.lang === 'ar' ? 'en' : 'ar');
  if (e.target.closest('[data-logout]')) { session = null; try { localStorage.removeItem('q_session'); sessionStorage.removeItem('q_session'); } catch {} location.hash = ''; render(); }
  if (e.target.closest('[data-howto]')) howTo();
  if (e.target.closest('[data-install]')) install();
});
addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
try { const l = localStorage.getItem('q_lang'); if (l) Q.lang = l; } catch {}
document.documentElement.lang = Q.lang; document.documentElement.dir = Q.lang === 'ar' ? 'rtl' : 'ltr';
render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
