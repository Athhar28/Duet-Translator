DUET TRANSLATOR — Android app
=============================

Chrome on Android can't load extensions, so Duet runs on the phone as an installable web app.
Once installed it has its own home-screen icon and opens full screen like any other app.

It must be opened from an https:// link (Android only allows the microphone on secure sites),
so put the folder online once. Both options below are free.

OPTION A — GitHub Pages (permanent link)
1. On your computer, sign in at github.com (create a free account if needed).
2. Click "+" > New repository. Name it  duet , set it to Public, click Create repository.
3. Click "uploading an existing file". Drag in everything from this folder:
   index.html, manifest.webmanifest, sw.js and the icons folder. Click "Commit changes".
4. Open the repository's Settings > Pages. Under "Branch" choose  main  and  / (root), click Save.
5. After about a minute your link is ready:  https://YOUR-USERNAME.github.io/duet/

OPTION B — Netlify Drop
1. Go to app.netlify.com/drop and sign up free.
2. Drag this whole folder onto the page. You get a link like https://something.netlify.app

INSTALL ON THE PHONE
1. Open the link in Chrome on Android.
2. Tap "Install app" at the top of Duet, or Chrome menu (⋮) > "Install app" / "Add to Home screen".
3. Open Duet from the home screen. The first time you tap a mic, tap Allow.

USING IT
- Put the phone on the table between you. Tap "Face-to-face": the top half turns around so the
  person opposite can read their side.
- You tap the bottom mic and speak; they tap the top mic and speak. Each translation shows on the
  other half and is read aloud. Either side can type instead.
- The screen stays on while Duet is open.
- "Save" downloads the conversation as a text file.

LIMITS
- Needs internet (voice recognition and translation are online).
- Android does not let apps listen to phone or WhatsApp call audio. For calls, put the call on
  speaker and tap "Them" when the other person talks.
- Read-aloud uses the phone's voices. If a language is silent, install it in
  Settings > General management > Text-to-speech (Samsung) or
  Settings > System > Languages > Text-to-speech output (most other phones),
  and make sure "Speech Services by Google" is up to date in the Play Store.
