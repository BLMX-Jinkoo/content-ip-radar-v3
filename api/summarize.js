// Vercel 서버리스 함수: 수집된 헤드라인으로 주간/월간 AI 브리핑을 생성합니다.
// Vercel 프로젝트 설정 → Environment Variables 에 아래 중 하나를 등록하세요.
//   ANTHROPIC_API_KEY : Claude API 키 (console.anthropic.com)
//   GEMINI_API_KEY    : Google Gemini API 키 (aistudio.google.com — 무료 등급 있음)
// 둘 다 있으면 Claude를 먼저 시도합니다.

function buildPrompt(periodLabel, items) {
  const list = items
    .map((i) => `- [${i.category}] ${i.title} (${i.source})`)
    .join("\n");
  return (
    `당신은 콘텐츠 IP·스톡 미디어·AI 권리 분야의 전문 애널리스트입니다.\n` +
    `아래는 최근 ${periodLabel} 동안 수집된 뉴스 헤드라인 목록입니다.\n\n` +
    list +
    `\n\n위 헤드라인을 바탕으로 한국어 ${periodLabel} 브리핑을 작성하세요. 구성:\n` +
    `1) **이번 ${periodLabel} 총평** — 한두 문장\n` +
    `2) **분야별 핵심 흐름** — 중요한 흐름 4~6개를 불릿(-)으로, 각 1~2문장\n` +
    `3) **시사점** — 콘텐츠 IP 라이선싱/아카이브 수익화 종사자 관점의 시사점 2~3가지\n` +
    `담백하고 전문적인 톤으로, 전체 1,000자 이내. 헤드라인에 없는 사실은 지어내지 마세요.`
  );
}

async function callClaude(key, prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error("claude " + r.status);
  const d = await r.json();
  return (d.content || []).map((c) => c.text || "").join("");
}

async function callGemini(key, prompt) {
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!r.ok) throw new Error("gemini " + r.status);
  const d = await r.json();
  const parts = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
  return parts.map((p) => p.text || "").join("");
}

module.exports = async (req, res) => {
  try {
    let body = req.body;
    if (!body || typeof body === "string") {
      try { body = JSON.parse(body || "{}"); } catch (e) { body = {}; }
    }
    const periodLabel = body.period === "month" ? "1개월" : "1주";
    const items = Array.isArray(body.items)
      ? body.items.slice(0, 150).map((i) => ({
          category: String(i.category || "").slice(0, 30),
          title: String(i.title || "").slice(0, 200),
          source: String(i.source || "").slice(0, 60),
        }))
      : [];

    if (!items.length) {
      res.status(400).json({ error: "no_items" });
      return;
    }

    const prompt = buildPrompt(periodLabel, items);
    const anth = process.env.ANTHROPIC_API_KEY;
    const gem = process.env.GEMINI_API_KEY;

    if (!anth && !gem) {
      res.status(503).json({ error: "no_key" });
      return;
    }

    let text = null;
    let engine = null;
    if (anth) {
      try { text = await callClaude(anth, prompt); engine = "Claude"; } catch (e) { /* Gemini로 */ }
    }
    if (!text && gem) {
      try { text = await callGemini(gem, prompt); engine = "Gemini"; } catch (e) { /* 실패 */ }
    }

    if (!text) {
      res.status(502).json({ error: "call_failed" });
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ text: text.trim(), engine });
  } catch (e) {
    res.status(500).json({ error: (e && e.message) || "unknown" });
  }
};
