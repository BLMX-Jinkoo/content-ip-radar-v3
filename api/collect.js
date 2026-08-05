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
  },

  // --- AI 데이터·라이선싱 ---
  {
    category: "AI 데이터·라이선싱",
    query: '"AI data licensing" OR "training data licensing"'
  },
  {
    category: "AI 데이터·라이선싱",
    query: '"AI training data marketplace" OR "dataset marketplace"'
  },
  {
    category: "AI 데이터·라이선싱",
    query: '"AI content licensing deal" OR "data licensing agreement"'
  },
  {
    category: "AI 데이터·라이선싱",
    query: '"AI 학습데이터 라이선싱" OR "AI 학습데이터 거래"'
  },
  {
    category: "AI 데이터·라이선싱",
    query: '"AI 데이터 거래소" OR "데이터 라이선스 시장"'
  },
  {
    category: "AI 데이터·라이선싱",
    query: '"생성형 AI 학습데이터 저작권" OR "AI 데이터 보상"'
  },
  {
    category: "AI 데이터·라이선싱",
    query: '"AI 기본권" OR "인공지능 기본권"'
  },

  // --- 스톡 업계 ---
  {
    category: "스톡 업계",
    query: '"stock photography industry" OR "stock footage industry"'
  },
  {
    category: "스톡 업계",
    query: '"microstock contributors" OR "stock contributor earnings"'
  },
  {
    category: "스톡 업계",
    query: '"stock photography royalties" OR "contributor commission"'
  },
  {
    category: "스톡 업계",
    query: '"Getty Images" AND (AI OR licensing OR contributors)'
  },
  {
    category: "스톡 업계",
    query: 'Shutterstock AND (AI OR licensing OR contributors)'
  },
  {
    category: "스톡 업계",
    query: '"Adobe Stock" AND (AI OR contributors OR policy)'
  },
  {
    category: "스톡 업계",
    query: '(iStock OR Alamy OR Pond5) AND (contributors OR licensing OR commission)'
  },
  {
    category: "스톡 업계",
    query: '"Getty Shutterstock merger" OR "stock media acquisition"'
  },

  // --- 포럼·커뮤니티 ---
  {
    category: "포럼·커뮤니티",
    query: 'site:microstockgroup.com (Shutterstock OR Getty OR Adobe OR Pond5 OR Alamy OR AI)'
  },
  {
    category: "포럼·커뮤니티",
    query: 'site:community.adobe.com/stock-contributors (AI OR sales OR review OR policy)'
  },
  {
    category: "포럼·커뮤니티",
    query: '"microstock forum" contributors'
  },
  {
    category: "포럼·커뮤니티",
    query: '"stock footage contributors" forum'
  },

  // --- 한국 AI 영상시장 ---
  {
    category: "한국 AI 영상시장",
    query: '"한국 AI 영상 제작" OR "국내 AI 영상 제작"'
  },
  {
    category: "한국 AI 영상시장",
    query: '"생성형 AI 영상 제작 시장" OR "AI 영상 제작사"'
  },
  {
    category: "한국 AI 영상시장",
    query: '"AI 광고 제작" OR "AI 영화 제작" OR "AI 방송 제작"'
  },
  {
    category: "한국 AI 영상시장",
    query: '(Sora OR Veo OR Runway OR Kling) AND (한국 OR 국내)'
  },
  {
    category: "한국 AI 영상시장",
    query: '"AI 영상 공모전" OR "AI 영화제" OR "AI 콘텐츠 제작"'
  }
];

// 제목·요약에 아래 단어가 하나도 없으면 검색 주제와 무관한 오탐으로 간주합니다.
const ON_TOPIC_TERMS = [
  "ai", "인공지능", "생성형",
  "저작권", "copyright",
  "라이선", "license", "licens",
  "데이터", "dataset", "학습데이터", "training data",
  "거래소", "marketplace",
  "기본권",
  "stock photo", "stock footage", "microstock", "stock media",
  "contributor", "기여자", "크리에이터",
  "getty", "shutterstock", "adobe", "istock", "alamy", "pond5",
  "royalt", "커미션", "commission", "정산",
  "merger", "acquisition", "인수", "합병",
  "forum", "포럼", "커뮤니티",
  "영상 제작", "영상제작", "콘텐츠", "제작사",
  "미리캔버스", "캔바", "canva",
  "elevenlabs",
  "카메라", "촬영", "장비",
  "sora", "veo", "runway", "kling",
  "영화제", "공모전"
];

