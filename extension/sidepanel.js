/* ---------- languages: [label, speech code, translate code, "tap to speak"] ---------- */
const LANGS = [
  ["English (India)","en-IN","en","Tap to speak"],
  ["English (US)","en-US","en","Tap to speak"],
  ["English (UK)","en-GB","en","Tap to speak"],
  ["العربية — Saudi","ar-SA","ar","اضغط وتحدث"],
  ["العربية — Egypt","ar-EG","ar","اضغط وتحدث"],
  ["العربية — UAE","ar-AE","ar","اضغط وتحدث"],
  ["हिन्दी — Hindi","hi-IN","hi","बोलने के लिए दबाएँ"],
  ["اردو — Urdu","ur-PK","ur","بولنے کے لیے دبائیں"],
  ["ಕನ್ನಡ — Kannada","kn-IN","kn","ಮಾತನಾಡಲು ಒತ್ತಿ"],
  ["മലയാളം — Malayalam","ml-IN","ml","സംസാരിക്കാൻ അമർത്തുക"],
  ["தமிழ் — Tamil","ta-IN","ta","பேச அழுத்தவும்"],
  ["తెలుగు — Telugu","te-IN","te","మాట్లాడటానికి నొక్కండి"],
  ["বাংলা — Bengali","bn-BD","bn","কথা বলতে চাপুন"],
  ["मराठी — Marathi","mr-IN","mr","बोलण्यासाठी दाबा"],
  ["नेपाली — Nepali","ne-NP","ne","बोल्न थिच्नुहोस्"],
  ["සිංහල — Sinhala","si-LK","si","කතා කිරීමට ඔබන්න"],
  ["Filipino","fil-PH","tl","Pindutin para magsalita"],
  ["Bahasa Indonesia","id-ID","id","Ketuk untuk bicara"],
  ["فارسی — Persian","fa-IR","fa","برای صحبت ضربه بزنید"],
  ["Türkçe — Turkish","tr-TR","tr","Konuşmak için dokunun"],
  ["Français — French","fr-FR","fr","Touchez pour parler"],
  ["Español — Spanish","es-ES","es","Toca para hablar"],
  ["Deutsch — German","de-DE","de","Zum Sprechen tippen"],
  ["Русский — Russian","ru-RU","ru","Нажмите, чтобы говорить"],
  ["中文 — Chinese","zh-CN","zh-CN","点按说话"],
];
const byCode = c => LANGS.find(l => l[1] === c) || LANGS[0];

const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const STOP = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>';
const SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

