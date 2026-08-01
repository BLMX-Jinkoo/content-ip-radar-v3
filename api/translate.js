// Vercel 서버리스 함수: 영문 텍스트를 한글로 자동 번역합니다.
// 여러 문장을 한 번에 묶어 처리해서 속도를 높입니다.
async function gtx(text, tl) {
  const u =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
    tl +
    "&dt=t&q=" +
    encodeURIComponent(text);
  const r = await fetch(u, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });
  if (!r.ok) throw new Error("upstream " + r.status);
  const data = await r.json();
  return (data[0] || []).map((s) => (s && s[0]) || "").join("");
}

module.exports = async (req, res) => {
  try {
    let body = req.body;
    if (!body || typeof body === "string") {
      try { body = JSON.parse(body || "{}"); } catch (e) { body = {}; }
    }
    const texts = Array.isArray(body.texts)
      ? body.texts.slice(0, 80).map((t) => String(t).slice(0, 400))
      : [];
    const tl = body.tl === "en" ? "en" : "ko";

    if (!texts.length) {
      res.status(400).json({ error: "no texts" });
      return;
    }

    // 1차: 줄바꿈으로 묶어서 한 번에 번역 (빠름)
    let out = null;
    try {
      const joined = texts.join("\n");
      const translated = await gtx(joined, tl);
      const parts = translated.split("\n");
      if (parts.length === texts.length) out = parts.map((p) => p.trim());
    } catch (e) { /* 2차 방식으로 넘어감 */ }

    // 2차: 묶음이 어긋나면 하나씩 번역 (느리지만 확실)
    if (!out) {
      out = [];
      for (const t of texts) {
        try { out.push((await gtx(t, tl)).trim()); }
        catch (e) { out.push(t); }
      }
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ texts: out });
  } catch (e) {
    res.status(500).json({ error: (e && e.message) || "unknown" });
  }
};
