// ---------------------------------------------------------------------------
// 수집 우선순위 정의
//   1. AI 사진·영상·스톡 (Getty/Shutterstock/Adobe Stock/미리디/통로이미지 등)
//   2. AI 데이터·라이선싱 (공공데이터·소버린 AI 포함)
//   3. AI 제작 화제작 (AI로 만든 영화·드라마·광고·유튜브 등)
//   4. 커뮤니티 (MicrostockGroup, Adobe Stock Contributor Community 등)
// ---------------------------------------------------------------------------

const CATEGORY_BY_PRIORITY = {
  1: "AI 사진·영상·스톡",
  2: "AI 데이터·라이선싱",
  3: "AI 제작 화제작",
  4: "커뮤니티"
};

// type: "news" (Google News) | "bing" (Bing 웹검색 RSS)
const FEEDS = [
  // ================= Priority 1: AI 사진·영상·스톡 =================
  { priority: 1, lang: "en", windowDays: 3, type: "news", query: "Getty Images AI" },
  { priority: 1, lang: "en", windowDays: 3, type: "news", query: "Shutterstock AI" },
  { priority: 1, lang: "en", windowDays: 3, type: "news", query: '"Adobe Stock" AI OR "Adobe Firefly"' },
  { priority: 1, lang: "en", windowDays: 3, type: "news", query: "(iStock OR Pond5) AND AI" },
  { priority: 1, lang: "ko", windowDays: 3, type: "news", query: "미리디 AI OR 미리캔버스 AI" },
  { priority: 1, lang: "ko", windowDays: 3, type: "news", query: "통로이미지 AI OR 클립아트코리아 AI OR 이미지투데이 AI" },
  { priority: 1, lang: "en", windowDays: 3, type: "news", query: '"stock photography" AI OR "stock footage" AI OR microstock AI' },
  { priority: 1, lang: "en", windowDays: 3, type: "news", query: "contributor royalty licensing stock AND AI" },
  { priority: 1, lang: "en", windowDays: 3, type: "news", query: '"AI image" OR "AI video" OR "generative video" OR "synthetic media"' },
  // 기업 공식 뉴스룸 (14일)
  { priority: 1, lang: "en", windowDays: 14, type: "news", query: "site:newsroom.gettyimages.com OR site:gettyimages.com" },
  { priority: 1, lang: "en", windowDays: 14, type: "news", query: "site:investor.shutterstock.com OR site:submit.shutterstock.com" },
  { priority: 1, lang: "en", windowDays: 14, type: "news", query: 'site:blog.adobe.com Firefly OR "Adobe Stock"' },
  { priority: 1, lang: "ko", windowDays: 14, type: "news", query: "site:miridih.com" },
  { priority: 1, lang: "ko", windowDays: 14, type: "news", query: "site:tongro.co.kr" },

  // ================= Priority 2: AI 데이터·라이선싱 =================
  { priority: 2, lang: "en", windowDays: 30, type: "news", query: '"AI training data licensing" OR "visual data licensing"' },
  { priority: 2, lang: "en", windowDays: 30, type: "news", query: '"dataset marketplace" OR "AI content licensing deal"' },
  { priority: 2, lang: "ko", windowDays: 30, type: "news", query: "AI 학습데이터 거래 OR AI 학습데이터 라이선싱" },
  { priority: 2, lang: "ko", windowDays: 30, type: "news", query: "데이터 거래소 OR 데이터 마켓플레이스" },
  { priority: 2, lang: "ko", windowDays: 30, type: "news", query: "공공데이터 AI 학습 활용" },
  { priority: 2, lang: "ko", windowDays: 30, type: "news", query: "소버린 AI OR 데이터 주권" },
  { priority: 2, lang: "ko", windowDays: 30, type: "news", query: "창작자 보상 OR 퍼블리시티권 AI" },
  // 정부·공공기관 공식 발표 (14일)
  { priority: 2, lang: "ko", windowDays: 14, type: "news", query: "site:msit.go.kr OR site:data.go.kr OR site:nia.or.kr OR site:kdata.or.kr AI 데이터" },
  { priority: 2, lang: "ko", windowDays: 14, type: "news", query: "site:copyright.or.kr OR site:mcst.go.kr OR site:korea.kr AI 저작권" },

  // ================= Priority 3: AI 제작 화제작 =================
  { priority: 3, lang: "en", windowDays: 3, type: "news", query: '"made with AI" film OR "short film" OR commercial' },
  { priority: 3, lang: "en", windowDays: 3, type: "news", query: '"AI generated" music video OR YouTube' },
  { priority: 3, lang: "en", windowDays: 3, type: "news", query: "AI film festival award winner" },
  { priority: 3, lang: "en", windowDays: 3, type: "news", query: '(Sora OR "Google Veo" OR Runway OR Kling OR "Adobe Firefly Video") film OR ad OR commercial' },
  { priority: 3, lang: "ko", windowDays: 3, type: "news", query: "AI 영화 OR AI 단편영화 OR AI 드라마 OR AI 광고 제작" },
  { priority: 3, lang: "ko", windowDays: 3, type: "news", query: "AI 뮤직비디오 OR AI 유튜브 콘텐츠" },
  { priority: 3, lang: "ko", windowDays: 3, type: "news", query: "AI 영화제 OR AI 공모전 수상작" },

  // ================= Priority 4: 커뮤니티 =================
  { priority: 4, lang: "en", windowDays: 30, type: "news", query: "site:microstockgroup.com (Shutterstock OR Getty OR Adobe OR Pond5 OR Alamy OR AI)" },
  { priority: 4, lang: "en", windowDays: 30, type: "news", query: "site:community.adobe.com (AI OR sales OR review OR policy)" },
  { priority: 4, lang: "en", windowDays: 30, type: "news", query: '"microstock forum" contributors OR "stock footage contributors" forum' },
  { priority: 4, type: "bing", query: "site:microstockgroup.com Shutterstock OR Getty OR Adobe OR AI" }
];

