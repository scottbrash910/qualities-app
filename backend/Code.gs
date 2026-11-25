/**
 * Qualities — Drive organizer (Google Apps Script). Runs under YOUR school Google account only.
 * Every upload is filed as:  Qualities / <Team> / <Student> / <Station> / file
 *
 * Setup (5 minutes):
 *  1. Signed in as the school account, open https://script.google.com → New project → paste this file.
 *  2. Run `setup` once (approve the Drive permission). It creates the "Qualities" root folder and prints its link.
 *  3. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy.
 *  4. Copy the Web app URL into config.js → DRIVE_WEBAPP_URL, and the folder link into DRIVE_ROOT_URL.
 *  5. Optional: set SHARED_SECRET below and the same value in config.js to block random uploads.
 */
const ROOT_NAME = 'Qualities';
const MAX_MB = 45;              // Apps Script request limit is ~50 MB
const SHARED_SECRET = '';       // optional

function setup() {
  const root = getRoot_();
  Logger.log('Root folder: ' + root.getUrl());
}

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (SHARED_SECRET && b.secret !== SHARED_SECRET) return json_({ ok: false, error: 'forbidden' });
    const bytes = Utilities.base64Decode(b.data);
    if (bytes.length > MAX_MB * 1024 * 1024) return json_({ ok: false, error: 'too_big' });
    const folder = path_([clean_(b.team), clean_(b.student), clean_(b.station || 'عام')]);
    const stamp = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd HHmm');
    const file = folder.createFile(Utilities.newBlob(bytes, b.mime || 'application/octet-stream', stamp + ' — ' + clean_(b.name)));
    return json_({ ok: true, id: file.getId(), url: file.getUrl(), folder: folder.getUrl() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() { return json_({ ok: true, service: 'Qualities Drive organizer' }); }

function getRoot_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('ROOT_ID');
  if (id) try { return DriveApp.getFolderById(id); } catch (e) {}
  const it = DriveApp.getFoldersByName(ROOT_NAME);
  const root = it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_NAME);
  props.setProperty('ROOT_ID', root.getId());
  return root;
}
function path_(parts) {
  let f = getRoot_();
  parts.forEach(p => { const it = f.getFoldersByName(p); f = it.hasNext() ? it.next() : f.createFolder(p); });
  return f;
}
function clean_(s) { return String(s || '').replace(/[\\/:*?"<>|]/g, '-').trim().slice(0, 120) || 'بدون اسم'; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
