/* Offline shell. Bump VERSION on every deploy so phones pick up the new app. */
const VERSION = 'qualities-v1';
const SHELL = ['./', 'index.html', 'css/app.css', 'config.js', 'js/i18n.js', 'js/icons.js', 'js/data.js', 'js/quran.js', 'js/api.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/gpis-logo.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin === location.origin) e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
  else if (u.hostname.endsWith('everyayah.com')) e.respondWith(caches.open('husary').then(c => c.match(e.request).then(m => m || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
});