// 제목·요약에 아래 단어가 하나도 없으면 검색 주제와 무관한 오탐으로 간주합니다.
const ON_TOPIC_TERMS = [
  "ai", "인공지능", "생성형",
  "getty", "shutterstock", "istock", "pond5", "alamy",
  "adobe stock", "firefly",
  "미리디", "미리캔버스", "miridih", "miricanvas",
  "통로이미지", "tongro", "클립아트코리아", "이미지투데이",
  "stock photo", "stock footage", "microstock",
  "contributor", "기여자", "크리에이터", "royalt", "커미션", "commission", "licensing", "라이선",
  "ai image", "ai video", "generative video", "synthetic media",
  "training data", "학습데이터", "dataset", "데이터셋", "데이터 거래", "데이터 마켓플레이스", "거래소", "marketplace",
  "공공데이터", "소버린", "sovereign ai", "데이터 주권",
  "창작자 보상", "저작권", "copyright", "퍼블리시티권",
  "영화제", "공모전", "수상작", "뮤직비디오", "유튜브",
  "sora", "veo", "runway", "kling",
  "forum", "포럼", "커뮤니티"
];

// 명백히 무관한 일반 증시·여행·스포츠·부동산·일반교육 기사를 걸러내는 차단어입니다.
const OFF_TOPIC_TERMS = [
  "코스피", "코스닥", "나스닥지수", "다우존스", "주가", "증시",
  "환율 전망", "금리 인상", "금리 인하",
  "공시지가", "아파트 시세", "부동산 시세", "청약 경쟁률", "분양 일정",
  "여행상품", "패키지여행", "관광지 추천", "항공권 할인", "호텔 예약", "여행 후기",
  "프로야구", "월드컵 조편성", "올림픽 메달", "축구 국가대표", "프리미어리그",
  "지자체 교육", "방과후 교실", "교육청 연수", "평생교육원",
  "stock market", "share price", "earnings report", "quarterly earnings",
  "real estate market", "housing market"
];

// 제목에 아래 단어가 있으면 광고·협찬성 콘텐츠로 간주해 제외합니다.
const AD_TITLE_TERMS = [
  "광고", "협찬", "제휴", "할인", "쿠폰", "구매후기", "체험단", "추천인",
  "sponsored", "affiliate"
];

// 뉴스로 취급하지 않는 개인 블로그·소셜 플랫폼입니다.
const EXCLUDED_DOMAINS = [
  "blog.naver.com", "m.blog.naver.com", "post.naver.com",
  "tistory.com", "blogspot.com", "medium.com", "facebook.com", "brunch.co.kr"
];

const TIER_A_DOMAINS = [
  "newsroom.gettyimages.com", "gettyimages.com",
  "investor.shutterstock.com", "submit.shutterstock.com", "shutterstock.com",
  "blog.adobe.com", "adobe.com",
  "miridih.com", "tongro.co.kr",
  "msit.go.kr", "data.go.kr", "nia.or.kr", "kdata.or.kr",
  "copyright.or.kr", "mcst.go.kr", "korea.kr"
];

