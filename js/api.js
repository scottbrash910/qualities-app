/* Bridge to your own backend. In demo mode (empty config) this does nothing and the app keeps data in the browser.
   Live mode: uploads go to your Apps Script, which files them as Team → Student → Station in YOUR school Drive. */
window.Q = window.Q || {};
Q.api = (() => {
  const C = window.QCONFIG || {};
  const live = !!C.DRIVE_WEBAPP_URL;
  const toB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  async function upload(file, ctx) {
    if (!live) return;
    const body = { team: ctx.team.ar, student: ctx.student.name, station: ctx.station?.n != null ? 'المحطة ' + ctx.station.n : 'عام',
      name: ctx.name || file.name || 'file', mime: file.type || 'application/octet-stream', data: await toB64(file) };
    // text/plain avoids a CORS preflight, which Apps Script cannot answer
    return fetch(C.DRIVE_WEBAPP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).then(r => r.json()).catch(() => null);
  }
  return { demo: !C.SUPABASE_URL, upload, push() {} };
})();
