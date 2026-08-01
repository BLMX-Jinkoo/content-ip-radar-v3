// Vercel 서버리스 함수: 구글 뉴스 RSS를 대신 가져다 주는 우체부 역할
// (브라우저가 구글 뉴스에 직접 접근하면 차단되기 때문에, 이 함수가 중간에서 전달합니다)
module.exports = async (req, res) => {
  try {
    const q = (req.query.q || "New York Knicks").toString().slice(0, 200);
    const lang = req.query.lang === "ko" ? "ko" : "en";

    const url =
      lang === "ko"
        ? `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`
        : `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

    const r = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!r.ok) {
      res.status(502).send("upstream error: " + r.status);
      return;
    }

    const xml = await r.text();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    // 10분간 결과를 캐시해서 속도를 높이고 구글 차단을 예방
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).send("error: " + (e && e.message ? e.message : "unknown"));
  }
};