const TIER_B_DOMAINS = [
  "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk",
  "technologyreview.com", "wired.com", "arstechnica.com",
  "theverge.com", "techcrunch.com",
  "variety.com", "hollywoodreporter.com", "deadline.com", "indiewire.com",
  "yna.co.kr", "etnews.com", "zdnet.co.kr", "aitimes.com", "ddaily.co.kr", "bloter.net"
];

const TIER_C_COMMUNITY_DOMAINS = [
  "microstockgroup.com", "community.adobe.com"
];

const AWARD_TERMS = [
  "수상", "선정", "대상", "award", "winner", "공식 공개", "official release", "출시"
];

const TIER_RANK = { A: 3, B: 2, C: 1 };
const TIER_SCORE = { A: 30, B: 20, C: 10 };
const PRIORITY_SCORE = { 1: 20, 2: 15, 3: 10, 4: 5 };

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function domainMatches(hostname, list) {
  if (!hostname) return false;
  return list.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
}

function classifySource(url) {
  const hostname = getHostname(url);

  if (domainMatches(hostname, TIER_A_DOMAINS)) {
    return { source_tier: "A", source_type: "official" };
  }

  if (domainMatches(hostname, TIER_B_DOMAINS)) {
    return { source_tier: "B", source_type: "news" };
  }

  if (domainMatches(hostname, TIER_C_COMMUNITY_DOMAINS)) {
    return { source_tier: "C", source_type: "community" };
  }

  // 출처 신뢰도가 확인되지 않는 사이트는 낮은 등급으로 분리합니다.
  return { source_tier: "C", source_type: "industry" };
}

function isExcludedSource(url) {
  return domainMatches(getHostname(url), EXCLUDED_DOMAINS);
}

function isAdvertorial(article) {
  const title = article.title.toLowerCase();
  return AD_TITLE_TERMS.some(term => title.includes(term.toLowerCase()));
}

const COMPANY_NAME_TERMS = [
  "getty", "shutterstock", "adobe stock", "미리디", "미리캔버스", "miridih", "miricanvas",
  "통로이미지", "tongro"
];

const COMPANY_CONTEXT_TERMS = [
  "ai", "인공지능", "영상", "이미지", "image", "video", "data", "데이터",
  "licensing", "라이선", "contributor", "기여자"
];

const KOREA_VIDEO_CONTEXT_TERMS = ["영상", "영화", "드라마", "광고", "콘텐츠"];

function passesDisambiguation(article) {
  const haystack = `${article.title} ${article.summary}`.toLowerCase();

  // Getty/Shutterstock/Adobe Stock/미리디/통로이미지: 회사명 + 맥락어가 함께 있어야 함
  if (COMPANY_NAME_TERMS.some(t => haystack.includes(t))) {
    if (!COMPANY_CONTEXT_TERMS.some(t => haystack.includes(t))) {
      return false;
    }
  }

  // 한국 AI 영상: AI/인공지능 + 영상 계열 단어가 함께 있어야 함
  if (haystack.includes("한국") || haystack.includes("국내")) {
    if (haystack.includes("ai") || haystack.includes("인공지능")) {
      if (!KOREA_VIDEO_CONTEXT_TERMS.some(t => haystack.includes(t))) {
        return false;
      }
    }
  }

  // Runway: 패션쇼·공항 활주로 의미 배제 (AI/영상 맥락 없으면 제외)
  if (haystack.includes("runway")) {
    const runwayAiContext = ["ai", "영상", "video", "generative"];
    if (!runwayAiContext.some(t => haystack.includes(t))) {
      return false;
    }
  }

  // Adobe: 건축재료(어도비 벽돌) 의미 배제
  if (haystack.includes("adobe") && !haystack.includes("adobe stock") && !haystack.includes("firefly")) {
    const adobeSoftwareContext = ["ai", "photoshop", "creative cloud", "software", "소프트웨어", "라이트룸"];
    if (!adobeSoftwareContext.some(t => haystack.includes(t))) {
      return false;
    }
  }

  return true;
}

function isRelevant(article) {
  const haystack = `${article.title} ${article.summary}`.toLowerCase();

  if (OFF_TOPIC_TERMS.some(t => haystack.includes(t.toLowerCase()))) {
    return false;
  }

  if (!ON_TOPIC_TERMS.some(t => haystack.includes(t.toLowerCase()))) {
    return false;
  }

  return passesDisambiguation(article);
}

function countMatchedTerms(haystack, terms) {
  return terms.reduce(
    (count, term) => (haystack.includes(term.toLowerCase()) ? count + 1 : count),
    0
  );
}

