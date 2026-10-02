# Duet Translator — project notes for Claude

Live voice translation apps built for Athhar (Indian, based in Riyadh, KSA). He is not a
developer: explain changes in plain language, give click-by-click steps for anything he
must do himself, and keep replies short.

## What's here

| Path | What it is |
|---|---|
| `index.html` | **Duet** — two-way face-to-face translator (phone/desktop web app, installable PWA) |
| `khutbah.html` | **Khutbah Translator** — listens to the Arabic Friday khutbah and speaks a live Urdu/Hindi translation into earphones |
| `manifest.webmanifest`, `khutbah.webmanifest` | PWA manifests (one per app, so each installs separately) |
| `sw.js` | Service worker: caches the app shell for fast/offline start. **Bump `CACHE` (duet-vN) whenever any cached file changes**, or phones keep the old version |
| `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` | App icons — they live at the repo root (not in `icons/`); paths in HTML/manifests point here |
| `.nojekyll` | Needed: makes GitHub Pages publish files as-is |
| `extension/` | Chrome/Edge side-panel extension version of Duet (+ reads Meet/Teams/Zoom captions). Loaded unpacked via chrome://extensions. **Older logic**: lacks hands-free mode, full-sentence buffering and the settings sheet that `index.html` has |
| `docs/Duet_Android_Install_Guide.docx` | Picture guide for hosting on GitHub Pages and installing on Android |
| `tests/test_apps.py` | Headless behaviour tests with a fake microphone (see Testing) |

## Live site / deployment

- GitHub Pages, branch `main`, folder `/ (root)`.
  - Duet: https://athhar28.github.io/Duet-Translator/
  - Khutbah: https://athhar28.github.io/Duet-Translator/khutbah.html
- Any push to `main` redeploys in about 1 minute. Site files must stay at the repo root.
- Users must open the **https** link in **Google Chrome on Android**. Samsung Internet's speech
  recognition is weaker, and Android blocks the mic on `file://`.

## How the apps work (constraints that matter)

- Each app is one self-contained HTML file with inline CSS and JS. There's no build step and no
  framework. Keep it that way.
- Speech in: the Web Speech API (`webkitSpeechRecognition`), which needs Chrome and internet.
  Android behaves differently from desktop:
  - each session often ends after one phrase, even with `continuous = true`;
  - results can repeat the growing sentence ("hello", "hello how", …), so use `joinResults()`
    in Duet and the `lastFinal` de-dup in Khutbah;
  - there's an audible beep on every restart, and the page can't turn it off.
- Translation: `translate()` calls the free `translate.googleapis.com/translate_a/single?client=gtx`
  endpoint, falling back to MyMemory. There's no API key. Both are unofficial or free tiers and
  can be rate-limited.
- Speech out: `speechSynthesis`, using the voices installed on the phone. Urdu needs Urdu voice
  data from "Speech Services by Google". `voicesFor()` ranks exact-region matches and
  Google/neural voices first.
- Settings are kept per device in `localStorage`, with keys prefixed `duet.` and `khutbah.`.
  All reads and writes are wrapped in try/catch.
- Screen: Wake Lock keeps the screen on. Locking the phone stops the mic (an Android rule).
  Khutbah has a black "Dim" overlay instead.

### Duet (`index.html`) listening model
- Tap a mic once for hands-free mode. Each sentence ends after `pauseMs` of silence (Settings:
  Short 0.9 s / Normal 1.5 s / Long 2.5 s), and the mic restarts immediately.
- `handleUtterance()` is chained so translations run in order. Read-aloud goes through
  `speechQueue` / `pumpSpeech()` and waits until nobody is mid-sentence.
- `ttsMode`: `"keep"` (default) keeps the mic on during read-aloud so no words are lost. It can
  hear the speaker, so earphones are recommended. `"pause"` stops the mic while speaking.
- "Take turns" passes the mic to the other side after a sentence plus a pause.

### Khutbah (`khutbah.html`) listening model
- Recognised pieces are buffered with `addSegment()` and translated once per sentence by
  `flush()`, after a pause, at max words, or at sentence punctuation. Settings → "Translate in":
  short (0.9 s / 16 words), full (1.5 s / 32, the default), long (2.3 s / 50). While the imam is
  speaking, a grey live preview is re-translated on screen but not spoken.
- TTS queue `pumpTTS()`: when 2 or more items are waiting it speeds up, and at 3 or more it
  joins them so it doesn't fall behind the imam.
- Source dialect defaults to `ar-SA`. Targets are Urdu (Nastaliq font), Hindi and others.

## Testing

```
pip install playwright        # Chromium is preinstalled in Claude Code cloud sessions
python3 tests/test_apps.py    # expects 7/7 PASS
```
The fake microphone can't prove real-world accuracy. After any listening change, ask Athhar to
try it on his phone, and for Khutbah, at a real khutbah.

## Open ideas / known gaps
- Bring `extension/` up to date with `index.html` (hands-free, sentence buffering, settings).
- Better translation for Qur'anic and religious phrases, for example a glossary of common
  khutbah phrases with fixed Urdu renderings, or an LLM-based translator.
- Real-time translation is machine translation. Say so honestly; don't overpromise.
