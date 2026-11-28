/* Qualities — app shell, router and all role portals.
   Demo mode keeps data in this browser (localStorage). js/api.js bridges to Drive / Supabase when configured. */
{
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = Q.t, L = Q.L, I = Q.icon, N = Q.num, AR = () => Q.lang === 'ar';
const tx = (ar, en) => AR() ? ar : en;
const pct = (n) => N(n) + (AR() ? '٪' : '%');
const root = $('#app');
Object.assign(Q.STR, {
  asLead: ['مشرف المشرفين', 'Lead supervisor'], grades: ['الدرجات', 'Grades'], gradeOf: ['الدرجة', 'Grade'], total: ['المجموع', 'Total'],
  honor: ['لوحة الشرف', 'Honor board'], topGrades: ['الأعلى درجات', 'Top grades'], topReaders: ['القرّاء', 'Top reciters'],
  listened: ['استماع', 'listens'], recited: ['تسميع', 'recitations'], overview: ['نظرة عامة', 'Overview']
});

/* ---------------- store ---------------- */
const KEY = 'q_db_v4';
function seed() {
  const db = { students: structuredClone(Q.STUDENTS), sups: structuredClone(Q.SUPERVISORS), subs: [], files: [], moods: [], audit: [], drafts: {},
    content: structuredClone(Q.STATIONS).map(s => ({ ...s, points: 10, forceOpen: false })),
    ayat: { shared: ['2:195', '3:76'], experts: ['2:195', '3:134'], ambassadors: ['2:195', '16:128'], action: ['2:195', '3:133-134'] },
    listens: {}, recites: {}, reps: {}, recs: [] };
  const missions = ['أن أكون سببًا في ابتسامة كل من أقابله، وأن أُتقن كل عمل أبدؤه.', 'أن أستخدم موهبتي في الرسم لأنشر الخير وأُسعد الأطفال في المستشفيات.',
    'أن أكون عادلًا مع إخوتي وأصدقائي، وأن أساعد من لا يجد من يساعده.', 'أن أتعلم كثيرًا لأعلّم غيري، فالعلم صدقة لا تنقطع.'];
  db.students.forEach((s, i) => {
    if (s.done.includes('s1')) db.subs.push({ id: 'sub' + i, sid: s.id, st: 's1', status: 'ok', at: '2026-11-2' + (i % 4 + 1), answers: { mission: missions[i % 4], scale: s.happyBefore },
      quiz: { ok: 2 + (i % 2), total: 3 }, grade: 7 + (i % 4), rubric: { honesty: 3 + (i % 2), understanding: 3, life: 3 + (i % 2), craft: 3 }, comment: 'ما شاء الله، رسالتك صادقة وواضحة. حاول أن تربطها بعمل يومي صغير.' });
    db.listens[s.id] = { '2:195': (i * 7) % 23 + 2 }; db.recites[s.id] = { '2:195': i % 6 };
  });
  [[2, 'أن أنشر التفاؤل في فصلي، وأكون أول من يشجّع زملائي.'], [10, 'أن أكون صادقًا في كل كلمة، وأن أبتسم في وجه كل من أقابله.'], [5, 'أن أُحسن إلى والديّ وأساعد في البيت دون أن يُطلب مني.'], [8, 'أن أُتقن دراستي وأساعد زملائي في الرياضيات.']].forEach(([i, m]) =>
    db.subs.push({ id: 'subp' + i, sid: db.students[i].id, st: 's1', status: 'sub', at: '2026-11-27', quiz: { ok: 2, total: 3 }, answers: { mission: m, scale: db.students[i].happyBefore, q6: 'أنسى الوقت عندما ألعب كرة القدم مع أصدقائي.', pillars: ['O', 'A'] } }));
  db.subs = db.subs.filter(x => x.sid !== 'st1'); db.students[0].done = [];
  db.files.push({ id: 'f1', sid: 'st1', st: 's1', name: 'جدار-الامتنان.jpg', type: 'image/jpeg', size: 482000, at: '2026-11-24' });
  for (let d = 13; d >= 0; d--) db.moods.push(...db.students.slice(0, 12 + (d % 5)).map((s, k) => ({ sid: s.id, d, v: 3 + ((k + d) % 3) })));
  db.audit.push({ at: '2026-11-25 09:02', who: 'admin', what: 'Imported roster: 20 students, 5 supervisors (sample)' });
  return db;
}
let db; try { db = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { db = seed(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} Q.api?.push?.(db); };
const log = (what) => { db.audit.unshift({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), who: me()?.name || '—', what }); save(); };

let session; try { session = JSON.parse(localStorage.getItem('q_session') || sessionStorage.getItem('q_session')); } catch {}
const me = () => !session ? null : session.role === 'student' ? db.students.find(s => s.id === session.id) : session.role === 'sup' ? db.sups.find(s => s.id === session.id)
  : session.role === 'lead' ? Q.LEAD : session.role === 'principal' ? Q.PRINCIPAL : Q.OWNER;
const ST = () => db.content;
const team = (id) => Q.TEAMS.find(x => x.id === id);
const station = (id) => ST().find(s => s.id === id);
const virtue = (id) => Q.VIRTUES.find(v => v.id === id);
const subOf = (sid, st) => db.subs.find(x => x.sid === sid && x.st === st);
const sharedSt = () => ST().filter(s => s.track === 'shared');
const trackSt = (tid) => ST().filter(s => s.track === tid);
const myStations = (stu) => [...sharedSt(), ...trackSt(stu.team)];
const daysTo = (iso) => Math.floor((new Date(iso + 'T23:59:00') - Q.TODAY) / 864e5);
const initials = (n) => n.replace(/^أ\/\s*/, '').trim()[0];
const gradeSum = (sid) => db.subs.filter(x => x.sid === sid && x.status === 'ok').reduce((a, x) => a + (x.grade || 0), 0);
const gradeMax = (stu) => db.subs.filter(x => x.sid === stu.id && x.status === 'ok').reduce((a, x) => a + (station(x.st)?.points || 10), 0);
const listensOf = (sid) => Object.values(db.listens[sid] || {}).reduce((a, b) => a + b, 0);
const recitesOf = (sid) => Object.values(db.recites[sid] || {}).reduce((a, b) => a + b, 0);
const stuOfViewer = () => session.role === 'sup' ? db.students.filter(s => s.sup === session.id) : db.students;

function status(stu, s) {
  const sub = subOf(stu.id, s.id); if (sub) return sub.status;
  if (s.forceOpen) return db.drafts[stu.id]?.[s.id] ? 'draft' : 'open';
  const list = s.track === 'shared' ? sharedSt() : trackSt(s.track);
  const prev = list[list.indexOf(s) - 1] || (s.track !== 'shared' ? sharedSt().at(-1) : null);
  const prevOk = !prev || subOf(stu.id, prev.id)?.status === 'ok';
  if (!prevOk || (s.opens && new Date(s.opens) > Q.TODAY)) return 'locked';
  return db.drafts[stu.id]?.[s.id] ? 'draft' : 'open';
}
const stChip = (st) => ({ locked: `<span class="chip gray">${I('lock')} ${t('st_locked')}</span>`, open: `<span class="chip o">${t('st_open')}</span>`,
  draft: `<span class="chip o">${t('st_draft')}</span>`, sub: `<span class="chip blue">${t('st_sub')}</span>`, ok: `<span class="chip">${I('check')} ${t('st_ok')}</span>`,
  back: `<span class="chip red">${t('st_back')}</span>` }[st]);

/* ---------------- ui helpers ---------------- */
function toast(msg) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.append(d); setTimeout(() => d.remove(), 2800); }
function sheet(html, onMount, wide) {
  const s = document.createElement('div'); s.className = 'scrim'; s.innerHTML = `<div class="sheet ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  s.addEventListener('click', e => { if (e.target === s || e.target.closest('[data-close]')) s.remove(); });
  document.body.append(s); onMount && onMount(s); return s;
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.append(c);
  const x = c.getContext('2d'), cols = ['#F39523', '#18873B', '#2B7BB9', '#D2453B', '#ffd27a'];
  const ps = Array.from({ length: 120 }, () => ({ x: innerWidth / 2, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: Math.random() * -14 - 4, r: Math.random() * 6 + 4, c: cols[Math.random() * 5 | 0], a: Math.random() * 6 }));
  let f = 0; (function loop() { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; p.a += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (++f < 110) requestAnimationFrame(loop); else c.remove(); })();
}
function setLang(l) { Q.lang = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'; try { localStorage.setItem('q_lang', l); } catch {} render(); }
const chev = (w = 16) => I('chev', `width=${w} style="transform:scaleX(var(--flip,1))"`);
const backI = (w = 16) => I('back', `width=${w} style="transform:scaleX(var(--flip,1))"`);
const topbar = (extra = '') => `<header class="top"><img class="seal" src="icons/gpis-logo.png" alt="GPIS"><div class="grow"><div class="t1">${t('appName')}</div><div class="t2">${t('appSub')}</div></div>
  ${extra}<button class="langbtn" data-lang>${t('lang')}</button><button class="iconbtn" data-logout aria-label="${t('logout')}">${I('logout')}</button></header>`;
const tabsBar = (list, on, attr) => `<div class="tabs">${list.map(([k, label, ic]) => `<button data-${attr}="${k}" class="${k === on ? 'on' : ''}">${ic ? I(ic) + ' ' : ''}${label}</button>`).join('')}</div>`;

/* ---------------- login ---------------- */
const DEMO = [['student', 'asStudent'], ['sup', 'asSup'], ['lead', 'asLead'], ['principal', 'asPrin'], ['owner', 'asAdmin']];
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
    <div class="seg">${DEMO.map(([r, k]) => `<button type="button" data-demo="${r}">${t(k)}</button>`).join('')}</div>
    <div class="row between small" style="margin-top:6px"><button type="button" class="muted row" data-howto>${I('help', 'width=16')} ${t('howTo')}</button><button type="button" class="muted row" data-install>${I('phone', 'width=16')} ${t('install')}</button></div>
  </form></div>`;
  $('#lf').onsubmit = (e) => { e.preventDefault(); const f = new FormData(e.target), u = f.get('u').trim().toLowerCase(), p = f.get('p');
    const st = db.students.find(x => x.user === u && x.pass === p), sp = db.sups.find(x => x.email.split('@')[0] === u && x.pass === p);
    const s = st ? { role: 'student', id: st.id } : sp ? { role: 'sup', id: sp.id } : u === Q.LEAD.user && p === Q.LEAD.pass ? { role: 'lead' }
      : u === Q.PRINCIPAL.user && p === Q.PRINCIPAL.pass ? { role: 'principal' } : u === Q.OWNER.user && p === Q.OWNER.pass ? { role: 'owner' } : null;
    if (!s) { $('#lerr').hidden = false; return; } login(s, f.get('k')); };
  $('[data-trouble]').onclick = () => toast(t('troubleMsg'));
  $$('[data-demo]').forEach(b => b.onclick = () => login({ role: b.dataset.demo, id: b.dataset.demo === 'student' ? 'st1' : b.dataset.demo === 'sup' ? 'sup1' : undefined }, true));
}
function login(s, keep) { session = s; try { (keep ? localStorage : sessionStorage).setItem('q_session', JSON.stringify(s)); } catch {}
  location.hash = { student: 'home', sup: 'review', lead: 'review', principal: 'dash', owner: 'admin' }[s.role]; render(); }

/* ---------------- student ---------------- */
const tabs = [['home', 'home'], ['journey', 'map'], ['quran', 'book'], ['portfolio', 'folder'], ['team', 'users']];
const tabbar = (on) => `<nav class="tabbar" aria-label="main"><div class="in"><div class="brand"><img src="icons/icon-192.png" alt=""><b>${t('appName')}</b></div>${tabs.map(([k, ic]) => `<a class="tab ${on === k ? 'on' : ''}" href="#${k}">${I(ic)}<span>${t(k)}</span>${on === k ? '<i class="dot"></i>' : ''}</a>`).join('')}</div></nav>`;
const stuShell = (inner, on) => { root.className = 'app stu'; root.innerHTML = `${topbar()}${inner}${tabbar(on)}`; };
function currentStation(stu) { return myStations(stu).find(s => ['open', 'draft', 'back'].includes(status(stu, s))); }