const $ = id => document.getElementById(id);
const store = {
  get(k, d){ try { const v = localStorage.getItem("duet."+k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v){ try { localStorage.setItem("duet."+k, JSON.stringify(v)); } catch {} }
};

const sides = {
  me:   { lang: store.get("me","en-IN"),   sel:$("meLang"),   big:$("meBig"),   sub:$("meSub"),   mic:$("meMic"),   form:$("meForm"),   input:$("meInput"),   spk:$("meSpk"),   last:null },
  them: { lang: store.get("them","ar-SA"), sel:$("themLang"), big:$("themBig"), sub:$("themSub"), mic:$("themMic"), form:$("themForm"), input:$("themInput"), spk:$("themSpk"), last:null },
};
const other = s => s === "me" ? "them" : "me";
const log = [];
let speakOn = store.get("speak", true);
let capOn = store.get("captions", false);

/* ---------- UI setup ---------- */
for (const key of ["me","them"]) {
  const s = sides[key];
  for (const [label, code] of LANGS) s.sel.add(new Option(label, code));
  s.sel.value = s.lang;
  s.sel.onchange = () => { s.lang = s.sel.value; store.set(key, s.lang); paintSide(key); };
  s.mic.innerHTML = MIC;
  s.spk.innerHTML = SPK;
  s.mic.title = byCode(s.lang)[3];
  s.mic.onclick = () => toggleListen(key);
  s.spk.onclick = () => { if (s.last) say(s.last.text, s.last.lang); };
  s.form.onsubmit = e => { e.preventDefault(); const t = s.input.value.trim(); if (t) { s.input.value = ""; handleUtterance(key, t); } };
  paintSide(key);
}
function paintSide(key){
  const s = sides[key], L = byCode(s.lang);
  s.mic.title = L[3];
  if (!s.last) { s.big.textContent = L[3]; s.big.classList.add("ph"); }
}
function setToggle(btn, on){ btn.setAttribute("aria-pressed", on ? "true" : "false"); }

setToggle($("speakBtn"), speakOn);
$("speakBtn").onclick = () => { speakOn = !speakOn; store.set("speak", speakOn); setToggle($("speakBtn"), speakOn); if (!speakOn) speechSynthesis.cancel(); };

function paintCaptions(){
  setToggle($("capBtn"), capOn);
  $("capNote").hidden = !capOn;
  if (capOn) $("capNote").textContent = capSite
    ? `Translating ${capSite} captions into ${byCode(sides.me.lang)[0]}. Keep captions turned on in the meeting.`
    : "Open your Google Meet, Teams or Zoom call in this browser and turn on captions there. Reload the meeting tab if it was already open.";
}
let capSite = "";
$("capBtn").onclick = () => { capOn = !capOn; store.set("captions", capOn); paintCaptions(); };
paintCaptions();

$("swapBtn").onclick = () => {
  const a = sides.me.lang; sides.me.lang = sides.them.lang; sides.them.lang = a;
  sides.me.sel.value = sides.me.lang; sides.them.sel.value = sides.them.lang;
  store.set("me", sides.me.lang); store.set("them", sides.them.lang);
  paintSide("me"); paintSide("them"); paintCaptions();
};
$("clearBtn").onclick = () => {
  log.length = 0;
  $("log").querySelectorAll(".msg").forEach(n => n.remove());
  $("empty").hidden = false;
  for (const k of ["me","them"]) { const s = sides[k]; s.last = null; s.sub.textContent = ""; paintSide(k); }
};
$("saveBtn").onclick = () => {
  if (!log.length) return;
  const lines = log.map(m => `[${m.time}] ${m.label} (${m.from}): ${m.text}\n          → (${m.to}): ${m.translation}`);
  const blob = new Blob(["Duet Translator — conversation\n" + new Date().toLocaleString() + "\n\n" + lines.join("\n\n") + "\n"], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "conversation-" + new Date().toISOString().slice(0,16).replace(/[:T]/g,"-") + ".txt";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

/* ---------- microphone permission ---------- */
function showBanner(html){ $("banner").innerHTML = html; $("banner").hidden = false; }
function openPermission(){ chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") }); }
async function micGranted(){
  try { return (await navigator.permissions.query({ name: "microphone" })).state === "granted"; }
  catch { return true; }
}
function askForMic(){
  showBanner('Chrome needs your permission to use the microphone. <button id="permBtn">Allow microphone</button>');
  $("permBtn").onclick = openPermission;
}
(async () => {
  try {
    const p = await navigator.permissions.query({ name: "microphone" });
    if (p.state !== "granted") askForMic();
    p.onchange = () => { if (p.state === "granted") $("banner").hidden = true; else askForMic(); };
  } catch {}
})();

/* ---------- speech recognition ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) showBanner("Voice input isn't available in this browser. Typing and meeting captions still work.");
let rec = null, recSide = null;

async function toggleListen(key){
  if (!SR) return;
  if (rec) { const was = recSide; rec.stop(); if (was === key) return; }
  if (!(await micGranted())) { askForMic(); openPermission(); return; }
  speechSynthesis.cancel();
  const s = sides[key];
  const r = new SR();
  r.lang = s.lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  let finalText = "";
  rec = r; recSide = key;
  s.mic.classList.add("live"); s.mic.innerHTML = STOP;
  s.big.classList.remove("ph"); s.big.textContent = "…"; s.sub.textContent = "";
  r.onresult = e => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t; else interim += t;
    }
    s.big.textContent = (finalText + " " + interim).trim() || "…";
  };
  r.onerror = e => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") { askForMic(); return; }
    const msg = {
      "no-speech":"Didn't hear anything. Tap the mic and try again.",
      "network":"Voice recognition needs an internet connection.",
      "language-not-supported":"Speech in this language isn't supported here. Type instead.",
      "audio-capture":"No microphone found."
    }[e.error];
    if (msg) s.sub.textContent = msg;
  };
  r.onend = () => {
    s.mic.classList.remove("live"); s.mic.innerHTML = MIC;
    if (rec === r) { rec = null; recSide = null; }
    const t = finalText.trim();
    if (t) handleUtterance(key, t);
    else if (!s.last) paintSide(key);
  };
  try { r.start(); } catch { s.mic.classList.remove("live"); s.mic.innerHTML = MIC; rec = null; recSide = null; }
}

/* ---------- translation ---------- */
async function translate(text, from, to, fallbackFrom){
  if (from === to) return text;
  try {
    const u = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=" + encodeURIComponent(from) +
              "&tl=" + encodeURIComponent(to) + "&q=" + encodeURIComponent(text);
    const r = await fetch(u);
    if (r.ok) {
      const j = await r.json();
      const out = (j[0] || []).map(p => p[0]).join("").trim();
      if (out) return out;
    }
  } catch {}
  try {
    const src = (from === "auto" ? fallbackFrom : from).split("-")[0];
    const u = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text.slice(0, 480)) +
              "&langpair=" + encodeURIComponent(src) + "|" + encodeURIComponent(to.split("-")[0]);
    const r = await fetch(u);
    if (r.ok) {
      const j = await r.json();
      const out = j && j.responseData && j.responseData.translatedText;
      if (out && j.responseStatus == 200) return out;
    }
  } catch {}
  throw new Error("Translation failed. Check the internet connection and try again.");
}

/* ---------- text-to-speech ---------- */
let voices = [];
function loadVoices(){ try { voices = speechSynthesis.getVoices(); } catch {} }
loadVoices(); speechSynthesis.onvoiceschanged = loadVoices;
function say(text, lang){
  if (!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  const base = lang.split("-")[0];
  u.voice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.replace("_","-").startsWith(base)) || null;
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

/* ---------- log bubbles ---------- */
function addBubble(kind, label, original){
  $("empty").hidden = true;
  const el = document.createElement("div");
  el.className = "msg " + kind;
  const time = new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  el.innerHTML = '<span class="o" dir="auto"></span><span class="t" dir="auto">…</span><span class="m"><span></span><button type="button" hidden>Copy</button></span>';
  el.querySelector(".o").textContent = original;
  el.querySelector(".m span").textContent = label + " · " + time;
  $("log").appendChild(el); $("log").scrollTop = $("log").scrollHeight;
  return { el, time };
}
function fillBubble(el, translation){
  el.querySelector(".t").textContent = translation;
  const b = el.querySelector(".m button");
  b.hidden = false;
  b.onclick = async () => {
    try { await navigator.clipboard.writeText(translation); b.textContent = "Copied"; setTimeout(() => b.textContent = "Copy", 1500); }
    catch { b.textContent = "Copy failed"; }
  };
  $("log").scrollTop = $("log").scrollHeight;
}
function failBubble(el, message){
  el.classList.add("err");
  el.querySelector(".t").textContent = message;
}

/* ---------- one spoken/typed turn ---------- */
async function handleUtterance(key, text){
  const s = sides[key], o = sides[other(key)];
  const fromL = byCode(s.lang), toL = byCode(o.lang);
  s.big.classList.remove("ph"); s.big.textContent = text; s.sub.textContent = "";
  o.big.classList.remove("ph"); o.big.textContent = "…"; o.sub.textContent = "";
  const label = key === "me" ? "You" : "Them";
  const { el, time } = addBubble(key, label, text);
  try {
    const tr = await translate(text, fromL[2], toL[2]);
    fillBubble(el, tr);
    o.big.textContent = tr;
    o.sub.textContent = (key === "me" ? "You said" : "They said") + ": " + text;
    s.sub.textContent = "→ " + tr;
    o.last = { text: tr, lang: o.lang };
    s.last = { text, lang: s.lang };
    log.push({ label, time, from: fromL[0], to: toL[0], text, translation: tr });
    if (speakOn) { speechSynthesis.cancel(); say(tr, o.lang); }
  } catch (err) {
    failBubble(el, err.message);
    o.big.textContent = "—"; o.sub.textContent = err.message;
  }
}

/* ---------- meeting captions ---------- */
const norm = t => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
let capQueue = Promise.resolve();
chrome.runtime.onMessage.addListener(msg => {
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "duet-caption-ready") { capSite = msg.site; paintCaptions(); return; }
  if (msg.type !== "duet-caption" || !capOn) return;
  capSite = msg.site; paintCaptions();
  capQueue = capQueue.then(() => handleCaption(msg)).catch(() => {});
});
async function handleCaption({ site, speaker, text }){
  const me = sides.me;
  const toL = byCode(me.lang);
  let tr;
  try { tr = await translate(text, "auto", toL[2], byCode(sides.them.lang)[2]); }
  catch (err) { const { el } = addBubble("cap", speaker || site, text); failBubble(el, err.message); return; }
  if (norm(tr) === norm(text)) return;            // already in your language (usually your own lines)
  const label = (speaker || "Them") + " · " + site;
  const { el, time } = addBubble("cap", label, text);
  fillBubble(el, tr);
  me.big.classList.remove("ph"); me.big.textContent = tr;
  me.sub.textContent = (speaker || "They") + " said: " + text;
  me.last = { text: tr, lang: me.lang };
  log.push({ label, time, from: "caption", to: toL[0], text, translation: tr });
  if (speakOn) say(tr, me.lang);
}
