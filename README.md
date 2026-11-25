# Qualities — مشروع الصفات والسعادة

A mobile-first app for GPIS students to install on their phones. It has four portals: **Student**, **Supervisor**, **Principal** and **Owner**.
It has no build step: just static files that Vercel hosts for free.

## Status
- **Demo mode (now):** everything works using sample data stored in each browser. This is ideal for the principal pitch.
  Demo logins are on the sign-in screen, or use `student1 / Sun2026`, `mona / Mona#2026`, `principal / Principal#2026` and `admin / Owner#2026`.
- **Drive uploads:** start working as soon as you paste your Apps Script URL into `config.js` (see step 3).
- **Shared live data (phase 2):** this means real accounts and one database for everyone. Run `backend/schema.sql` on your own Supabase project. I will then connect `js/api.js` to it.

## 1. Put it on GitHub (2 min)
1. On github.com, signed in as **scottbrash910**, click **New repository**, name it `qualities-app`, choose Private, then click Create.
2. Click **uploading an existing file**, drag in **everything inside this folder**, and click Commit.

## 2. Deploy on Vercel (2 min, like EquiCare)
1. On vercel.com, click **Add New… → Project**, then **Import** `qualities-app`.
2. Set Framework Preset to **Other**. Leave Build Command and Output **empty**. Click **Deploy**.
3. Optional: under Settings → Domains, add a nicer name such as `qualities-gpis.vercel.app`.

## 3. Connect your school Drive (5 min, school account only)
1. Sign in to Google with the **school account**. Open script.google.com, click **New project**, and paste `backend/Code.gs`.
2. Choose `setup` in the toolbar and click **Run**. Approve the access request. The log will print the link to the new **Qualities** folder.
3. Click **Deploy → New deployment → Web app**. Set Execute as: **Me** and Who has access: **Anyone**. Then copy the URL.
4. Open `config.js` and paste the URL into `DRIVE_WEBAPP_URL` and the folder link into `DRIVE_ROOT_URL`. Commit the change, and Vercel redeploys automatically.
   > If the school's Google admin blocks "Anyone" for web apps, ask IT to allow it for this one script.
   > Uploads go only to this account, and your colleague's system is never involved.

## 4. Install on a phone
- **iPhone:** open the link in **Safari**, tap Share, then **Add to Home Screen**.
- **Android:** open it in Chrome, tap ⋮, then **Install app**.

## Notes
- Quran text comes from api.alquran.cloud (Uthmani script). Al-Husary audio comes from everyayah.com, and once a verse has been played it is cached for offline listening.
- Recite & Check uses the phone's built-in speech recognition (Safari on iOS 14.5+ or Chrome). It checks words and their order, not tajweed. Recordings are saved so supervisors can grade tajweed.
- Every time a password is viewed or reset in the Owner panel, it is written to the audit log.
- Bump `VERSION` in `sw.js` on every deploy so installed phones pick up the update.
