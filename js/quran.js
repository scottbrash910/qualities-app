/* Recitation studio engine: text (alquran.cloud), audio (EveryAyah, Al-Husary), memorize, recite & check. */
window.Q = window.Q || {};
Q.Quran = (() => {
  const API = 'https://api.alquran.cloud/v1/ayah/';
  const AUDIO = { normal: 'https://everyayah.com/data/Husary_128kbps/', teacher: 'https://everyayah.com/data/Husary_Muallim_128kbps/' };
  const cache = (() => { try { return JSON.parse(localStorage.getItem('q_ayat') || '{}'); } catch { return {}; } })();
  const pad = (n, l) => String(n).padStart(l, '0');
  const fileOf = (key) => { const [s, a] = key.split(':'); return pad(s, 3) + pad(a, 3) + '.mp3'; };

  async function text(key) {
    if (cache[key]) return cache[key];
    const [u, c] = await Promise.all(['quran-uthmani', 'quran-simple-clean'].map(ed => fetch(API + key + '/' + ed).then(r => r.json())));
    const v = { key, uthmani: u.data.text, clean: c.data.text, surah: u.data.surah.name, surahEn: u.data.surah.englishName, n: u.data.numberInSurah };
    // strip the Basmala the API prepends to the first verse of a surah
    if (v.n === 1 && u.data.surah.number !== 1) { v.uthmani = v.uthmani.replace(/^بِسْمِ\S*\s+\S+\s+\S+\s+\S+\s*/, ''); v.clean = v.clean.replace(/^بسم الله الرحمن الرحيم\s*/, ''); }
    cache[key] = v; try { localStorage.setItem('q_ayat', JSON.stringify(cache)); } catch {}
    return v;
  }

  /* Normalise Arabic so speech-to-text and the verse can be compared fairly */
  const norm = (s) => s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^ء-ي\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = (s) => norm(s).split(' ').filter(Boolean);
  const lev = (a, b) => { const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n);
    let p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
    return p[n]; };
  const similar = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length) >= 0.7 || (a.startsWith('ال') && similar(a.slice(2), b)) || (b.startsWith('ال') && a === b.slice(2));

  /* Greedy in-order alignment: each verse word is matched to the next heard word within a small window */
  function check(verseClean, heard) {
    const v = words(verseClean), h = words(heard); let j = 0;
    return v.map(w => { for (let k = j; k < Math.min(h.length, j + 4); k++) if (similar(w, h[k])) { j = k + 1; return true; } return false; });
  }

  /* Player: verse list, speed, repeat, gap */
  function player(onState) {
    const a = new Audio(); a.preload = 'auto';
    let list = [], i = 0, rep = 0, opts = { speed: 1, repeat: 1, gap: false, teacher: false }, playing = false, gapT = null;
    const src = () => (opts.teacher ? AUDIO.teacher : AUDIO.normal) + fileOf(list[i]);
    const emit = () => onState && onState({ i, rep, playing });
    function load() { a.src = src(); a.playbackRate = opts.speed; a.preservesPitch = true; }
    a.addEventListener('ended', () => {
      const wait = opts.gap ? Math.max(1500, a.duration * 1000 / opts.speed) : 250;
      gapT = setTimeout(() => {
        rep++;
        if (rep < opts.repeat) { a.currentTime = 0; a.play(); }
        else if (i < list.length - 1) { i++; rep = 0; load(); a.play(); }
        else { playing = false; i = 0; rep = 0; load(); }
        emit();
      }, wait);
    });
    a.addEventListener('error', () => { if (opts.teacher) { opts.teacher = false; load(); if (playing) a.play(); } });
    return {
      set(l) { list = l; i = 0; rep = 0; if (l.length) load(); emit(); },
      opt(o) { Object.assign(opts, o); a.playbackRate = opts.speed; if ('teacher' in o && list.length) { const t = a.currentTime; load(); a.currentTime = 0; if (playing) a.play(); } },
      play(at) { if (at != null && at !== i) { i = at; rep = 0; load(); } playing = true; a.play().catch(() => { playing = false; emit(); }); emit(); },
      pause() { playing = false; clearTimeout(gapT); a.pause(); emit(); },
      get playing() { return playing; }, get index() { return i; }
    };
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function listen(onText, onEnd) {
    if (!SR) return null;
    const r = new SR(); r.lang = 'ar-SA'; r.continuous = true; r.interimResults = true;
    let finalT = '';
    r.onresult = (e) => { let interim = ''; for (let k = e.resultIndex; k < e.results.length; k++) { const t = e.results[k][0].transcript; if (e.results[k].isFinal) finalT += ' ' + t; else interim += ' ' + t; } onText(finalT + ' ' + interim); };
    r.onend = () => onEnd && onEnd(finalT); r.onerror = () => {};
    r.start(); return r;
  }
  async function recorder() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return null;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream); const chunks = [];
    mr.ondataavailable = e => chunks.push(e.data); mr.start();
    return { stop: () => new Promise(res => { mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })); }; mr.stop(); }) };
  }
  const firstLetters = (uthmaniWord) => { const m = uthmaniWord.match(/^[^ء-يٱ]*[ء-يٱ][ؐ-ًؚ-ٰٟۖ-ۭ]*/); return (m ? m[0] : uthmaniWord.slice(0, 1)) + '…'; };
  return { text, player, check, listen, recorder, hasSR: !!SR, words, firstLetters, norm };
})();
