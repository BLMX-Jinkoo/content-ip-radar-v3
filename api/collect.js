const FEEDS = [
  {
    category: "AI 정책·윤리",
    query: "AI 기본법"
  },
  {
    category: "AI 정책·윤리",
    query: "AI 저작권"
  },
  {
    category: "AI 정책·윤리",
    query: "AI copyright licensing"
  },
  {
    category: "글로벌 스톡",
    query: "Getty Images AI"
  },
  {
    category: "글로벌 스톡",
    query: "Shutterstock AI"
  },
  {
    category: "글로벌 스톡",
    query: "Adobe Firefly copyright"
  },
  {
    category: "국내 업계",
    query: "미리캔버스 AI"
  },
  {
    category: "국내 업계",
    query: "콘텐츠 IP 라이선싱"
  },
  {
    category: "AI 제작툴",
    query: "AI 영상 제작"
  },
  {
    category: "AI 제작툴",
    query: "ElevenLabs AI voice"
  },
  {
    category: "작가 커뮤니티",
    query: "stock photography contributors"
  },
  {
    category: "장비·제작",
    query: "카메라 영상 제작 신제품"
  }
];

function decodeXml(value = "") {
  const entities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " "
  };

  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, number) =>
      String.fromCodePoint(Number(number))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, number) =>
      String.fromCodePoint(parseInt(number, 16))
    )
    .replace(/&([a-z]+);/gi, (match, name) =>
      Object.prototype.hasOwnProperty.call(entities, name)
        ? entities[name]
        : match
    );
}

function stripHtml(value = "") {
  return decodeXml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(xml, tag) {
  const expression = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );

  const match = String(xml).match(expression);
  return match ? decodeXml(match[1]).trim() : "";
}

function googleNewsUrl(query) {
  const search = encodeURIComponent(`${query} when:2d`);

  return (
    `https://news.google.com/rss/search?q=${search}` +
    `&hl=ko&gl=KR&ceid=KR:ko`
  );
}

function parseItems(xml, feed) {
  const items = String(xml).match(/<item>[\s\S]*?<\/item>/gi) || [];

  return items.slice(0, 12).map(item => {
    let title = stripHtml(getTag(item, "title"));
    const source = stripHtml(getTag(item, "source")) || "Google News";
    const url = stripHtml(getTag(item, "link"));
    const description = stripHtml(getTag(item, "description"));
    const publishedValue = stripHtml(getTag(item, "pubDate"));
    const publishedDate = new Date(publishedValue);

    const sourceSuffix = ` - ${source}`;

    if (title.endsWith(sourceSuffix)) {
      title = title.slice(0, -sourceSuffix.length).trim();
    }

    let summary = description;

    if (summary.startsWith(title)) {
      summary = summary.slice(title.length).trim();
    }

    return {
      title: title.slice(0, 500),
      url: url.slice(0, 2000),
      source: source.slice(0, 200),
      summary: summary.slice(0, 3000),
      category: feed.category.slice(0, 100),
      keywords: [feed.query],
      image_url: null,
      published_at: Number.isNaN(publishedDate.getTime())
        ? null
        : publishedDate.toISOString()
    };
  }).filter(article => article.title && article.url);
}

async function collectFeed(feed) {
  const response = await fetch(googleNewsUrl(feed.query), {
    headers: {
      "User-Agent": "Content-IP-Radar/1.0"
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Google News 응답 오류: ${response.status}`);
  }

  const xml = await response.text();
  return parseItems(xml, feed);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "GET 요청만 허용됩니다."
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization;

  if (!supabaseUrl || !secretKey || !cronSecret) {
    return res.status(500).json({
      success: false,
      error: "서버 환경변수가 설정되지 않았습니다."
    });
  }

  if (authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({
      success: false,
      error: "자동수집 실행 권한이 없습니다."
    });
  }

  try {
    const results = await Promise.allSettled(
      FEEDS.map(feed => collectFeed(feed))
    );

    const collected = results
      .filter(result => result.status === "fulfilled")
      .flatMap(result => result.value);

    const uniqueByUrl = new Map();

    collected.forEach(article => {
      if (!uniqueByUrl.has(article.url)) {
        uniqueByUrl.set(article.url, article);
      }
    });

    const articles = [...uniqueByUrl.values()].slice(0, 100);
    const failedFeeds = results.filter(
      result => result.status === "rejected"
    ).length;

    if (!articles.length) {
      return res.status(502).json({
        success: false,
        error: "수집된 기사가 없습니다.",
        failedFeeds
      });
    }

    const saveResponse = await fetch(
      `${supabaseUrl}/rest/v1/articles?on_conflict=url`,
      {
        method: "POST",
        headers: {
          apikey: secretKey,
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation"
        },
        body: JSON.stringify(articles),
        signal: AbortSignal.timeout(15000)
      }
    );

    const saveData = await saveResponse.json().catch(() => []);

    if (!saveResponse.ok) {
      return res.status(saveResponse.status).json({
        success: false,
        error: saveData,
        collected: articles.length,
        failedFeeds
      });
    }

    return res.status(200).json({
      success: true,
      collected: articles.length,
      saved: Array.isArray(saveData) ? saveData.length : 0,
      failedFeeds
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
