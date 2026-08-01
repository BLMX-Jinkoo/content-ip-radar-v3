// Vercel 서버리스 함수: 허용된 뉴스 사이트의 RSS를 대신 가져다 줍니다.
// (아무 주소나 중계해주면 악용될 수 있어서, 허용 목록에 있는 곳만 통과시킵니다)
const ALLOWED_HOSTS = [
  "news.google.com",
  "www.bing.com",
  "bing.com",
  "nypost.com",
  "www.postingandtoasting.com",
  "www.reddit.com",
  "reddit.com",
  "old.reddit.com",
  "sports.yahoo.com",
  "www.espn.com",
  "www.microstockgroup.com",
  "microstockgroup.com",
  "petapixel.com",
  "www.petapixel.com",
];

module.exports = async (req, res) => {
  try {
    const target = (req.query.url || "").toString();
    let host;
    try {
      host = new URL(target).hostname;
    } catch (e) {
      res.status(400).send("bad url");
      return;
    }
    if (!ALLOWED_HOSTS.includes(host)) {
      res.status(403).send("host not allowed: " + host);
      return;
    }

    const r = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
    });

    if (!r.ok) {
      res.status(502).send("upstream error: " + r.status);
      return;
    }

    const xml = await r.text();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).send("error: " + (e && e.message ? e.message : "unknown"));
  }
};