function computeRelevanceScore(article) {
  const haystack = `${article.title} ${article.summary}`.toLowerCase();
  const matched = countMatchedTerms(haystack, ON_TOPIC_TERMS);
  const base = Math.min(matched * 10, 50);
  const tierBonus = TIER_SCORE[article.source_tier] || 0;
  const priorityBonus = PRIORITY_SCORE[article.priority] || 0;

  return Math.min(base + tierBonus + priorityBonus, 100);
}

function computeTrendScore(article, clusterSize) {
  let score = Math.min((clusterSize - 1) * 15, 45);

  if (article.published_at) {
    const ageHours = (Date.now() - new Date(article.published_at).getTime()) / 3600000;

    if (ageHours <= 24) {
      score += 20;
    } else if (ageHours <= 72) {
      score += 10;
    }
  }

  if (article.source_type === "official") {
    score += 15;
  }

  const haystack = `${article.title} ${article.summary}`.toLowerCase();

  if (AWARD_TERMS.some(t => haystack.includes(t.toLowerCase()))) {
    score += 15;
  }

  return Math.min(score, 100);
}

function normalizeTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/["'"“”‘’]/g, "")
    .replace(/[[\]()【】<>]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(title) {
  return new Set(normalizeTitle(title).split(" ").filter(t => t.length > 1));
}

function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function pickRepresentative(clusterArticles) {
  return clusterArticles.slice().sort((a, b) => {
    const tierDiff = (TIER_RANK[b.source_tier] || 0) - (TIER_RANK[a.source_tier] || 0);
    if (tierDiff !== 0) return tierDiff;

    const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
    return aTime - bTime;
  })[0];
}

// URL로 이미 중복 제거된 기사들 중, 제목이 매우 유사한 동일 사건 보도를 하나로 묶습니다.
// 다른 시각의 독자적인 기사는 유사도 임계값(0.82)보다 낮게 나와 별도로 유지됩니다.
function clusterByTitle(articles) {
  const clusters = [];

  articles.forEach(article => {
    const tokens = titleTokens(article.title);
    let matched = null;

    for (const cluster of clusters) {
      if (jaccardSimilarity(tokens, cluster.tokens) >= 0.82) {
        matched = cluster;
        break;
      }
    }

    if (matched) {
      matched.items.push(article);
    } else {
      clusters.push({ tokens, items: [article] });
    }
  });

  return clusters.map(cluster => ({
    representative: pickRepresentative(cluster.items),
    size: cluster.items.length
  }));
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

// Google News RSS의 <link>는 news.google.com 리다이렉트 링크라 실제 발행처
// 도메인이 아닙니다. <source url="..."> 속성이 실제 발행처 홈페이지이므로
// 출처 등급 판정에는 이 값을 사용합니다.
function getSourceHomepage(xml) {
  const match = String(xml).match(/<source[^>]*\burl="([^"]*)"[^>]*>/i);
  return match ? match[1] : "";
}

const LOCALE_BY_LANG = {
  ko: { hl: "ko", gl: "KR", ceid: "KR:ko" },
  en: { hl: "en-US", gl: "US", ceid: "US:en" }
};

function googleNewsUrl(query, lang, windowDays) {
  const locale = LOCALE_BY_LANG[lang] || LOCALE_BY_LANG.ko;
  const search = encodeURIComponent(`${query} when:${windowDays}d`);

  return (
    `https://news.google.com/rss/search?q=${search}` +
    `&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`
  );
}

function bingRssUrl(query) {
  return `https://www.bing.com/search?q=${encodeURIComponent(query)}&format=rss`;
}

function parseItems(xml, feed) {
  const items = String(xml).match(/<item>[\s\S]*?<\/item>/gi) || [];

  return items.slice(0, 12).map(item => {
    let title = stripHtml(getTag(item, "title"));
    const source = stripHtml(getTag(item, "source")) || "Google News";
    const url = stripHtml(getTag(item, "link"));
    const sourceHomepage = getSourceHomepage(item) || url;
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

    const { source_tier, source_type } = classifySource(sourceHomepage);

    return {
      title: title.slice(0, 500),
      url: url.slice(0, 2000),
      source: source.slice(0, 200),
      summary: summary.slice(0, 3000),
      category: CATEGORY_BY_PRIORITY[feed.priority],
      priority: feed.priority,
      keywords: [feed.query],
      image_url: null,
      published_at: Number.isNaN(publishedDate.getTime())
        ? null
        : publishedDate.toISOString(),
      source_tier,
      source_type
    };
  }).filter(article => article.title && article.url);
}

async function collectGoogleNews(feed) {
  const response = await fetch(googleNewsUrl(feed.query, feed.lang, feed.windowDays), {
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

async function collectBing(feed) {
  const response = await fetch(bingRssUrl(feed.query), {
    headers: {
      "User-Agent": "Content-IP-Radar/1.0"
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`Bing 응답 오류: ${response.status}`);
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

    const { source_tier, source_type } = classifySource(url);

    // 공식 인기순 데이터가 없어 "포럼 최신글"로만 표시합니다.
    threads.push({
      title: title.slice(0, 500),
      url: url.slice(0, 2000),
      source: "MicrostockGroup 포럼",
      summary: "MicrostockGroup 포럼 최신글입니다.",
      category: CATEGORY_BY_PRIORITY[4],
      priority: 4,
      keywords: ["microstockgroup forum"],
      image_url: null,
      published_at: null,
      source_tier,
      source_type
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

function buildTasks() {
  return [
    ...FEEDS.map(feed => (
      feed.type === "bing" ? () => collectBing(feed) : () => collectGoogleNews(feed)
    )),
    () => collectForumThreads()
  ];
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

  const runStartedAt = new Date();

  try {
    // 소스별 실패가 전체 수집을 막지 않도록 각각 격리해서 실행합니다.
    const tasks = buildTasks();
    const results = await Promise.allSettled(tasks.map(run => run()));

    const failedFeeds = results.filter(r => r.status === "rejected").length;
    const rawCollected = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value);

    let adRejectedCount = 0;
    let excludedSourceCount = 0;
    let relevanceRejectedCount = 0;

    const afterAdFilter = rawCollected.filter(article => {
      if (isAdvertorial(article)) {
        adRejectedCount += 1;
        return false;
      }
      return true;
    });

    const afterSourceFilter = afterAdFilter.filter(article => {
      if (isExcludedSource(article.url)) {
        excludedSourceCount += 1;
        return false;
      }
      return true;
    });

    const relevant = afterSourceFilter.filter(article => {
      if (isRelevant(article)) return true;
      relevanceRejectedCount += 1;
      return false;
    });

    // 출처 등급(source_tier/source_type)은 parseItems/parseForumThreads에서
    // 실제 발행처 홈페이지 기준으로 이미 매겨져 있습니다.

    // URL 기준 중복 제거
    const uniqueByUrl = new Map();
    relevant.forEach(article => {
      if (!uniqueByUrl.has(article.url)) {
        uniqueByUrl.set(article.url, article);
      }
    });
    const urlDeduped = [...uniqueByUrl.values()];
    const urlDuplicateCount = relevant.length - urlDeduped.length;

    // 제목 유사도 기준으로 같은 사건의 중복 보도를 대표 기사 하나로 묶습니다.
    const clusters = clusterByTitle(urlDeduped);
    const titleDuplicateCount = urlDeduped.length - clusters.length;

    const scored = clusters.map(({ representative, size }) => {
      representative.relevance_score = computeRelevanceScore(representative);
      representative.trend_score = computeTrendScore(representative, size);
      return representative;
    });

    // 추천순(우선순위 → 출처등급 → 화제성) 정렬 후 최대 150개로 제한
    scored.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      const tierDiff = (TIER_RANK[b.source_tier] || 0) - (TIER_RANK[a.source_tier] || 0);
      if (tierDiff !== 0) return tierDiff;
      return (b.trend_score || 0) - (a.trend_score || 0);
    });

    const articles = scored.slice(0, 150);

    if (!articles.length) {
      return res.status(502).json({
        success: false,
        error: "수집된 기사가 없습니다.",
        failedFeeds,
        adRejected: adRejectedCount,
        relevanceRejected: relevanceRejectedCount + excludedSourceCount
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
        adRejected: adRejectedCount,
        relevanceRejected: relevanceRejectedCount + excludedSourceCount
      });
    }

    const savedRows = Array.isArray(saveData) ? saveData : [];
    const newSaved = savedRows.filter(row => {
      const collectedAt = row.collected_at ? new Date(row.collected_at).getTime() : 0;
      return collectedAt >= runStartedAt.getTime();
    }).length;

    const bySourceTier = {};
    const byPriority = {};

    articles.forEach(article => {
      bySourceTier[article.source_tier] = (bySourceTier[article.source_tier] || 0) + 1;
      byPriority[article.priority] = (byPriority[article.priority] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      collected: articles.length,
      saved: savedRows.length,
      newSaved,
      updated: savedRows.length - newSaved,
      duplicatesRemoved: urlDuplicateCount + titleDuplicateCount,
      adRejected: adRejectedCount,
      relevanceRejected: relevanceRejectedCount + excludedSourceCount,
      bySourceTier,
      byPriority,
      failedFeeds
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
