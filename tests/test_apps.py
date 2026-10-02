"""
Behaviour tests for Duet and Khutbah Translator.

The browser's microphone (SpeechRecognition), translation and read-aloud are
replaced with fakes, so these tests run offline in headless Chromium and check
the app logic: hands-free listening, nothing lost after a full stop, take-turns
hand-over, and khutbah sentences being built from word-by-word pieces.

Run:  python3 tests/test_apps.py
Needs: pip install playwright  (and a Chromium that Playwright can launch)
"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DUET = (ROOT / "index.html").as_uri()
KHUTBAH = (ROOT / "khutbah.html").as_uri()

# Fake microphone. `PLAN` is a list of [delay_ms, text|null]; each recognition
# session delivers one final phrase (like Android does) and then ends.
FAKE_MIC = """
window.__spoken = []; window.__starts = []; let __k = 0;
const FakeRec = class {
  start(){ const me = this; window.__starts.push(this.lang); const it = (window.PLAN || [])[__k++] || [900, null];
    setTimeout(() => { if (me._stop) return;
      if (it[1]) { me.onresult({ resultIndex:0, results:[Object.assign([{ transcript: it[1] }], { isFinal:true })] }); setTimeout(() => !me._stop && me.onend(), 20); }
      else { me.onerror({ error:'no-speech' }); me.onend(); } }, it[0]); }
  stop(){ this._stop = true; setTimeout(() => this.onend(), 10); }
  abort(){ this._stop = true; setTimeout(() => this.onend(), 5); } };
Object.defineProperty(window, 'SpeechRecognition', { value: FakeRec, configurable:true, writable:true });
Object.defineProperty(window, 'webkitSpeechRecognition', { value: FakeRec, configurable:true, writable:true });
"""
FAKE_IO = """() => {
  window.translate = async t => '[' + t + ']';
  speechSynthesis.speak = u => { __spoken.push(u.text); setTimeout(() => u.onend && u.onend(), window.SPEAK_MS || 300); };
  speechSynthesis.cancel = () => {};
}"""

results = []
def check(name, ok, detail=""):
    results.append(ok)
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else f"  -> {detail}"))

async def page(browser, url, plan, extra=""):
    pg = await browser.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    await pg.add_init_script(f"window.PLAN = {plan};" + extra + FAKE_MIC)
    await pg.goto(url)
    await pg.wait_for_timeout(300)
    await pg.evaluate(FAKE_IO)
    return pg, errors

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()

        # 1. Duet: two sentences back to back are both captured (nothing lost after a full stop)
        pg, err = await page(b, DUET, "[[150,'I need the cement.'],[150,'Also send the sand.']]")
        await pg.click("#meMic"); await pg.wait_for_timeout(3000)
        got = await pg.evaluate("[...document.querySelectorAll('.msg.me .o')].map(e => e.textContent)")
        check("duet: back-to-back sentences captured", got == ["I need the cement.", "Also send the sand."], got)
        check("duet: no page errors", not err, err)
        await pg.close()

        # 2. Duet: speaking while the translation is read aloud is still captured (default 'keep listening')
        pg, err = await page(b, DUET, "[[150,'I need the cement.'],[2300,'Also send the sand.']]", "window.SPEAK_MS = 1500;")
        await pg.click("#meMic"); await pg.wait_for_timeout(6000)
        got = await pg.evaluate("[...document.querySelectorAll('.msg.me .o')].map(e => e.textContent)")
        check("duet: words said during read-aloud captured", len(got) == 2, got)
        await pg.close()

        # 3. Duet: Take turns hands the mic to the other person after a sentence + pause
        pg, err = await page(b, DUET, "[[150,'I need the cement.']]")
        await pg.click("#turnsBtn"); await pg.click("#meMic"); await pg.wait_for_timeout(4000)
        langs = await pg.evaluate("__starts")
        check("duet: take turns switches to the other language", "ar-SA" in langs, langs)
        await pg.close()

        # 4. Khutbah: word-by-word pieces become whole sentences, each spoken once
        plan = ("[[200,'الحمد لله'],[300,'رب العالمين'],[300,'نحمده ونستعينه'],[300,'ونستغفره'],"
                "[2200,'أوصيكم ونفسي'],[300,'بتقوى الله'],[300,'عز وجل']]")
        pg, err = await page(b, KHUTBAH, plan)
        await pg.click("#goBtn"); await pg.wait_for_timeout(7000)
        segs = await pg.evaluate("[...document.querySelectorAll('.seg .ar')].map(e => e.textContent)")
        spoken = await pg.evaluate("__spoken")
        check("khutbah: pieces joined into 2 sentences", segs == ["الحمد لله رب العالمين نحمده ونستعينه ونستغفره", "أوصيكم ونفسي بتقوى الله عز وجل"], segs)
        check("khutbah: each sentence spoken once", len(spoken) == 2, spoken)
        check("khutbah: no page errors", not err, err)
        await pg.close()

        await b.close()
    print(f"\n{sum(results)}/{len(results)} passed")
    sys.exit(0 if all(results) else 1)

asyncio.run(main())