function viewHome() {
  const stu = me(), cur = currentStation(stu), doneN = db.subs.filter(x => x.sid === stu.id && x.status === 'ok').length, total = myStations(stu).length;
  const tm = team(stu.team), todayMood = db.moods.find(m => m.sid === stu.id && m.d === 0 && m.mine), pc = Math.round(doneN / total * 100), first = stu.name.split(' ')[0];
  const gs = gradeSum(stu.id), gm = gradeMax(stu);
  stuShell(`<main class="stack-lg dgrid">
  <section class="card hero stack span2">
    <div class="row between"><div><p class="muted small">${t('hello')} ${esc(first)}</p><h1>${tx('كل يوم أحسن من اللي فات', 'Better than yesterday, every day')}</h1></div>
      <div class="ring" style="--p:${pc}"><b>${N(doneN)}/${N(total)}</b></div></div>
    <div class="row wrap"><span class="chip o">${I('flame')} ${N(stu.streak)} ${t('streak')}</span><span class="chip glass">${esc(L(tm))}</span>
      <span class="chip glass">${I('heart')} ${esc(AR() ? virtue(stu.virtue).ar : virtue(stu.virtue).en)}</span>${gm ? `<span class="chip glass">${I('star')} ${t('grades')}: ${N(gs)}/${N(gm)}</span>` : ''}</div>
    ${cur ? `<a href="#station-${cur.id}" class="card nextcard">
      <span class="badge" style="background:var(--o3);color:var(--o2)">${I(cur.icon)}</span><span class="grow"><span class="tiny muted">${t('next')}</span><b style="display:block">${esc(L(cur))}</b>
      ${cur.due ? `<span class="tiny" style="color:var(--o2);font-weight:700">${t('daysLeft', { n: N(Math.max(0, daysTo(cur.due))) })}</span>` : ''}</span><span class="btn o sm">${t(db.drafts[stu.id]?.[cur.id] ? 'continue' : 'start')}</span></a>` : ''}
  </section>
  <section class="card stack"><h3>${t('mood')}</h3><div class="moods">${['😔', '😐', '🙂', '😊', '🤩'].map((e, i) => `<button class="${todayMood?.v === i + 1 ? 'on' : ''}" data-mood="${i + 1}" aria-label="${i + 1}">${e}</button>`).join('')}</div></section>
  <section class="card stack"><div class="row between"><div><h3>${t('daily3')}</h3><p class="small muted">${t('daily3Sub')}</p></div><span class="badge">${I('sparkle')}</span></div><button class="btn ghost block" data-recall>${t('start')}</button></section>
  <section class="stack span2"><div class="row between"><h2>${t('pillars')}</h2><span class="tiny muted">${t('tapFlip')}</span></div>
    <div class="flips">${Q.OMAR.map(o => `<button class="flip" style="--c:${o.c}"><div class="in"><div class="f"><b>${o.k}</b><span>${esc(L(o))}</span></div><div class="b">${esc(L(o, 'd'))}</div></div></button>`).join('')}</div></section>
  <section class="card stack span2"><div class="row between"><h3>${esc(L(tm))}</h3><a class="small link" href="#team">${t('team')} ${chev(14)}</a></div><p class="small muted">${esc(L(tm, 'mission'))}</p></section>
  <div class="span2"><div class="gpis"><img src="icons/gpis-logo.png" alt=""> Green Land – Pré Vert International Schools</div>
  <p class="tiny muted" style="text-align:center">${tx('رسالة المدرسة: أن نساهم في جعل العالم مكانًا أسعد من خلال إحسان الأقوال والأفعال.', 'Our mission: to make the world a happier place through excellence in words and deeds.')}</p></div>
  </main>`, 'home');
  $$('.flip').forEach(f => f.onclick = () => f.classList.toggle('on'));
  $$('[data-mood]').forEach(b => b.onclick = () => { db.moods = db.moods.filter(m => !(m.sid === stu.id && m.d === 0)); db.moods.push({ sid: stu.id, d: 0, v: +b.dataset.mood, mine: true }); save(); toast(t('moodSaved')); viewHome(); });
  $('[data-recall]').onclick = recall;
}
function recall() {
  const pool = ST().flatMap(s => s.steps.filter(x => x.t === 'quiz' && x.opts?.length)).sort(() => Math.random() - .5).slice(0, 3); let i = 0, score = 0;
  const s = sheet(`<div id="rc"></div>`);
  const draw = () => { const q = pool[i], box = $('#rc', s);
    if (!q) { box.innerHTML = `<div class="stack" style="text-align:center"><h2>${N(score)} / ${N(pool.length)}</h2><p class="muted">${tx('سنعيد عليك ما نسيته بعد يومين — هكذا يثبت الحفظ.', "We'll bring back what you missed in 2 days — that's how memory sticks.")}</p><button class="btn block" data-close>${tx('تم', 'Done')}</button></div>`; if (score === pool.length) confetti(); return; }
    box.innerHTML = `<p class="tiny muted">${t('stepOf', { a: N(i + 1), b: N(pool.length) })}</p><h3 style="margin:6px 0 14px">${esc(L(q))}</h3>${q.opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(AR() ? o[0] : o[1] || o[0])}</button>`).join('')}<div id="ex"></div>`;
    $$('.opt', box).forEach(b => b.onclick = () => { if (box.dataset.done) return; box.dataset.done = 1; const k = +b.dataset.k, ok = k === q.ok; if (ok) score++;
      b.classList.add(ok ? 'ok' : 'no'); $$('.opt', box)[q.ok].classList.add('ok');
      $('#ex', box).innerHTML = `<div class="explain stack"><b>${ok ? t('correct') : t('notQuite')}</b><p>${esc(L(q, 'why'))}</p><button class="btn block" data-n>${t('nextBtn')}</button></div>`;
      $('[data-n]', box).onclick = () => { i++; delete box.dataset.done; draw(); }; }); };
  draw();
}

function viewJourney() {
  const stu = me(), tm = team(stu.team);
  const road = (list) => `<div class="road">${list.map(s => { const st = status(stu, s), cur = ['open', 'draft', 'back'].includes(st), sb = subOf(stu.id, s.id);
    return `<div class="stop ${st === 'ok' ? 'ok' : ''} ${cur ? 'now' : ''} ${st === 'locked' ? 'locked' : ''}"><span class="pin">${st === 'ok' ? I('check', 'width=15') : N(s.n)}</span>
    <button class="card" data-st="${s.id}"><span class="badge">${I(s.icon)}</span><span class="grow"><b style="display:block;line-height:1.35">${esc(L(s))}</b>
    <span class="row wrap" style="gap:6px;margin-top:5px">${stChip(st)}${sb?.status === 'ok' && sb.grade != null ? `<span class="chip o">${I('star')} ${N(sb.grade)}/${N(s.points || 10)}</span>` : ''}${s.due ? `<span class="tiny muted">${st === 'locked' && s.opens ? t('opensOn', { d: Q.date(s.opens) }) : t('dueOn', { d: Q.date(s.due) })}</span>` : ''}</span></span></button></div>`; }).join('')}</div>`;
  const done = db.subs.filter(x => x.sid === stu.id && x.status === 'ok').length, total = myStations(stu).length;
  stuShell(`<main class="stack-lg dgrid"><section class="card stack span2"><div class="row between"><h2>${t('journey')}</h2><b>${N(done)}/${N(total)}</b></div><div class="bar"><i style="width:${done / total * 100}%"></i></div></section>
  <section class="stack"><h3>${t('shared')}</h3>${road(sharedSt())}</section>
  <section class="stack"><h3>${t('teamTrack')}: <span style="color:${tm.color}">${esc(L(tm))}</span></h3>${road(trackSt(stu.team))}</section></main>`, 'journey');
  $$('[data-st]').forEach(b => b.onclick = () => { const s = station(b.dataset.st), st = status(stu, s);
    if (st === 'locked') return sheet(`<div class="stack" style="text-align:center"><span class="badge" style="margin:auto">${I('lock')}</span><h3>${esc(L(s))}</h3><p class="muted">${s.opens && new Date(s.opens) > Q.TODAY ? t('opensOn', { d: Q.date(s.opens) }) : tx('تُفتح بعد اعتماد المحطة السابقة.', 'Opens after the previous station is approved.')}</p><button class="btn block" data-close>OK</button></div>`);
    location.hash = 'station-' + s.id; });
}

/* ---------- station player ---------- */
function reviewSteps(stu, s) { // spaced retrieval: 2 questions from earlier approved stations
  const list = myStations(stu), before = list.slice(0, list.indexOf(s)).filter(x => subOf(stu.id, x.id)?.status === 'ok');
  return before.flatMap(x => x.steps.filter(q => q.t === 'quiz' && q.opts?.length)).slice(-2).map(q => ({ ...q, review: true }));
}
function viewStation(id) {
  const stu = me(), s = station(id); if (!s) return go('journey');
  const st = status(stu, s), sub = subOf(stu.id, s.id), readOnly = st === 'ok' || st === 'sub';
  const steps = [{ t: 'goals' }, ...s.steps, ...reviewSteps(stu, s)];
  db.drafts[stu.id] ||= {}; const ans = db.drafts[stu.id][s.id] ||= (sub ? structuredClone(sub.answers) : {});
  let i = readOnly ? steps.length : Math.min(ans._i || 0, steps.length - 1);
  const draw = () => {
    if (i >= steps.length) return summary();
    const step = steps[i]; ans._i = i; save();
    root.className = 'app stu player'; root.innerHTML = `<main class="stack"><div class="row between"><button class="iconbtn" data-x aria-label="${t('back')}">${I('x')}</button><span class="tiny muted">${t('stepOf', { a: N(i + 1), b: N(steps.length) })}</span><span class="chip o">${I(s.icon)} ${N(s.n)}</span></div>
    <div class="stepbar">${steps.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</div>
    <p class="tiny" style="color:var(--o2);font-weight:700">${step.review ? tx('مراجعة سريعة مما سبق', 'Quick review of earlier stations') : esc(L(s))}</p><div id="sb" class="stack"></div></main>
    <div class="sticky-actions"><div class="in"><button class="btn ghost" data-prev ${i ? '' : 'disabled'}>${t('back')}</button><button class="btn grow" data-next>${i === steps.length - 1 ? t('submit') : t('nextBtn')}</button></div></div>`;
    renderStep(step, $('#sb'), ans, stu, s, 'q' + (i - 1));
    $('[data-x]').onclick = () => go('journey');
    $('[data-prev]').onclick = () => { i--; draw(); scrollTo(0, 0); };
    $('[data-next]').onclick = () => {
      const k = 'q' + (i - 1);
      if (step.t === 'quiz' && ans[k] == null) return toast(tx('اختر إجابة أولًا', 'Pick an answer first'));
      if (step.t === 'text') { const n = (ans[k] || '').trim().split(/\s+/).filter(Boolean).length;
        if (step.minWords && n < step.minWords) return toast(tx(`اكتب ${N(step.minWords)} كلمات على الأقل (كتبت ${N(n)})`, `Write at least ${step.minWords} words (you wrote ${n})`));
        if (step.maxWords && n > step.maxWords) return toast(tx(`الحد الأقصى ${N(step.maxWords)} كلمة`, `Maximum ${step.maxWords} words`)); }
      i++; if (i === steps.length) submit(); else { draw(); scrollTo(0, 0); } };
  };
  const submit = () => { const a = structuredClone(ans); delete a._i;
    const qs = s.steps.map((x, k) => [x, k]).filter(([x]) => x.t === 'quiz' && x.opts?.length);
    const quiz = { ok: qs.filter(([x, k]) => a['q' + k] === x.ok).length, total: qs.length };
    db.subs = db.subs.filter(x => !(x.sid === stu.id && x.st === s.id)); db.subs.push({ id: 'sub' + Date.now(), sid: stu.id, st: s.id, status: 'sub', at: new Date().toISOString().slice(0, 10), answers: a, quiz });
    stu.streak++; save(); confetti(); toast(t('submitted')); summary(); };
  const summary = () => { const sb = subOf(stu.id, s.id);
    stuShell(`<main class="stack-lg narrow"><button class="row small link" data-back>${backI()} ${t('journey')}</button>
    <section class="card hero stack"><span class="chip o" style="align-self:flex-start">${tx('المحطة', 'Station')} ${N(s.n)}</span><h1>${esc(L(s))}</h1><div class="row wrap">${stChip(sb?.status || st)}${sb?.status === 'ok' && sb.grade != null ? `<span class="chip o">${I('star')} ${t('gradeOf')}: ${N(sb.grade)}/${N(s.points || 10)}</span>` : ''}</div></section>
    ${sb?.quiz?.total ? `<section class="card row between"><b>${tx('أسئلة الفهم', 'Quiz')}</b><span class="chip">${N(sb.quiz.ok)}/${N(sb.quiz.total)}</span></section>` : ''}
    ${sb?.status === 'ok' || sb?.status === 'back' ? `<section class="card stack"><h3>${t('feedback')}</h3>${Q.RUBRIC.map(r => `<div class="hbar"><span class="small">${esc(L(r))}</span><div class="bar"><i style="width:${(sb.rubric?.[r.id] || 0) * 25}%"></i></div><b class="small">${N(sb.rubric?.[r.id] || 0)}/${N(4)}</b></div>`).join('')}
      <div class="paper">${esc(sb.comment || '')}</div></section>` : ''}
    ${sb?.answers?.mission ? `<section class="card stack"><h3>${tx('رسالتي في الحياة', 'My life mission')}</h3><div class="paper" style="font-size:18px">${esc(sb.answers.mission)}</div></section>` : ''}
    ${sb?.status === 'back' ? `<button class="btn o block" data-edit>${tx('عدّل وأعد التسليم', 'Edit & resubmit')}</button>` : ''}</main>`, 'journey');
    $('[data-back]').onclick = () => go('journey');
    $('[data-edit]') && ($('[data-edit]').onclick = () => { db.subs = db.subs.filter(x => x !== sb); i = 1; save(); draw(); });
  };
  draw();
}
const ytId = (u) => (String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
function renderStep(step, box, ans, stu, s, k) {
  const upd = () => save(), head = (txt) => `<h2 style="margin:4px 0 6px">${esc(txt)}</h2>`, opt = (o) => AR() ? o[0] : (o[1] || o[0]);
  const again = () => renderStep(step, box, ans, stu, s, k);
  switch (step.t) {
    case 'goals': box.innerHTML = `<section class="card hero stack"><h1>${esc(L(s))}</h1><p class="muted">${tx('خذ نفسًا عميقًا. لا توجد إجابة خاطئة حين تكتب عن نفسك — الخطأ الوحيد ألّا تكون صادقًا.', "Take a breath. There's no wrong answer when you write about yourself — only not being honest.")}</p></section>
      ${(s.goalsAr || []).length ? `<section class="card stack"><h3>${t('goals')}</h3>${(AR() || !s.goalsEn?.length ? s.goalsAr : s.goalsEn).map(g => `<p class="row" style="align-items:flex-start">${I('target', 'width=18 style="flex:none;margin-top:4px;color:var(--o2)"')} ${esc(g)}</p>`).join('')}</section>` : ''}
      <p class="small muted">${t('saved')} · ${tx('درجة المحطة', 'Station points')}: ${N(s.points || 10)}</p>`; break;
    case 'video': { const yid = ytId(step.url);
      box.innerHTML = `${head(L(step))}${yid ? `<div class="video" style="padding:0;overflow:hidden"><iframe src="https://www.youtube-nocookie.com/embed/${yid}?rel=0&modestbranding=1&playsinline=1" title="video" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0"></iframe></div>`
        : `<div class="video"><div class="stack">${I('play', 'width=46 height=46 style="margin:auto"')}<p>${t('videoNote')}</p></div></div>`}<button class="btn ghost block" data-w>${ans[k] ? I('check') + ' ' : ''}${t('watched')}</button>`;
      $('[data-w]', box).onclick = () => { ans[k] = true; upd(); again(); }; break; }
    case 'quiz': box.innerHTML = `${head(L(step))}<p class="tiny muted">${tx('إجابتك الأولى هي التي تُحسب — فكّر قبل أن تختار.', 'Your first answer counts — think before you tap.')}</p>${step.opts.map((o, j) => `<button class="opt ${ans[k] != null ? (j === step.ok ? 'ok' : j === ans[k] ? 'no' : '') : ''}" data-j="${j}">${esc(opt(o))}</button>`).join('')}
      ${ans[k] != null ? `<div class="explain"><b>${ans[k] === step.ok ? t('correct') : t('notQuite')}</b> ${esc(L(step, 'why'))}</div>` : ''}`;
      $$('[data-j]', box).forEach(b => b.onclick = () => { if (ans[k] != null) return; ans[k] = +b.dataset.j; if (ans[k] === step.ok) confetti(); upd(); again(); }); break;
    case 'scale': case 'self': box.innerHTML = `${head(L(step))}<div class="scale">${Array.from({ length: 10 }, (_, j) => `<button class="${ans.scale === j + 1 ? 'on' : ''}" data-v="${j + 1}">${N(j + 1)}</button>`).join('')}</div>
      <div class="row between tiny muted"><span>${tx('قليلًا', 'A little')}</span><span>${tx('جدًّا', 'Very')}</span></div>
      <label class="field"><span>${t('why')}</span><textarea data-t placeholder="${t('writeHere')}">${esc(ans.scaleWhy || '')}</textarea></label>`;
      $$('[data-v]', box).forEach(b => b.onclick = () => { ans.scale = +b.dataset.v; upd(); $$('[data-v]', box).forEach(x => x.classList.toggle('on', x === b)); });
      $('[data-t]', box).oninput = (e) => { ans.scaleWhy = e.target.value; upd(); }; break;
    case 'pillars': ans.pillars ||= []; box.innerHTML = `${head(L(step))}<div>${Q.OMAR.map(o => `<button class="pill ${ans.pillars.includes(o.k) ? 'on' : ''}" style="--c:${o.c}" data-p="${o.k}"><b style="color:${o.c}">${o.k}</b> ${esc(L(o))}</button>`).join('')}</div>
      <label class="field"><span>${tx('أيّ ركن ينقصك؟ وكيف تقوّيه؟', 'Which pillar is missing? How will you grow it?')}</span><textarea data-t placeholder="${t('writeHere')}">${esc(ans.missing || '')}</textarea></label>`;
      $$('[data-p]', box).forEach(b => b.onclick = () => { const p = b.dataset.p; ans.pillars = ans.pillars.includes(p) ? ans.pillars.filter(x => x !== p) : [...ans.pillars, p]; b.classList.toggle('on'); upd(); });
      $('[data-t]', box).oninput = (e) => { ans.missing = e.target.value; upd(); }; break;
    case 'text': { const lim = [step.minWords && tx(`على الأقل ${N(step.minWords)} كلمات`, `at least ${step.minWords} words`), step.maxWords && tx(`وحد أقصى ${N(step.maxWords)}`, `max ${step.maxWords}`)].filter(Boolean).join(' ');
      box.innerHTML = `${head(L(step))}<textarea data-t placeholder="${t('writeHere')}" style="min-height:200px">${esc(ans[k] || '')}</textarea><p class="tiny muted"><span data-c></span>${lim ? ' · ' + lim : ''}</p>`;
      const ta = $('[data-t]', box), c = $('[data-c]', box), cnt = () => { const n = ta.value.trim().split(/\s+/).filter(Boolean).length; c.textContent = tx('عدد الكلمات: ', 'Words: ') + N(n); c.style.color = step.minWords && n < step.minWords ? 'var(--o2)' : ''; };
      cnt(); ta.oninput = () => { ans[k] = ta.value; cnt(); upd(); }; break; }
    case 'mission': ans.mission ??= L(step, 'draft'); box.innerHTML = `${head(L(step))}<p class="small muted">${tx('هذه مسودّة لتبدأ منها. غيّر فيها حتى تصبح رسالتك أنت.', 'A draft to start from. Change it until it is truly yours.')}</p><div class="paper"><textarea data-t style="border:0;background:transparent;font-size:19px;min-height:150px">${esc(ans.mission)}</textarea></div>`;
      $('[data-t]', box).oninput = (e) => { ans.mission = e.target.value; upd(); }; break;
    case 'upload': { const mine = db.files.filter(f => f.sid === stu.id && f.st === s.id);
      box.innerHTML = `${head(L(step))}${dropZone()}<p class="tiny muted">${t('filesTo', { p: drivePath(stu, s) })}</p><div class="list">${mine.map(fileRow).join('')}</div>`;
      bindDrop(box, stu, () => s.id, again); break; }
    case 'cards': box.innerHTML = `${head(L(step))}<div class="flips">${Q.OMAR.map(o => `<button class="flip" style="--c:${o.c}"><div class="in"><div class="f"><b>${o.k}</b><span>${esc(L(o))}</span></div><div class="b">${esc(L(o, 'd'))}</div></div></button>`).join('')}</div>`;
      $$('.flip', box).forEach(f => f.onclick = () => f.classList.toggle('on')); break;
    case 'cards-virtues': box.innerHTML = `${head(L(step))}${Q.VIRTUES.map(v => `<details class="card flat"><summary>${esc(v.ar)} — ${esc(v.people)}</summary><p class="small"><b>${tx('لغةً', 'Literally')}:</b> ${esc(v.lugha)}</p><p class="small"><b>${tx('اصطلاحًا', 'Meaning')}:</b> ${esc(v.istilah)}</p><a class="small link" href="#quran-${v.ayah.replace(':', '-')}">${I('book', 'width=15')} ${tx('استمع لآية الحب', 'Hear the love verse')}</a></details>`).join('')}`; break;
    case 'recite': { const key = step.ayah === 'virtue' || !step.ayah ? virtue(stu.virtue).ayah : Q.expandAyat([step.ayah])[0] || '2:195';
      box.innerHTML = `${head(L(step))}<div class="mushaf"><p class="ayah" data-a>${t('q_loading')}</p></div><a class="btn o block" href="#quran-${key.replace(':', '-')}">${I('book')} ${t('q_title')}</a>`;
      Q.Quran.text(key).then(v => { $('[data-a]', box).innerHTML = `${esc(v.uthmani)} <span class="num">${N(v.n)}</span>`; }).catch(() => $('[data-a]', box).textContent = t('q_offline')); break; }
    case 'choose-team': box.innerHTML = `${head(L(step))}${Q.TEAMS.map(tm => `<button class="opt ${(ans.team || stu.team) === tm.id ? 'ok' : ''}" data-tm="${tm.id}"><b style="color:${tm.color}">${esc(L(tm))}</b><span class="small muted" style="display:block;font-weight:400">${esc(L(tm, 'mission'))}</span></button>`).join('')}`;
      $$('[data-tm]', box).forEach(b => b.onclick = () => { ans.team = b.dataset.tm; upd(); again(); }); break;
    case 'choose-virtue': box.innerHTML = `${head(L(step))}<div>${Q.VIRTUES.map(v => `<button class="pill ${(ans.virtue || stu.virtue) === v.id ? 'on' : ''}" style="--c:var(--g)" data-v="${v.id}">${esc(v.ar)}</button>`).join('')}</div>`;
      $$('[data-v]', box).forEach(b => b.onclick = () => { ans.virtue = b.dataset.v; upd(); again(); }); break;
    case 'challenge': ans.days ||= []; box.innerHTML = `${head(L(step))}<p class="small muted">${tx('كل يوم تعمل فيه عملًا من أعمال صفتك، اضغط على اليوم.', 'Tap each day you practised your virtue.')}</p>
      <div class="days">${Array.from({ length: 30 }, (_, d) => `<button class="${ans.days.includes(d) ? 'on' : ''}" data-d="${d}">${N(d + 1)}</button>`).join('')}</div>`;
      $$('[data-d]', box).forEach(b => b.onclick = () => { const d = +b.dataset.d; ans.days = ans.days.includes(d) ? ans.days.filter(x => x !== d) : [...ans.days, d]; upd(); again(); }); break;
    default: box.innerHTML = head(L(step));
  }
}
const drivePath = (stu, s) => `Qualities / ${L(team(stu.team))} / ${stu.name}${s ? ' / ' + tx('المحطة ', 'Station ') + N(s.n) : ''}`;
const dropZone = () => `<label class="drop">${I('upload')}<b>${t('uploadHint')}</b><span class="tiny">JPG · PNG · MP4 · PDF · DOCX · MP3</span><input type="file" multiple hidden accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"></label>`;
const fileRow = (f) => `<div><span class="badge">${I(f.type.startsWith('image') ? 'sun' : f.type.startsWith('audio') ? 'mic' : f.type.startsWith('video') ? 'play' : 'file')}</span><span class="grow"><b class="small" style="display:block;overflow-wrap:anywhere">${esc(f.name)}</b><span class="tiny muted">${(f.size / 1024 / 1024).toFixed(1)} MB · ${esc(f.at)}${f.st && station(f.st) ? ' · ' + tx('المحطة ', 'Station ') + N(station(f.st).n) : ''}</span></span>${f.url ? `<audio controls src="${f.url}" style="height:34px;max-width:150px"></audio>` : `<span class="chip">${I('drive')} Drive</span>`}</div>`;
function bindDrop(box, stu, stId, after) {
  $('input[type=file]', box).onchange = async (e) => { const sid = stId(); for (const f of e.target.files) {
    db.files.push({ id: 'f' + Date.now() + Math.random(), sid: stu.id, st: sid || 'general', name: f.name, type: f.type || 'application/octet-stream', size: f.size, at: new Date().toISOString().slice(0, 10) });
    Q.api?.upload?.(f, { student: stu, team: team(stu.team), station: station(sid) }); }
    save(); toast(tx('رُفع الملف إلى درايف ✓', 'Uploaded to Drive ✓')); after(); };
}

/* ---------- Quran studio ---------- */
let player = null, recog = null;
function viewQuran(pre) {
  const stu = me(); const keys = [...new Set([...(pre ? [pre] : []), virtue(stu.virtue).ayah, ...Q.expandAyat(db.ayat[stu.team] || []), ...Q.expandAyat(db.ayat.shared)])];
  let mode = 'listen', sel = 0, level = 0, opts = { speed: 1, repeat: 1, gap: false, teacher: false }, verses = [], showText = false;
  db.listens[stu.id] ||= {}; db.recites[stu.id] ||= {}; db.reps[stu.id] ||= {};
  player?.pause(); recog?.stop(); recog = null;
  player = Q.Quran.player(st => { $$('.ayah-row').forEach((r, k) => r.classList.toggle('playing', st.playing && k === st.i)); const pb = $('[data-play]'); pb && (pb.innerHTML = I(st.playing ? 'pause' : 'play') + ' ' + t(st.playing ? 'q_pause' : 'q_play')); },
    key => { db.listens[stu.id][key] = (db.listens[stu.id][key] || 0) + 1; save(); const c = $(`[data-lc="${key}"]`); if (c) c.textContent = N(db.listens[stu.id][key]); const tl = $('[data-tl]'); if (tl) tl.textContent = N(listensOf(stu.id)); });
  stuShell(`<main class="stack-lg narrow"><section class="card hero stack"><h1>${t('q_title')}</h1><p class="muted">${t('q_sub')}</p>
    <div class="row wrap"><span class="chip glass">${I('play')} <b data-tl>${N(listensOf(stu.id))}</b> ${t('listened')}</span><span class="chip glass">${I('mic')} ${N(recitesOf(stu.id))} ${t('recited')}</span></div></section>
  <div class="seg3" role="tablist">${['listen', 'mem', 'recite'].map(m => `<button data-m="${m}" class="${m === mode ? 'on' : ''}">${t('q_' + m)}</button>`).join('')}</div>
  <div class="row wrap" id="keys"></div><div id="qb" class="stack"><p class="muted">${t('q_loading')}</p></div></main>`, 'quran');
  $$('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; $$('[data-m]').forEach(x => x.classList.toggle('on', x === b)); player.pause(); recog?.stop(); recog = null; draw(); });
  Promise.all(keys.map(k => Q.Quran.text(k).catch(() => null))).then(vs => { verses = vs.filter(Boolean); if (!verses.length) { $('#qb').innerHTML = `<p class="card">${t('q_offline')}</p>`; return; } player.set(verses.map(v => v.key)); draw(); });
  const sname = (v) => v.surah.replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, '').replace(/^سورة\s*/, '');
  const tokens = (v) => v.uthmani.split(/\s+/).filter(w => /[ء-يٱ]/.test(w));
  function keyChips() { $('#keys').innerHTML = mode === 'listen' ? '' : verses.map((v, k) => `<button class="chip ${k === sel ? 'o' : 'gray'}" data-k="${k}">${esc(AR() ? sname(v) : v.surahEn)} ${N(v.n)}</button>`).join('');
    $$('[data-k]').forEach(b => b.onclick = () => { sel = +b.dataset.k; player.pause(); recog?.stop(); recog = null; draw(); }); }
  function draw() {
    keyChips(); const qb = $('#qb'), lc = db.listens[stu.id];
    if (mode === 'listen') {
      qb.innerHTML = `<div class="mushaf">${verses.map((v, k) => `<div class="ayah-row" data-row="${k}"><p class="ayah">${esc(v.uthmani)} <span class="num">${N(v.n)}</span></p><p class="tiny muted row between"><span>${esc(AR() ? sname(v) : v.surahEn)} ${N(v.n)}</span><span>${I('play', 'width=12')} <b data-lc="${v.key}">${N(lc[v.key] || 0)}</b> ${t('listened')}</span></p></div>`).join('')}</div>
      <section class="card stack"><button class="btn block" data-play>${I('play')} ${t('q_play')}</button>
        <div class="row between wrap"><b class="small">${t('q_speed')}</b><div class="speeds">${[0.5, 0.75, 1, 1.25, 1.5].map(x => `<button data-sp="${x}" class="${opts.speed === x ? 'on' : ''}">${x}×</button>`).join('')}</div></div>
        <div class="row between"><b class="small">${t('q_repeat')}</b><div class="row"><button class="iconbtn" data-rp="-1" aria-label="-">${I('minus')}</button><b style="min-width:28px;text-align:center" data-rpv>${N(opts.repeat)}</b><button class="iconbtn" data-rp="1" aria-label="+">${I('plus')}</button></div></div>
        <div class="row between"><b class="small">${t('q_gap')}</b><button class="toggle ${opts.gap ? 'on' : ''}" data-tg="gap" aria-label="${t('q_gap')}"></button></div>
        <div class="row between"><b class="small">${t('q_teacher')}</b><button class="toggle ${opts.teacher ? 'on' : ''}" data-tg="teacher" aria-label="${t('q_teacher')}"></button></div></section>`;
      $('[data-play]').onclick = () => player.playing ? player.pause() : player.play();
      $$('[data-row]').forEach(r => r.onclick = () => player.play(+r.dataset.row));
      $$('[data-sp]').forEach(b => b.onclick = () => { opts.speed = +b.dataset.sp; player.opt(opts); $$('[data-sp]').forEach(x => x.classList.toggle('on', x === b)); });
      $$('[data-rp]').forEach(b => b.onclick = () => { opts.repeat = Math.min(10, Math.max(1, opts.repeat + +b.dataset.rp)); player.opt(opts); $('[data-rpv]').textContent = N(opts.repeat); });
      $$('[data-tg]').forEach(b => b.onclick = () => { opts[b.dataset.tg] = !opts[b.dataset.tg]; b.classList.toggle('on'); player.opt({ ...opts }); });
    } else if (mode === 'mem') {
      const v = verses[sel], tk = tokens(v), reps = db.reps[stu.id][v.key] || 0, goal = 10;
      qb.innerHTML = `<div class="seg3">${t('q_lv').map((l, k) => `<button data-lv="${k}" class="${k === level ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="mushaf"><p class="ayah">${tk.map((w, k) => `<span class="w ${level === 2 ? 'hid' : ''}" data-w="${k}">${level === 1 ? esc(Q.Quran.firstLetters(w)) : esc(w)}</span>`).join(' ')} <span class="num">${N(v.n)}</span></p></div>
      <p class="tiny muted" style="text-align:center">${t('q_tapPeek')}</p>
      <section class="card row between wrap"><div class="row"><div class="ring sm" style="--p:${Math.min(100, reps / goal * 100)}"><b>${N(reps)}</b></div><div><b>${tx('عدّاد التكرار', 'Repetition counter')}</b><p class="tiny muted">${tx(`الهدف ${N(goal)} مرات لتثبيت الآية`, `Goal: ${goal} times to lock it in`)}</p></div></div><button class="btn o sm" data-rep>+${N(1)} ${tx('كرّرتها', 'Repeated')}</button></section>
      <button class="btn ghost block" data-hear>${I('play')} ${t('q_listen')}</button>`;
      $$('[data-lv]').forEach(b => b.onclick = () => { level = +b.dataset.lv; draw(); });
      $$('[data-w]').forEach(w => w.onclick = () => { w.textContent = tk[+w.dataset.w]; w.classList.remove('hid'); w.classList.add('peek'); });
      $('[data-hear]').onclick = () => player.play(sel);
      $('[data-rep]').onclick = () => { db.reps[stu.id][v.key] = reps + 1; save(); if (reps + 1 === goal) confetti(); draw(); };
    } else recitePane();
  }
  function recitePane() {
    const v = verses[sel], tk = tokens(v), clean = Q.Quran.words(v.clean), useClean = clean.length === tk.length, qb = $('#qb');
    qb.innerHTML = `<div class="mushaf"><div class="row between" style="margin-bottom:8px"><span class="tiny muted">${tx('أظهر نص الآية', 'Show the verse text')}</span><button class="toggle ${showText ? 'on' : ''}" data-show aria-label="show"></button></div>
      <p class="ayah" data-rv>${tk.map((w, k) => `<span class="w ${showText ? '' : 'hid'}" data-w="${k}">${esc(w)}</span>`).join(' ')} <span class="num">${N(v.n)}</span></p></div>
      <section class="card stack" style="text-align:center">
        <button class="mic" data-mic aria-label="${t('q_mic')}">${I('mic')}</button><b data-ms>${Q.Quran.hasSR ? t('q_mic') : tx('التسميع الصوتي غير مدعوم في هذا المتصفح', 'Voice checking is not supported in this browser')}</b>
        <button class="btn red sm hide" data-stop style="margin:auto">${I('x')} ${tx('إيقاف', 'Stop')}</button>
        <div class="heard hide" data-hbox><span class="tiny muted">${tx('ما سمعته:', 'What I heard:')}</span><p data-heard></p></div>
        <p class="small" data-err style="color:var(--red)"></p>
        <p class="tiny muted">${t('q_note')}</p></section>
      <section class="card stack"><div class="row between"><div><b>${tx('سجّل تلاوتك للمشرف', 'Record for your supervisor')}</b><p class="tiny muted">${tx('ليستمع إليها ويقيّم التجويد', 'So they can grade your tajweed')}</p></div><button class="btn ghost sm" data-rec>${I('mic')} ${tx('سجّل', 'Record')}</button></div></section>`;
    const paint = (heard, final) => { const res = Q.Quran.check(useClean ? clean.join(' ') : tk.join(' '), heard); let got = 0;
      $$('[data-w]').forEach((w, k) => { w.classList.remove('hid', 'ok', 'no'); if (res[k]) { w.classList.add('ok'); got++; } else if (final) w.classList.add('no'); else if (!showText) w.classList.add('hid'); });
      return got; };
    $('[data-show]').onclick = () => { showText = !showText; recitePane(); };
    const setLive = (on) => { $('[data-mic]').classList.toggle('live', on); $('[data-stop]').classList.toggle('hide', !on); if (on) $('[data-ms]').textContent = t('q_listening'); };
    const finish = (final) => { setLive(false); recog = null; if (!final) { $('[data-ms]').textContent = tx('لم أسمع شيئًا — جرّب مرة أخرى بصوت أوضح.', "I didn't catch anything — try again a bit louder."); return; }
      const got = paint(final, true); $('[data-ms]').textContent = t('q_score', { a: N(got), b: N(tk.length) });
      db.recites[stu.id][v.key] = (db.recites[stu.id][v.key] || 0) + 1; save(); if (got / tk.length >= .9) confetti(); };
    $('[data-mic]').onclick = () => {
      if (!Q.Quran.hasSR) return;
      if (recog) { recog.stop(); return; }
      $('[data-err]').textContent = ''; $('[data-hbox]').classList.remove('hide'); $('[data-heard]').textContent = '…';
      $$('[data-w]').forEach(w => { w.className = 'w' + (showText ? '' : ' hid'); });
      setLive(true);
      recog = Q.Quran.listen(txt => { $('[data-heard]').textContent = txt; paint(txt, false); }, finish, (err) => {
        setLive(false); recog = null;
        $('[data-err]').textContent = err === 'not-allowed' ? tx('اسمح للتطبيق باستخدام الميكروفون (إعدادات Safari ← الميكروفون).', 'Allow microphone access in your browser settings.')
          : err === 'service-not-allowed' ? tx('على الآيفون: الإعدادات ← عام ← لوحة المفاتيح ← فعّل «الإملاء»، ثم أعد المحاولة.', 'On iPhone: Settings → General → Keyboard → turn on Dictation, then try again.')
          : err === 'network' ? tx('التسميع يحتاج اتصالًا بالإنترنت.', 'Voice checking needs an internet connection.') : tx('تعذّر تشغيل التسميع: ', 'Could not start: ') + err; });
    };
    $('[data-stop]').onclick = () => recog?.stop();
    let rec = null;
    $('[data-rec]').onclick = async (e) => { const b = e.currentTarget;
      if (rec) { const blob = await rec.stop(); rec = null; b.innerHTML = I('mic') + ' ' + tx('سجّل', 'Record'); b.classList.remove('red');
        db.files.push({ id: 'r' + Date.now(), sid: stu.id, st: 'quran', name: `${tx('تسميع', 'Recitation')} ${sname(v)} ${v.n}.webm`, type: 'audio/webm', size: blob.size, at: new Date().toISOString().slice(0, 10), url: URL.createObjectURL(blob) });
        Q.api?.upload?.(blob, { student: stu, team: team(stu.team), station: null, name: `recite-${v.key}.webm` }); save(); toast(t('q_rec')); return; }
      if (recog) recog.stop();
      try { rec = await Q.Quran.recorder(); } catch { rec = null; }
      if (!rec) return toast(tx('لا يمكن التسجيل — اسمح بالميكروفون.', 'Cannot record — allow the microphone.'));
      b.innerHTML = I('x') + ' ' + tx('إيقاف وإرسال', 'Stop & send'); b.classList.add('red'); };
  }
}

/* ---------- portfolio & team ---------- */
function viewPortfolio() {
  const stu = me(), mine = db.files.filter(f => f.sid === stu.id);
  const needed = myStations(stu).filter(s => ['open', 'draft', 'back'].includes(status(stu, s)) && s.steps.some(x => x.t === 'upload') && !db.files.some(f => f.sid === stu.id && f.st === s.id));
  stuShell(`<main class="stack-lg dgrid"><section class="card hero stack span2"><h1>${t('myFiles')}</h1><p class="muted">${t('filesTo', { p: drivePath(stu) })}</p></section>
  ${needed.length ? `<section class="card stack span2"><h3>${tx('مطلوب منك رفعه', 'Waiting for your upload')}</h3>${needed.map(s => `<a class="row between link" href="#station-${s.id}"><span class="row">${I(s.icon, 'width=18')} ${esc(L(s))}</span>${chev()}</a>`).join('')}</section>` : ''}
  <section class="stack"><h3>${t('uploadNew')}</h3><label class="field"><span>${t('stations')}</span><select id="pst">${myStations(stu).map(s => `<option value="${s.id}">${N(s.n)} · ${esc(L(s))}</option>`).join('')}</select></label><div id="dz">${dropZone()}</div></section>
  <section class="card"><h3>${t('myFiles')}</h3><div class="list">${mine.length ? mine.slice().reverse().map(fileRow).join('') : `<p class="muted">${t('noFiles')}</p>`}</div></section></main>`, 'portfolio');
  bindDrop($('#dz'), stu, () => $('#pst').value, viewPortfolio);
}
const BADGES = [
  ['star', 'أول محطة', 'First station', 'أتممت أول محطة واعتمدها مشرفك.', 'Your first station was approved.', (s) => db.subs.some(x => x.sid === s.id && x.status === 'ok')],
  ['flame', '٧ أيام متتالية', '7-day streak', 'فتحت التطبيق وعملت شيئًا ٧ أيام متتالية — الاستمرار سرّ النجاح.', 'You showed up 7 days in a row — consistency wins.', (s) => s.streak >= 7],
  ['book', 'صوت الإحسان', 'Voice of Ihsan', 'سمّعت آية بصوتك لأول مرة.', 'You recited a verse aloud for the first time.', (s) => recitesOf(s.id) > 0],
  ['heart', 'قلب ممتن', 'Grateful heart', 'سجّلت مشاعرك في «كيف قلبك اليوم؟».', 'You checked in with “How is your heart today?”.', (s) => db.moods.some(m => m.sid === s.id && m.mine)],
  ['users', 'روح الفريق', 'Team spirit', 'وصل فريقك إلى نصف الرحلة معًا.', 'Your team reached the halfway point together.', (s) => teamPct(s.team) >= 50],
  ['sparkle', 'حافظ الآيات', 'Verse keeper', 'كرّرت آية ١٠ مرات أو استمعت ٣٠ مرة.', 'You repeated a verse 10 times or listened 30 times.', (s) => Object.values(db.reps[s.id] || {}).some(n => n >= 10) || listensOf(s.id) >= 30]
];
function teamPct(tid) { const m = db.students.filter(s => s.team === tid); return Math.round(m.reduce((a, s) => a + db.subs.filter(x => x.sid === s.id && x.status === 'ok').length, 0) / Math.max(1, m.length * (sharedSt().length + trackSt(tid).length)) * 100); }
function honorBoard(kind) {
  const list = db.students.map(s => ({ s, v: kind === 'grades' ? gradeSum(s.id) : listensOf(s.id) + recitesOf(s.id) * 3 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 5);
  return list.length ? `<div class="list">${list.map((x, i) => `<div><span class="rank r${i + 1}">${N(i + 1)}</span><span class="grow"><b class="small">${esc(x.s.name)}</b><span class="tiny muted" style="display:block">${esc(L(team(x.s.team)))}</span></span><b>${N(x.v)}</b></div>`).join('')}</div>` : `<p class="muted small">${tx('ابدأ الرحلة لتظهر هنا!', 'Start your journey to appear here!')}</p>`;
}
function viewTeam() {
  const stu = me(), tm = team(stu.team), mates = db.students.filter(s => s.team === tm.id), tp = teamPct(tm.id);
  let hb = 'grades';
  stuShell(`<main class="stack-lg dgrid"><section class="card hero stack span2" style="background-color:${tm.color}"><span class="badge" style="background:#ffffff22;color:#fff">${I(tm.icon)}</span><h1>${esc(L(tm))}</h1><p class="muted">${esc(L(tm, 'mission'))}</p>
    <div><div class="row between small"><span>${t('teamProg')}</span><b>${pct(tp)}</b></div><div class="bar"><i style="width:${tp}%"></i></div></div></section>
  <section class="card"><h3>${t('members')}</h3><div class="list">${mates.map(s => `<div><span class="av" style="background:${tm.color}">${esc(initials(s.name))}</span><span class="grow"><b class="small">${esc(s.name)}${s.id === stu.id ? tx(' (أنت)', ' (you)') : ''}</b><span class="tiny muted" style="display:block">${esc(virtue(s.virtue).ar)}</span></span><span class="chip o">${I('flame')} ${N(s.streak)}</span></div>`).join('')}</div></section>
  <section class="card stack"><h3>${t('honor')}</h3>${tabsBar([['grades', t('topGrades')], ['readers', t('topReaders')]], hb, 'hb')}<div id="hbx">${honorBoard(hb)}</div></section>
  <section class="stack span2"><div class="row between"><h3>${t('badges')}</h3><span class="tiny muted">${tx('اضغط على الوسام لتعرف معناه', 'Tap a badge to see what it means')}</span></div><div class="badges">${BADGES.map(([ic, ar, en, , , test], i) => { const on = test(stu);
    return `<button class="card flat bdg ${on ? 'on' : ''}" data-bd="${i}"><span class="badge">${I(ic)}</span><b class="tiny">${AR() ? ar : en}</b></button>`; }).join('')}</div></section></main>`, 'team');
  $$('[data-hb]').forEach(b => b.onclick = () => { hb = b.dataset.hb; $$('[data-hb]').forEach(x => x.classList.toggle('on', x === b)); $('#hbx').innerHTML = honorBoard(hb); });
  $$('[data-bd]').forEach(b => b.onclick = () => { const [ic, ar, en, dAr, dEn, test] = BADGES[+b.dataset.bd], on = test(stu);
    sheet(`<div class="stack" style="text-align:center"><span class="badge" style="margin:auto;width:64px;height:64px;${on ? 'background:var(--o3);color:var(--o2)' : ''}">${I(ic)}</span><h2>${AR() ? ar : en}</h2><p>${AR() ? dAr : dEn}</p><span class="chip ${on ? '' : 'gray'}" style="margin:auto">${on ? tx('حصلت عليه ✓', 'Earned ✓') : tx('لم تحصل عليه بعد', 'Not earned yet')}</span><button class="btn block" data-close>OK</button></div>`); });
}

/* ---------------- gradebook (supervisor, lead, principal, owner) ---------------- */
function gradebook(students) {
  const sh = sharedSt();
  const cell = (sid, s) => { const x = subOf(sid, s.id); return !x ? '<span class="muted">—</span>' : x.status === 'ok' ? `<b>${N(x.grade ?? '✓')}</b>` : x.status === 'sub' ? `<span class="chip blue">${tx('مُسلَّمة', 'In')}</span>` : `<span class="chip red">↩</span>`; };
  const rows = students.map(st => { const tr = trackSt(st.team), tg = tr.reduce((a, s) => a + (subOf(st.id, s.id)?.status === 'ok' ? subOf(st.id, s.id).grade || 0 : 0), 0), gs = gradeSum(st.id), gm = gradeMax(st);
    return `<tr><th class="sticky"><b>${esc(st.name)}</b><br><span class="tiny muted">${esc(L(team(st.team)))}</span></th>${sh.map(s => `<td class="num">${cell(st.id, s)}</td>`).join('')}<td class="num">${N(tg)}</td><td class="num"><b>${N(gs)}</b>/${N(gm || 0)}</td><td class="num">${gm ? pct(Math.round(gs / gm * 100)) : '—'}</td></tr>`; }).join('');
  return `<div class="card"><div class="row between wrap" style="margin-bottom:10px"><h3>${t('grades')}</h3><span class="tiny muted">${tx('درجة كل محطة تُحدَّد من لوحة المسؤول (الافتراضي ١٠)', 'Each station’s points are set in the owner panel (default 10)')}</span></div>
    <div class="scroll gb"><table><thead><tr><th class="sticky">${tx('الطالب', 'Student')}</th>${sh.map(s => `<th class="num" title="${esc(L(s))}">${N(s.n)}</th>`).join('')}<th class="num">${tx('مسار الفريق', 'Team track')}</th><th class="num">${t('total')}</th><th class="num">%</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

/* ---------------- supervisor & lead supervisor ---------------- */
let supTab = 'in';
function viewReview(subId) {
  const lead = session.role === 'lead', sup = me(), mine = stuOfViewer(), pending = db.subs.filter(x => x.status === 'sub' && mine.some(s => s.id === x.sid));
  if (subId) return reviewOne(db.subs.find(x => x.id === subId));
  root.className = 'app wide'; root.innerHTML = `${topbar()}<main class="stack-lg"><section class="card hero stack"><p class="muted">${t('hello')} ${esc(sup.name)}</p><h1>${N(pending.length)} ${t('inbox')}</h1>${lead ? `<p class="muted small">${tx('ترين كل الطلاب وكل المشرفين.', 'You see every student and every supervisor.')}</p>` : ''}</section>
  ${tabsBar([['in', t('inbox'), 'inbox'], ['st', `${t(lead ? 'students' : 'myStudents')} (${N(mine.length)})`, 'users'], ['gr', t('grades'), 'star'], ...(lead ? [['sp', t('supervisors'), 'shield']] : [])], supTab, 'tb')}
  <section id="sv"></section></main>`;
  const stuLine = (s) => { const n = db.subs.filter(x => x.sid === s.id && x.status === 'ok').length, mood = db.moods.filter(m => m.sid === s.id).at(-1);
    return `<div><span class="av" style="background:${team(s.team).color}">${esc(initials(s.name))}</span><span class="grow"><b class="small">${esc(s.name)}</b><span class="tiny muted" style="display:block">${esc(L(team(s.team)))} · ${N(n)} ${tx('محطات', 'stations')} · ${N(gradeSum(s.id))} ${tx('درجة', 'pts')} · ${N(listensOf(s.id))} ${t('listened')} · ${N(recitesOf(s.id))} ${t('recited')}</span></span><span style="font-size:22px">${['😔', '😐', '🙂', '😊', '🤩'][(mood?.v || 3) - 1]}</span></div>`; };
  const panes = {
    in: () => pending.length ? `<div class="card"><div class="list">${pending.map(x => { const s = db.students.find(y => y.id === x.sid);
      return `<a href="#review-${x.id}"><span class="av" style="background:${team(s.team).color}">${esc(initials(s.name))}</span><span class="grow"><b class="small">${esc(s.name)}</b><span class="tiny muted" style="display:block">${esc(L(station(x.st)))} · ${esc(x.at)}${lead ? ' · ' + esc(db.sups.find(p => p.id === s.sup)?.name) : ''}</span></span>${chev(18)}</a>`; }).join('')}</div></div>` : `<p class="card muted">${t('empty')}</p>`,
    st: () => lead ? db.sups.map(p => `<div class="card" style="margin-bottom:12px"><h3>${esc(p.name)}</h3><div class="list">${db.students.filter(s => s.sup === p.id).map(stuLine).join('')}</div></div>`).join('') : `<div class="card"><div class="list">${mine.map(stuLine).join('')}</div></div>`,
    gr: () => gradebook(mine),
    sp: () => `<div class="card"><div class="scroll"><table class="rt"><thead><tr><th>${tx('المشرف', 'Supervisor')}</th><th class="num">${t('students')}</th><th class="num">${t('inbox')}</th><th class="num">${tx('معتمدة', 'Approved')}</th><th class="num">${tx('متوسط الدرجات', 'Avg grade')}</th></tr></thead><tbody>
      ${db.sups.map(sp => { const ids = db.students.filter(s => s.sup === sp.id).map(s => s.id), ok = db.subs.filter(x => x.status === 'ok' && ids.includes(x.sid)), avg = ok.length ? ok.reduce((a, x) => a + (x.grade || 0), 0) / ok.length : 0;
        return `<tr><td data-l="${tx('المشرف', 'Supervisor')}"><b>${esc(sp.name)}</b></td><td class="num" data-l="${t('students')}">${N(ids.length)}</td><td class="num" data-l="${t('inbox')}">${N(db.subs.filter(x => x.status === 'sub' && ids.includes(x.sid)).length)}</td><td class="num" data-l="${tx('معتمدة', 'Approved')}">${N(ok.length)}</td><td class="num" data-l="${tx('متوسط الدرجات', 'Avg grade')}">${N(avg.toFixed(1))}</td></tr>`; }).join('')}</tbody></table></div></div>`
  };
  const show = () => { $('#sv').innerHTML = (panes[supTab] || panes.in)(); };
  $$('[data-tb]').forEach(b => b.onclick = () => { supTab = b.dataset.tb; $$('[data-tb]').forEach(x => x.classList.toggle('on', x === b)); show(); }); show();
}
function reviewOne(x) {
  if (!x) return go('review'); const s = db.students.find(y => y.id === x.sid), stn = station(x.st), a = x.answers || {}, max = stn?.points || 10; x.rubric ||= {};
  const qa = (stn?.steps || []).map((st, k) => { const key = 'q' + k; const v = st.t === 'quiz' ? (a[key] != null && st.opts?.[a[key]] ? (a[key] === st.ok ? '✓ ' : '✗ ') + st.opts[a[key]][0] : null)
    : st.t === 'scale' || st.t === 'self' ? (a.scale ? N(a.scale) + ' / ' + N(10) + (a.scaleWhy ? ' — ' + a.scaleWhy : '') : null) : st.t === 'pillars' ? (a.pillars || []).join(' · ') + (a.missing ? ' — ' + a.missing : '')
    : st.t === 'mission' ? a.mission : st.t === 'text' ? a[key] : null;
    return v ? `<div class="qa"><p class="tiny muted">${esc(L(st))}</p><p>${esc(v)}</p></div>` : ''; }).join('');
  const files = db.files.filter(f => f.sid === s.id && (f.st === x.st || f.st === 'quran'));
  const suggest = () => { const r = Object.values(x.rubric), rAvg = r.length ? r.reduce((p, q) => p + q, 0) / (4 * r.length) : 0;
    const qz = x.quiz?.total ? x.quiz.ok / x.quiz.total : null; return Math.round(max * (qz == null ? rAvg : qz * .3 + rAvg * .7)); };
  root.className = 'app wide'; root.innerHTML = `${topbar()}<main class="stack-lg narrow"><button class="row small link" data-back>${backI()} ${t('inbox')}</button>
  <section class="card stack"><div class="row"><span class="av" style="background:${team(s.team).color}">${esc(initials(s.name))}</span><div><h3>${esc(s.name)}</h3><p class="tiny muted">${esc(L(team(s.team)))} · ${esc(L(stn))}</p></div></div>
  ${x.quiz?.total ? `<div class="row between"><b class="small">${tx('أسئلة الفهم (تُصحَّح تلقائيًا)', 'Quiz (auto-marked)')}</b><span class="chip">${N(x.quiz.ok)}/${N(x.quiz.total)}</span></div>` : ''}${qa}
  ${files.length ? `<div class="list">${files.map(fileRow).join('')}</div>` : ''}</section>
  <section class="card stack"><h3>${t('grade')}</h3>${Q.RUBRIC.map(r => `<div class="row between wrap"><b class="small">${esc(L(r))}</b><div class="stars">${[1, 2, 3, 4].map(n => `<button data-r="${r.id}" data-n="${n}" class="${x.rubric[r.id] >= n ? 'on' : ''}">${N(n)}</button>`).join('')}</div></div>`).join('')}
  <div class="row between wrap gradebox"><b>${t('gradeOf')}</b><div class="row"><input class="input" id="gr" type="number" min="0" max="${max}" inputmode="numeric" value="${x.grade ?? ''}" placeholder="${suggest() || ''}" style="width:96px;text-align:center;font-weight:700"><b>/ ${N(max)}</b></div><span class="tiny muted" data-sg>${tx('المقترح', 'Suggested')}: ${N(suggest())}</span></div>
  <label class="field"><span>${t('comment')}</span><textarea id="cm" placeholder="${tx('ابدأ بما أحسن فيه، ثم خطوة واحدة للتحسين…', 'Start with what they did well, then one step to grow…')}">${esc(x.comment || '')}</textarea></label>
  <div class="grid g2 m1"><button class="btn ghost" data-sb>${t('sendBack')}</button><button class="btn" data-ap>${t('approve')}</button></div></section></main>`;
  $('[data-back]').onclick = () => go('review');
  $$('[data-r]').forEach(b => b.onclick = () => { x.rubric[b.dataset.r] = +b.dataset.n; $$(`[data-r="${b.dataset.r}"]`).forEach(y => y.classList.toggle('on', +y.dataset.n <= +b.dataset.n)); save();
    $('#gr').placeholder = suggest(); $('[data-sg]').textContent = tx('المقترح', 'Suggested') + ': ' + N(suggest()); });
  const done = (stt) => { x.comment = $('#cm').value; const g = $('#gr').value === '' ? suggest() : Math.max(0, Math.min(max, +$('#gr').value));
    if (stt === 'ok') x.grade = g; x.status = stt; save(); log(`${stt === 'ok' ? 'Approved' : 'Returned'} ${stn.id} for ${s.name}${stt === 'ok' ? ` (${g}/${max})` : ''}`); toast(stt === 'ok' ? `✓ ${N(g)}/${N(max)}` : '↩'); go('review'); };
  $('[data-ap]').onclick = () => done('ok'); $('[data-sb]').onclick = () => done('back');
}

/* ---------------- principal ---------------- */
let dashTab = 'ov';
function viewDash() {
  root.className = 'app wide'; const S = db.students, n = S.length, owner = session.role === 'owner';
  root.innerHTML = `${topbar(owner ? `<a class="langbtn" href="#admin">${t('admin')}</a>` : '')}<main class="stack-lg">${tabsBar([['ov', t('overview'), 'chart'], ['gr', t('grades'), 'star']], dashTab, 'dt')}<div id="dv"></div></main>`;
  $$('[data-dt]').forEach(b => b.onclick = () => { dashTab = b.dataset.dt; viewDash(); });
  if (dashTab === 'gr') { $('#dv').innerHTML = gradebook(S); return; }
  const active = new Set([...db.subs.map(x => x.sid), ...db.moods.filter(m => m.d <= 6).map(m => m.sid)]).size;
  const okSubs = db.subs.filter(x => x.status === 'ok'), pend = db.subs.filter(x => x.status === 'sub').length;
  const hb = S.reduce((a, s) => a + s.happyBefore, 0) / n, hn = S.reduce((a, s) => a + s.happyNow, 0) / n, lis = S.reduce((a, s) => a + listensOf(s.id) + recitesOf(s.id), 0);
  const avgG = okSubs.length ? okSubs.reduce((a, x) => a + (x.grade || 0), 0) / okSubs.length : 0;
  const byTeam = Q.TEAMS.map(tm => { const m = S.filter(s => s.team === tm.id); return { tm, p: Math.round(m.filter(s => subOf(s.id, 's1')?.status === 'ok').length / m.length * 100) }; });
  const act = Array.from({ length: 14 }, (_, k) => new Set(db.moods.filter(m => m.d === 13 - k).map(m => m.sid)).size);
  const spots = okSubs.filter(x => x.answers?.mission).slice(0, 3), f1 = (v) => N(v.toFixed(1));
  $('#dv').innerHTML = `<div class="stack-lg">
  <section class="stack"><p class="small muted">${t('dash')} · ${Q.date('2026-11-28')}</p><h1 style="max-width:30ch">${AR() ? `${N(Math.round(active / n * 100))}٪ من الطلاب بدأوا رحلتهم، والسعادة ارتفعت من ${f1(hb)} إلى ${f1(hn)}` : `${Math.round(active / n * 100)}% of students have started, and happiness rose from ${hb.toFixed(1)} to ${hn.toFixed(1)}`}</h1></section>
  <section class="grid g4">${[[t('participation'), pct(Math.round(active / n * 100)), `${N(active)}/${N(n)}`], [t('completion'), N(okSubs.length), `${N(pend)} ${tx('بانتظار المراجعة', 'awaiting review')}`],
    [tx('متوسط الدرجات', 'Average grade'), f1(avgG) + '/' + N(10), tx('لكل محطة معتمدة', 'per approved station')], [t('recitation'), N(lis), tx('مرة استماع وتسميع', 'listens & recitations')]]
    .map(([a, b, c]) => `<div class="card kpi"><p class="small muted">${a}</p><b>${b}</b><span class="delta">${c}</span></div>`).join('')}</section>
  <section class="grid g2 m1"><div class="card stack"><h3>${t('byTeam')} — ${tx('المحطة ١', 'Station 1')}</h3>${byTeam.map(b => `<div class="hbar"><span class="small"><b style="color:${b.tm.color}">●</b> ${esc(L(b.tm))}</span><div class="bar"><i style="width:${b.p}%;background:${b.tm.color}"></i></div><b class="small">${pct(b.p)}</b></div>`).join('')}
    <div class="hbar"><span class="small">${t('happiness')}</span><div class="bar"><i style="width:${hn * 10}%"></i></div><b class="small">${f1(hn)}</b></div></div>
    <div class="card stack"><h3>${t('activity')}</h3><div class="fig" style="min-height:130px"><svg class="spark" id="sp"></svg></div><p class="tiny muted">${tx('عدد الطلاب النشطين يوميًا', 'Daily active students')}</p></div></section>
  <section class="grid g2 m1"><div class="card stack"><h3>${t('kpis')}</h3>${[[tx('مبادرات ناجحة (الهدف ٣)', 'Successful initiatives (target 3)'), 1, 3], [tx('رضا المستفيدين (الهدف ٨٠٪)', 'Beneficiary satisfaction (target 80%)'), 0, 80], [tx('المحطات المشتركة المنجزة', 'Shared stations completed'), 1, sharedSt().length]]
      .map(([l, v, g]) => `<div class="hbar wide-l"><span class="small">${l}</span><div class="bar"><i style="width:${v / g * 100}%"></i></div><b class="small">${N(v)}/${N(g)}</b></div>`).join('')}
      <p class="tiny muted">${tx('أرقام تجريبية للعرض.', 'Sample figures for the demo.')}</p></div>
    <div class="card stack"><h3>${t('spotlight')}</h3>${spots.map(x => { const s = S.find(y => y.id === x.sid); return `<div class="paper"><p>«${esc(x.answers.mission)}»</p><p class="tiny muted" style="margin-top:6px">— ${esc(s.name)} · ${esc(L(team(s.team)))}</p></div>`; }).join('')}</div></section>
  <p class="tiny muted" style="text-align:center">${t('demoBanner')}</p></div>`;
  const sp = $('#sp'), drawSp = () => { const W = sp.clientWidth, H = sp.clientHeight, mx = Math.max(...act, 1), px = (k) => 8 + k * (W - 16) / 13, py = (v) => H - 14 - v / mx * (H - 30);
    const d = act.map((v, k) => `${k ? 'L' : 'M'}${px(k)},${py(v)}`).join('');
    sp.innerHTML = `<path d="${d} L${px(13)},${H - 14} L${px(0)},${H - 14}Z" fill="#F3952322"/><path d="${d}" fill="none" stroke="#F39523" stroke-width="3" stroke-linejoin="round"/><circle cx="${px(13)}" cy="${py(act[13])}" r="5" fill="#18873B"/><text x="${px(13) - 8}" y="${py(act[13]) - 10}" font-size="13" font-weight="700" fill="#18873B" text-anchor="end">${N(act[13])}</text>`; };
  new ResizeObserver(drawSp).observe(sp);
}

/* ---------------- owner / admin ---------------- */
let adminTab = 'students';
const STEP_TYPES = [['text', 'سؤال مفتوح (كتابة)', 'Open question'], ['quiz', 'اختيار من متعدد', 'Multiple choice'], ['video', 'فيديو (يوتيوب)', 'Video (YouTube)'], ['upload', 'رفع ملف / صورة', 'File / photo upload'],
  ['scale', 'مقياس ١–١٠', 'Scale 1–10'], ['pillars', 'أركان السعادة', 'Happiness pillars'], ['mission', 'رسالتي في الحياة', 'Life mission'], ['recite', 'آية للاستماع والتسميع', 'Verse to listen & recite'],
  ['cards', 'بطاقات OMAR FLOW', 'OMAR FLOW cards'], ['cards-virtues', 'بطاقات الصفات', 'Virtue cards'], ['challenge', 'تحدّي ٣٠ يومًا', '30-day challenge'], ['choose-team', 'اختيار الفريق', 'Choose team'], ['choose-virtue', 'اختيار الصفة', 'Choose virtue']];
const ICONS = ['compass', 'sun', 'heart', 'users', 'shield', 'star', 'target', 'flame', 'globe', 'file', 'book', 'chart', 'pen', 'search', 'megaphone', 'sprout'];
function viewAdmin() {
  root.className = 'app wide';
  const tabsA = [['students', t('students'), 'users'], ['supervisors', t('supervisors'), 'shield'], ['stations', t('stations'), 'map'], ['ayat', t('ayat'), 'book'], ['grades', t('grades'), 'star'], ['drive', t('drive'), 'drive'], ['audit', t('audit'), 'file']];
  root.innerHTML = `${topbar(`<a class="langbtn" href="#dash">${t('dash')}</a>`)}<main class="stack-lg"><section class="stack"><h1>${t('admin')}</h1><p class="muted small">${tx('هذه الصفحة لك وحدك. كل عرض لكلمة مرور يُسجَّل في السجلّ.', 'Only you can see this page. Every password view is written to the audit log.')}</p>
  <details class="card flat guide"><summary>${I('help', 'width=18 style="vertical-align:-3px"')} ${tx('ماذا يمكنك التحكم فيه؟', 'What can you control?')}</summary><ul class="small">
    <li><b>${t('students')}:</b> ${tx('غيّر فريق أي طالب أو مشرفه، اعرض كلمة المرور أو أعد ضبطها، وانسخ القائمة كاملة.', "change a student's team or supervisor, view or reset passwords, copy the roster.")}</li>
    <li><b>${t('stations')}:</b> ${tx('أضف محطة أو احذفها أو رتّبها، وعدّل عنوانها ومواعيدها ودرجتها، وكل أسئلتها: نوع السؤال، الإجابة الصحيحة، الحد الأدنى للكلمات، رابط الفيديو.', 'add, delete or reorder stations; edit titles, dates, points and every question: type, correct answer, minimum words, video link.')}</li>
    <li><b>${t('ayat')}:</b> ${tx('اختر السورة ومن آية إلى آية لكل فريق — الصوت بصوت الحصري تلقائيًا.', 'pick a surah and a verse range for each team — Al-Husary audio is automatic.')}</li>
    <li><b>${t('grades')}:</b> ${tx('سجلّ درجات كل الطلاب في كل المحطات.', "every student's grade in every station.")}</li></ul></details></section>
  ${tabsBar(tabsA, adminTab, 'at')}<section id="ap"></section></main>`;
  $$('[data-at]').forEach(b => b.onclick = () => { adminTab = b.dataset.at; viewAdmin(); });
  const ap = $('#ap');
  ({ students: adminStudents, supervisors: adminSups, stations: adminStations, ayat: adminAyat, grades: () => ap.innerHTML = gradebook(db.students), drive: adminDrive, audit: adminAudit }[adminTab])(ap);
}
function adminStudents(ap) {
  const H = [tx('الطالب', 'Student'), t('team'), tx('المشرف', 'Supervisor'), t('user'), t('pass'), t('grades')];
  ap.innerHTML = `<div class="card stack"><div class="row wrap"><input class="input grow" id="q" placeholder="${t('search')}" style="max-width:320px"><button class="btn ghost sm" data-csv>${I('copy')} CSV</button></div><div class="scroll"><table class="rt"><thead><tr>${H.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody id="tb"></tbody></table></div></div>`;
  const rows = (q = '') => { $('#tb').innerHTML = db.students.filter(s => s.name.includes(q)).map(s => `<tr><td data-l="${H[0]}"><span><b>${esc(s.name)}</b> <span class="tiny muted">${esc(s.grade)}</span></span></td>
    <td data-l="${H[1]}"><select data-f="team" data-id="${s.id}" class="sel">${Q.TEAMS.map(tm => `<option value="${tm.id}" ${tm.id === s.team ? 'selected' : ''}>${esc(L(tm))}</option>`).join('')}</select></td>
    <td data-l="${H[2]}"><select data-f="sup" data-id="${s.id}" class="sel">${db.sups.map(sp => `<option value="${sp.id}" ${sp.id === s.sup ? 'selected' : ''}>${esc(sp.name)}</option>`).join('')}</select></td>
    <td data-l="${H[3]}"><span class="mono">${esc(s.user)}</span></td><td data-l="${H[4]}"><span class="row" style="gap:4px"><span class="mono" data-pw="${s.id}">••••••••</span><button class="iconbtn sm" data-eye="${s.id}" aria-label="${t('show')}">${I('eye')}</button><button class="iconbtn sm" data-rs="${s.id}" aria-label="${t('reset')}">${I('refresh')}</button></span></td>
    <td class="num" data-l="${H[5]}">${N(gradeSum(s.id))}</td></tr>`).join(''); bind(); };
  const bind = () => {
    $$('[data-f]').forEach(sel => sel.onchange = () => { const s = db.students.find(x => x.id === sel.dataset.id); s[sel.dataset.f] = sel.value; log(`Changed ${sel.dataset.f} of ${s.name} → ${sel.value}`); toast('✓'); });
    $$('[data-eye]').forEach(b => b.onclick = () => { const s = db.students.find(x => x.id === b.dataset.eye), el = $(`[data-pw="${s.id}"]`), on = el.textContent.startsWith('•');
      el.textContent = on ? s.pass : '••••••••'; b.innerHTML = I(on ? 'eyeoff' : 'eye'); if (on) log(`Viewed password of ${s.name}`); });
    $$('[data-rs]').forEach(b => b.onclick = () => { const s = db.students.find(x => x.id === b.dataset.rs); s.pass = ['Rose', 'Palm', 'Nile', 'Star', 'Moon'][Math.random() * 5 | 0] + (1000 + Math.random() * 9000 | 0); log(`Reset password of ${s.name}`);
      sheet(`<div class="stack" style="text-align:center"><h3>${esc(s.name)}</h3><p>${t('newPass', { p: `<b class="mono" style="font-size:22px">${esc(s.pass)}</b>` })}</p><button class="btn block" data-cp>${t('copy')}</button><button class="btn ghost block" data-close>OK</button></div>`,
        sc => $('[data-cp]', sc).onclick = () => navigator.clipboard?.writeText(s.pass).then(() => toast(t('copied'))).catch(() => {})); rows($('#q').value); });
  };
  rows(); $('#q').oninput = (e) => rows(e.target.value);
  $('[data-csv]').onclick = () => { const csv = ['name,grade,team,supervisor,username,password,points', ...db.students.map(s => [s.name, s.grade, L(team(s.team)), db.sups.find(x => x.id === s.sup).name, s.user, s.pass, gradeSum(s.id)].join(','))].join('\n');
    navigator.clipboard?.writeText(csv).then(() => toast(t('copied'))).catch(() => {}); log('Copied roster CSV'); };
}
function adminSups(ap) {
  const H = [tx('المشرف', 'Supervisor'), t('user'), t('pass'), t('students')];
  ap.innerHTML = `<div class="card scroll"><table class="rt"><thead><tr>${H.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${db.sups.map(sp => `<tr><td data-l="${H[0]}"><span><b>${esc(sp.name)}</b><br><span class="tiny muted mono">${esc(sp.email)}</span></span></td><td data-l="${H[1]}" class="mono">${esc(sp.email.split('@')[0])}</td><td data-l="${H[2]}" class="mono">${esc(sp.pass)}</td><td class="num" data-l="${H[3]}">${N(db.students.filter(s => s.sup === sp.id).length)}</td></tr>`).join('')}
    <tr><td data-l="${H[0]}"><span><b>${esc(Q.LEAD.name)}</b></span></td><td data-l="${H[1]}" class="mono">${Q.LEAD.user}</td><td data-l="${H[2]}" class="mono">${Q.LEAD.pass}</td><td class="num" data-l="${H[3]}">${N(db.students.length)}</td></tr></tbody></table></div>`;
}
function renumber() { ['shared', ...Q.TEAMS.map(x => x.id)].forEach(tr => trackSt(tr).forEach((s, i) => s.n = i + 1)); }
const upI = I('chev', 'width=16 style="transform:rotate(-90deg)"'), downI = I('chev', 'width=16 style="transform:rotate(90deg)"');
function adminStations(ap) {
  const block = (tr, name, color) => { const list = trackSt(tr);
    return `<div class="card stack"><div class="row between"><h3 style="color:${color || 'inherit'}">${esc(name)} <span class="tiny muted">(${N(list.length)})</span></h3><button class="btn sm" data-new="${tr}">${I('plus')} ${tx('محطة', 'Station')}</button></div>
    <div class="list">${list.map((s, i) => `<div class="strow"><span class="badge">${I(s.icon)}</span><span class="grow"><b class="small">${N(s.n)}. ${esc(L(s))}</b><span class="tiny muted" style="display:block">${N(s.steps.length)} ${tx('خطوات', 'steps')} · ${N(s.points || 10)} ${tx('درجة', 'pts')}${s.due ? ' · ' + Q.date(s.due) : ''}${s.forceOpen ? ' · ' + tx('مفتوحة يدويًا', 'force-open') : ''}</span></span>
      <span class="row acts"><button class="iconbtn sm" data-mv="${s.id}|-1" ${i ? '' : 'disabled'} aria-label="up">${upI}</button><button class="iconbtn sm" data-mv="${s.id}|1" ${i < list.length - 1 ? '' : 'disabled'} aria-label="down">${downI}</button><button class="btn ghost sm" data-ed="${s.id}">${tx('تعديل', 'Edit')}</button></span></div>`).join('')}</div></div>`; };
  ap.innerHTML = `<div class="grid g2 m1">${block('shared', t('shared'))}${Q.TEAMS.map(tm => block(tm.id, L(tm), tm.color)).join('')}</div>`;
  $$('[data-ed]').forEach(b => b.onclick = () => editStation(b.dataset.ed));
  $$('[data-new]').forEach(b => b.onclick = () => editStation(null, b.dataset.new));
  $$('[data-mv]').forEach(b => b.onclick = () => { const [id, d] = b.dataset.mv.split('|'), s = station(id), list = trackSt(s.track), o = list[list.indexOf(s) + +d];
    const a = ST().indexOf(s), c = ST().indexOf(o); [ST()[a], ST()[c]] = [ST()[c], ST()[a]]; renumber(); log(`Moved station ${s.id}`); save(); adminStations(ap); });
}
function editStation(id, track) {
  const isNew = !id, s = isNew ? { id: 'c' + Date.now().toString(36), track, n: trackSt(track).length + 1, ar: '', en: '', icon: 'star', opens: '', due: '', points: 10, forceOpen: false, goalsAr: [], steps: [{ t: 'text', ar: '' }] } : structuredClone(station(id));
  const used = !isNew && db.subs.some(x => x.st === id);
  const sc = sheet(`<div id="ed" class="stack"></div>`, null, true), box = $('#ed', sc);
  const typeSel = (st, j) => `<select class="sel" data-sf="t" data-j="${j}">${STEP_TYPES.map(([v, ar, en]) => `<option value="${v}" ${v === st.t ? 'selected' : ''}>${AR() ? ar : en}</option>`).join('')}</select>`;
  const extra = (st, j) => {
    if (st.t === 'quiz') { st.opts ||= [['', ''], ['', ''], ['', ''], ['', '']]; while (st.opts.length < 4) st.opts.push(['', '']); st.ok ??= 0;
      return `<div class="stack">${st.opts.map((o, q) => `<label class="row"><input type="radio" name="ok${j}" data-ok="${j}" value="${q}" ${st.ok === q ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--g);flex:none"><input class="input" data-opt="${j}|${q}" value="${esc(o[0])}" placeholder="${tx('الاختيار', 'Option')} ${N(q + 1)}"></label>`).join('')}
      <p class="tiny muted">${tx('حدّد الدائرة بجانب الإجابة الصحيحة', 'Select the circle next to the correct answer')}</p><input class="input" data-sf="whyAr" data-j="${j}" value="${esc(st.whyAr || '')}" placeholder="${tx('شرح الإجابة الصحيحة (يظهر بعد الإجابة)', 'Why it is correct (shown after answering)')}"></div>`; }
    if (st.t === 'text') return `<div class="row"><label class="field grow"><span>${tx('أقل عدد كلمات', 'Min words')}</span><input class="input" type="number" min="0" data-sf="minWords" data-j="${j}" value="${st.minWords || ''}"></label><label class="field grow"><span>${tx('أقصى عدد كلمات', 'Max words')}</span><input class="input" type="number" min="0" data-sf="maxWords" data-j="${j}" value="${st.maxWords || ''}"></label></div>`;
    if (st.t === 'video') return `<input class="input" data-sf="url" data-j="${j}" value="${esc(st.url || '')}" placeholder="https://youtu.be/…" style="direction:ltr">`;
    if (st.t === 'recite') return `<input class="input" data-sf="ayah" data-j="${j}" value="${esc(st.ayah === 'virtue' ? '' : st.ayah || '')}" placeholder="${tx('مثال 2:195 — اتركه فارغًا لآية صفة الطالب', 'e.g. 2:195 — leave empty for the student’s virtue verse')}" style="direction:ltr">`;
    if (st.t === 'mission') return `<textarea class="input" data-sf="draftAr" data-j="${j}" placeholder="${tx('المسودّة المقترحة', 'Suggested draft')}" style="min-height:80px">${esc(st.draftAr || '')}</textarea>`;
    return '';
  };
  const draw = () => {
    box.innerHTML = `<div class="row between"><h2>${isNew ? tx('محطة جديدة', 'New station') : tx('تعديل المحطة', 'Edit station')}</h2><button class="iconbtn" data-close aria-label="close">${I('x')}</button></div>
    <div class="grid g2 m1"><label class="field"><span>${tx('العنوان بالعربية', 'Title (Arabic)')}</span><input class="input" data-s="ar" value="${esc(s.ar)}"></label><label class="field"><span>${tx('العنوان بالإنجليزية (اختياري)', 'Title (English, optional)')}</span><input class="input" data-s="en" value="${esc(s.en || '')}" style="direction:ltr"></label>
      <label class="field"><span>${tx('تُفتح يوم', 'Opens on')}</span><input class="input" type="date" data-s="opens" value="${s.opens || ''}"></label><label class="field"><span>${tx('موعد التسليم', 'Due date')}</span><input class="input" type="date" data-s="due" value="${s.due || ''}"></label>
      <label class="field"><span>${tx('درجة المحطة', 'Station points')}</span><input class="input" type="number" min="1" max="100" data-s="points" value="${s.points || 10}"></label>
      <label class="field"><span>${tx('الأيقونة', 'Icon')}</span><select class="sel" data-s="icon">${ICONS.map(ic => `<option ${ic === s.icon ? 'selected' : ''}>${ic}</option>`).join('')}</select></label></div>
    <div class="row between"><b class="small">${tx('افتحها الآن لكل الطلاب (تتخطى المواعيد)', 'Open now for everyone (ignore dates)')}</b><button class="toggle ${s.forceOpen ? 'on' : ''}" data-fo aria-label="force open"></button></div>
    <label class="field"><span>${tx('أهداف المحطة (هدف في كل سطر)', 'Goals (one per line)')}</span><textarea class="input" data-s="goals" style="min-height:90px">${esc((s.goalsAr || []).join('\n'))}</textarea></label>
    <h3>${tx('الخطوات والأسئلة', 'Steps & questions')}</h3>
    ${s.steps.map((st, j) => `<div class="card flat stack stepcard"><div class="row between wrap"><b>${N(j + 1)}.</b>${typeSel(st, j)}<span class="row"><button class="iconbtn sm" data-smv="${j}|-1" ${j ? '' : 'disabled'} aria-label="up">${upI}</button><button class="iconbtn sm" data-smv="${j}|1" ${j < s.steps.length - 1 ? '' : 'disabled'} aria-label="down">${downI}</button><button class="iconbtn sm" data-sdel="${j}" aria-label="delete">${I('x')}</button></span></div>
      <input class="input" data-sf="ar" data-j="${j}" value="${esc(st.ar || '')}" placeholder="${tx('نص السؤال أو التعليمات', 'Question or instruction')}">${extra(st, j)}</div>`).join('')}
    <button class="btn ghost block" data-add>${I('plus')} ${tx('أضف خطوة / سؤالًا', 'Add a step / question')}</button>
    <div class="row wrap"><button class="btn grow" data-save>${tx('حفظ', 'Save')}</button>${isNew ? '' : `<button class="btn ghost" data-del style="color:var(--red)">${tx('حذف المحطة', 'Delete station')}</button>`}</div>
    ${used ? `<p class="tiny muted">${tx('تنبيه: بعض الطلاب سلّموا هذه المحطة. تعديل الأسئلة لا يمسح إجاباتهم.', "Note: some students already submitted this station. Editing questions keeps their answers.")}</p>` : ''}`;
    $$('[data-s]', box).forEach(el => el.oninput = el.onchange = () => { const k = el.dataset.s; if (k === 'goals') s.goalsAr = el.value.split('\n').map(x => x.trim()).filter(Boolean); else if (k === 'points') s.points = Math.max(1, +el.value || 10); else s[k] = el.value; });
    $$('[data-sf]', box).forEach(el => el.oninput = el.onchange = () => { const st = s.steps[+el.dataset.j], k = el.dataset.sf;
      if (k === 't') { if (st.t !== el.value) { st.t = el.value; draw(); } } else if (k === 'minWords' || k === 'maxWords') st[k] = +el.value || undefined; else st[k] = el.value; });
    $$('[data-opt]', box).forEach(el => el.oninput = () => { const [j, q] = el.dataset.opt.split('|').map(Number); s.steps[j].opts[q] = [el.value, el.value]; });
    $$('[data-ok]', box).forEach(el => el.onchange = () => { s.steps[+el.dataset.ok].ok = +el.value; });
    $('[data-fo]', box).onclick = (e) => { s.forceOpen = !s.forceOpen; e.currentTarget.classList.toggle('on'); };
    $$('[data-smv]', box).forEach(b => b.onclick = () => { const [j, d] = b.dataset.smv.split('|').map(Number); [s.steps[j], s.steps[j + d]] = [s.steps[j + d], s.steps[j]]; draw(); });
    $$('[data-sdel]', box).forEach(b => b.onclick = () => { s.steps.splice(+b.dataset.sdel, 1); draw(); });
    $('[data-add]', box).onclick = () => { s.steps.push({ t: 'text', ar: '' }); draw(); box.parentElement.scrollTo({ top: 1e5, behavior: 'smooth' }); };
    $('[data-save]', box).onclick = () => { if (!s.ar.trim()) return toast(tx('اكتب عنوان المحطة', 'Add a title'));
      s.steps = s.steps.map(st => { if (st.t !== 'quiz') return st.t === 'recite' && !st.ayah ? { ...st, ayah: 'virtue' } : st;
        const keep = st.opts.map((o, q) => [o, q]).filter(([o]) => o[0].trim()); if (keep.length < 2) return null;
        return { ...st, opts: keep.map(([o]) => o), ok: Math.max(0, keep.findIndex(([, q]) => q === st.ok)) }; }).filter(Boolean);
      if (!s.steps.length) return toast(tx('أضف خطوة واحدة على الأقل (سؤال الاختيار يحتاج اختيارين على الأقل)', 'Add at least one step (multiple choice needs 2+ options)'));
      if (isNew) ST().push(s); else ST()[ST().findIndex(x => x.id === s.id)] = s;
      renumber(); log(`${isNew ? 'Created' : 'Edited'} station ${s.id} (${s.ar})`); save(); sc.remove(); toast('✓'); viewAdmin(); };
    $('[data-del]', box) && ($('[data-del]', box).onclick = (e) => { const b = e.currentTarget;
      if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = tx('اضغط مرة أخرى لتأكيد الحذف', 'Tap again to confirm'); b.classList.add('red'); b.style.color = '#fff'; return; }
      db.content = ST().filter(x => x.id !== s.id); renumber(); log(`Deleted station ${s.id} (${s.ar})`); save(); sc.remove(); toast('✓'); viewAdmin(); });
  };
  draw();
}
function adminAyat(ap) {
  const card = (k, nm) => `<div class="card stack"><h3>${esc(nm)}</h3><div class="row wrap">${(db.ayat[k] || []).map(a => `<span class="chip">${esc(Q.rangeLabel(a))} <button data-rm="${k}|${a}" aria-label="remove">${I('x', 'width=13')}</button></span>`).join('') || `<span class="tiny muted">${tx('لا آيات بعد', 'No verses yet')}</span>`}</div>
    <div class="picker"><label class="field"><span>${tx('السورة', 'Surah')}</span><select class="sel" data-su="${k}">${Q.SURAHS.map((s, i) => `<option value="${i + 1}" ${i === 1 ? 'selected' : ''}>${N(i + 1)} · ${AR() ? s[0] : s[1]}</option>`).join('')}</select></label>
      <label class="field"><span>${tx('من آية', 'From')}</span><select class="sel" data-fr="${k}"></select></label><label class="field"><span>${tx('إلى آية', 'To')}</span><select class="sel" data-to="${k}"></select></label>
      <button class="btn sm" data-ad="${k}">${I('plus')} ${t('add')}</button></div></div>`;
  ap.innerHTML = `<div class="grid g2 m1">${card('shared', t('shared'))}${Q.TEAMS.map(tm => card(tm.id, L(tm))).join('')}</div>
    <p class="small muted" style="margin-top:12px">${tx('اختر السورة ثم الآيات من… إلى… — الصوت بصوت الحصري يُضاف تلقائيًا لكل آية، وتظهر للطلاب في «القرآن».', 'Pick a surah, then the verses from… to… — Al-Husary audio is attached automatically and students see them in “Quran”.')}</p>`;
  const fill = (k) => { const n = Q.SURAHS[+$(`[data-su="${k}"]`).value - 1][2], fr = $(`[data-fr="${k}"]`), to = $(`[data-to="${k}"]`), f = Math.min(+fr.value || 1, n);
    fr.innerHTML = Array.from({ length: n }, (_, i) => `<option value="${i + 1}" ${i + 1 === f ? 'selected' : ''}>${N(i + 1)}</option>`).join('');
    const tv = Math.max(f, Math.min(+to.value || f, n)); to.innerHTML = Array.from({ length: n - f + 1 }, (_, i) => `<option value="${f + i}" ${f + i === tv ? 'selected' : ''}>${N(f + i)}</option>`).join(''); };
  ['shared', ...Q.TEAMS.map(x => x.id)].forEach(k => { fill(k); $(`[data-su="${k}"]`).onchange = () => { $(`[data-fr="${k}"]`).innerHTML = ''; $(`[data-to="${k}"]`).innerHTML = ''; fill(k); }; $(`[data-fr="${k}"]`).onchange = () => fill(k); });
  $$('[data-rm]').forEach(b => b.onclick = () => { const [k, a] = b.dataset.rm.split('|'); db.ayat[k] = db.ayat[k].filter(x => x !== a); log(`Removed ${a} from ${k}`); save(); adminAyat(ap); });
  $$('[data-ad]').forEach(b => b.onclick = () => { const k = b.dataset.ad, s = $(`[data-su="${k}"]`).value, f = $(`[data-fr="${k}"]`).value, to = $(`[data-to="${k}"]`).value;
    if (+to - +f > 39) return toast(tx('حد أقصى ٤٠ آية في المرة', 'Max 40 verses at a time'));
    const v = f === to ? `${s}:${f}` : `${s}:${f}-${to}`; db.ayat[k] = [...new Set([...(db.ayat[k] || []), v])]; log(`Added ${v} to ${k}`); save(); toast(Q.rangeLabel(v) + ' ✓'); adminAyat(ap); });
}
function adminDrive(ap) {
  const cfg = window.QCONFIG || {};
  ap.innerHTML = `<div class="grid g2 m1"><div class="card stack"><h3>${tx('الربط بدرايف المدرسة', 'School Drive connection')}</h3>
    <p class="small">${cfg.DRIVE_WEBAPP_URL ? `<span class="chip">${I('check')} ${tx('متصل', 'Connected')}</span>` : `<span class="chip o">${tx('غير متصل بعد — وضع العرض', 'Not connected yet — demo mode')}</span>`}</p>
    <p class="small muted">${tx('كل ملف يرفعه الطالب يذهب تلقائيًا إلى مجلد: الفريق ← الطالب ← المحطة، داخل درايف حساب المدرسة الخاص بك فقط.', "Every student upload is filed automatically as Team → Student → Station, inside your school account's Drive only.")}</p>
    ${cfg.DRIVE_ROOT_URL ? `<a class="btn" href="${esc(cfg.DRIVE_ROOT_URL)}" target="_blank" rel="noopener">${I('drive')} ${tx('افتح المجلد', 'Open folder')}</a>` : ''}</div>
    <div class="card"><h3>${tx('شكل المجلدات', 'Folder structure')}</h3><pre class="small" style="line-height:1.9;white-space:pre-wrap">Qualities/\n${Q.TEAMS.map(tm => `├─ ${L(tm)}/\n${db.students.filter(s => s.team === tm.id).slice(0, 2).map(s => `│  ├─ ${s.name}/\n│  │  ├─ ${tx('المحطة', 'Station')} 1/\n│  │  └─ Quran/`).join('\n')}\n│  └─ …`).join('\n')}</pre></div></div>`;
}
function adminAudit(ap) {
  ap.innerHTML = `<div class="card scroll"><table class="rt"><thead><tr><th>${tx('الوقت', 'Time')}</th><th>${tx('من', 'Who')}</th><th>${tx('ماذا', 'What')}</th></tr></thead><tbody>${db.audit.slice(0, 100).map(a => `<tr><td class="mono tiny" data-l="${tx('الوقت', 'Time')}">${esc(a.at)}</td><td class="small" data-l="${tx('من', 'Who')}">${esc(a.who)}</td><td class="small" data-l="${tx('ماذا', 'What')}">${esc(a.what)}</td></tr>`).join('')}</tbody></table></div>
    <button class="btn ghost sm" style="margin-top:12px" data-wipe>${tx('إعادة بيانات العرض', 'Reset demo data')}</button>`;
  $('[data-wipe]').onclick = () => { db = seed(); save(); toast('✓'); viewAdmin(); };
}

/* ---------------- help & install ---------------- */
function howTo() {
  const faq = AR() ? [['كيف أدخل؟', 'اكتب اسم المستخدم وكلمة المرور اللذين أعطاك إياهما مشرفك.'], ['كيف أحل محطة؟', 'من «رحلتي» اضغط المحطة المفتوحة. كل خطوة في صفحة، وكل ما تكتبه يُحفظ تلقائيًا. في النهاية اضغط «سلّم للمشرف».'],
    ['كيف أحفظ الآيات؟', 'من «القرآن»: استمع للحصري بالسرعة التي تناسبك وكرّر، ثم «احفظ» لإخفاء الكلمات تدريجيًا واستخدم عدّاد التكرار، ثم «سمّع» واضغط الميكروفون ثم «إيقاف» عند الانتهاء.'],
    ['التسميع لا يسمعني على الآيفون', 'تأكد أن «الإملاء» مفعّل: الإعدادات ← عام ← لوحة المفاتيح ← تفعيل الإملاء، واسمح لـ Safari بالميكروفون.'], ['أين تذهب ملفاتي؟', 'كل ملف ترفعه يُحفظ في مجلدك على درايف المدرسة، مرتّبًا حسب المحطة.'], ['نسيت كلمة المرور', 'كلّم مشرفك أو مسؤول المشروع، ويعيد ضبطها في ثوانٍ.']]
    : [['How do I sign in?', 'Use the username and password from your supervisor.'], ['How do I do a station?', 'Open Journey and tap the open station. One step per screen, everything saves automatically. Submit at the end.'],
    ['How do I memorize verses?', 'In Quran: listen to Al-Husary and repeat, then Memorize with the repetition counter, then Recite: tap the mic, recite, tap Stop.'], ['Recite does not hear me on iPhone', 'Turn on Dictation: Settings → General → Keyboard → Enable Dictation, and allow Safari to use the microphone.'], ['Where do my files go?', 'Into your folder on the school Drive, sorted by station.'], ['I forgot my password', 'Ask your supervisor or the project lead — instant reset.']];
  sheet(`<div class="stack"><h2>${t('howTo')}</h2>${faq.map(([q, a]) => `<details class="card flat"><summary>${q}</summary><p class="small muted">${a}</p></details>`).join('')}<button class="btn o block" data-ins>${I('phone')} ${t('install')}</button></div>`, s => $('[data-ins]', s).onclick = () => { s.remove(); install(); });
}
let deferredPrompt = null; addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
function install() {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; return; }
  sheet(`<div class="stack"><h2>${t('install')}</h2><p class="small muted">${tx('يعمل كتطبيق حقيقي بملء الشاشة، بدون متجر تطبيقات.', 'Works like a real full-screen app — no app store needed.')}</p>
  <h3>iPhone (Safari)</h3><ol class="steps-ios"><li>${tx('افتح الرابط في Safari', 'Open the link in Safari')}</li><li>${tx('اضغط زر المشاركة', 'Tap the Share button')} <span class="ios-share">${I('share', 'width=16')}</span></li><li>${tx('مرّر لأسفل واختر «إضافة إلى الشاشة الرئيسية»', 'Scroll and choose “Add to Home Screen”')}</li><li>${tx('اضغط «إضافة» — ستجد أيقونة Qualities بجانب تطبيقاتك', 'Tap “Add” — the Qualities icon appears next to your apps')}</li></ol>
  <h3>Android (Chrome)</h3><ol class="steps-ios"><li>${tx('اضغط القائمة ⋮ أعلى الشاشة', 'Tap the ⋮ menu')}</li><li>${tx('اختر «تثبيت التطبيق»', 'Choose “Install app”')}</li></ol><button class="btn block" data-close>OK</button></div>`);
}

/* ---------------- router ---------------- */
function go(h) { location.hash = h; }
function render() {
  document.documentElement.style.setProperty('--flip', AR() ? -1 : 1);
  const h = location.hash.slice(1) || '';
  if (!session || !me()) return viewLogin();
  if (player && !h.startsWith('quran')) player.pause(); if (recog && !h.startsWith('quran')) { recog.stop(); recog = null; }
  const r = session.role;
  if (r === 'student') {
    if (h.startsWith('station-')) viewStation(h.slice(8));
    else if (h.startsWith('quran')) viewQuran(h.length > 6 ? h.slice(6).replace('-', ':') : null);
    else ({ journey: viewJourney, portfolio: viewPortfolio, team: viewTeam }[h] || viewHome)();
  } else if (r === 'sup' || r === 'lead') viewReview(h.startsWith('review-') ? h.slice(7) : null);
  else if (r === 'principal') viewDash();
  else (h === 'dash' ? viewDash : viewAdmin)();
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-lang]')) setLang(AR() ? 'en' : 'ar');
  if (e.target.closest('[data-logout]')) { session = null; try { localStorage.removeItem('q_session'); sessionStorage.removeItem('q_session'); } catch {} location.hash = ''; render(); }
  if (e.target.closest('[data-howto]')) howTo();
  if (e.target.closest('[data-install]')) install();
});
addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
try { const l = localStorage.getItem('q_lang'); if (l) Q.lang = l; } catch {}
document.documentElement.lang = Q.lang; document.documentElement.dir = AR() ? 'rtl' : 'ltr';
render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