// 명백히 무관한 일반 증시·여행·스포츠·부동산 기사를 걸러내는 차단어입니다.
const OFF_TOPIC_TERMS = [
  "코스피", "코스닥", "나스닥지수", "다우존스",
  "환율 전망", "금리 인상", "금리 인하",
  "공시지가", "아파트 시세", "부동산 시세", "청약 경쟁률",
  "여행상품", "패키지여행", "관광지 추천", "항공권 할인", "호텔 예약",
  "프로야구", "월드컵 조편성", "올림픽 메달", "축구 국가대표", "프리미어리그"
];

function isRelevant(article) {
  const haystack = `${article.title} ${article.summary}`.toLowerCase();

  if (OFF_TOPIC_TERMS.some(term => haystack.includes(term.toLowerCase()))) {
    return false;
  }

  return ON_TOPIC_TERMS.some(term => haystack.includes(term.toLowerCase()));
}

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
  const search = encodeURIComponent(`${query} when:3d`);

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

function parseForumThreads(html) {
  const linkPattern = /<a[^>]+href="([^"]*viewtopic\.php[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set();
  const threads = [];
  let match;

  while ((match = linkPattern.exec(html))) {
    const href = match[1];
    const title = stripHtml(match[2]);

    if (!title || title.length < 4 || seen.has(href)) {
      continue;
    }

    seen.add(href);

    const url = href.startsWith("http")
      ? href
      : `https://www.microstockgroup.com/${href.replace(/^\.?\//, "")}`;

    // 공식 인기순 데이터가 없어 "포럼 최신글"로만 표시합니다.
    threads.push({
      title: title.slice(0, 500),
      url: url.slice(0, 2000),
      source: "MicrostockGroup 포럼",
      summary: "MicrostockGroup 포럼 최신글입니다.",
      category: "포럼·커뮤니티",
      keywords: ["microstockgroup forum"],
      image_url: null,
      published_at: null
    });

    if (threads.length >= 15) {
      break;
    }
  }

  return threads;
}

async function collectForumThreads() {
  const response = await fetch("https://www.microstockgroup.com/", {
    headers: {
      "User-Agent": "Content-IP-Radar/1.0"
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`MicrostockGroup 응답 오류: ${response.status}`);
  }

  const html = await response.text();
  return parseForumThreads(html);
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
    // 소스별 실패가 전체 수집을 막지 않도록 각각 격리해서 실행합니다.
    const tasks = [
      ...FEEDS.map(feed => collectFeed(feed)),
      collectForumThreads()
    ];

    const results = await Promise.allSettled(tasks);

    const rawCollected = results
      .filter(result => result.status === "fulfilled")
      .flatMap(result => result.value);

    const relevant = rawCollected.filter(isRelevant);
    const excludedCount = rawCollected.length - relevant.length;

    const uniqueByUrl = new Map();

    relevant.forEach(article => {
      if (!uniqueByUrl.has(article.url)) {
        uniqueByUrl.set(article.url, article);
      }
    });

    const articles = [...uniqueByUrl.values()].slice(0, 150);
    const failedFeeds = results.filter(
      result => result.status === "rejected"
    ).length;

    if (!articles.length) {
      return res.status(502).json({
        success: false,
        error: "수집된 기사가 없습니다.",
        failedFeeds,
        excludedCount
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
        failedFeeds,
        excludedCount
      });
    }

    return res.status(200).json({
      success: true,
      collected: articles.length,
      saved: Array.isArray(saveData) ? saveData.length : 0,
      failedFeeds,
      excludedCount
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
