// Content IP Radar 수집 V2 (신규 파일 — 기존 api/collect.js는 그대로 둡니다).
//
// 판정 순서:
//   1) 신뢰 출처 확인       - 실제 발행처 도메인으로 Tier 판정, 저신뢰 도메인 즉시 탈락
//   2) 핵심 엔티티 확인      - 회사/스톡 엔티티가 제목/요약에 존재 (사진 크레딧 전용이면 제외)
//   3) 시장 용어 동시 포함    - 엔티티와 라이선싱/학습데이터/저작권/보상/로열티/AI이미지/AI영상 동시
//   4) 제외어 검사          - finance stock / fashion runway / 반도체·의료·로봇·부동산·코인·보안
//   5) 규칙 통과분만 AI 배치 분류 (Gemini→Claude)로 verdict + 신뢰도(0~100)
//   6) 신뢰도 80점 이상 & 적합 판정만 approved 로 저장 (pending/rejected는 저장하지 않음)
//
// 저장은 approved 만 하므로 공개 API/사이트에는 approved 만 노출됩니다.

// ── 검색어 (회사/스톡 = 30일, 일반 AI 영상·미디어 = 7일) ──────────────
const FEEDS = [
  // Priority 1 — 회사/스톡 (30일)
  { p:1, lang:"en", win:30, q:'"Getty Images" (licensing OR contributor OR royalty OR "AI image" OR "generative" OR "training data")' },
  { p:1, lang:"en", win:30, q:'"Shutterstock" (contributor OR licensing OR royalty OR "AI-generated" OR "training data" OR dataset)' },
  { p:1, lang:"en", win:30, q:'"Adobe Stock" (contributor OR licensing OR "generative" OR Firefly OR royalty)' },
  { p:1, lang:"en", win:30, q:'"Adobe Firefly" (image OR video OR stock OR license OR commercial)' },
  { p:1, lang:"en", win:30, q:'(iStock OR Pond5 OR Alamy) (contributor OR licensing OR footage OR royalty OR "AI")' },
  { p:1, lang:"en", win:30, q:'("stock photography" OR "stock footage" OR microstock) (AI OR licensing OR contributor OR royalty)' },
  { p:1, lang:"ko", win:30, q:'(미리디 OR 미리캔버스) (AI OR 이미지 OR 영상 OR 라이선스 OR 저작권)' },
  { p:1, lang:"ko", win:30, q:'(통로이미지 OR 클립아트코리아 OR 이미지투데이) (AI OR 스톡 OR 라이선스 OR 영상 OR 저작권)' },
  // Priority 2 — AI 데이터·라이선싱 (30일)
  { p:2, lang:"en", win:30, q:'"training data" (licensing OR "license deal") (image OR visual OR content OR photo)' },
  { p:2, lang:"en", win:30, q:'("visual data" OR "image dataset" OR "media dataset") (licensing OR marketplace)' },
  { p:2, lang:"ko", win:30, q:'(학습데이터 OR 비주얼데이터 OR 이미지 데이터셋) (라이선싱 OR 라이선스 OR 거래 OR 보상)' },
  { p:2, lang:"ko", win:30, q:'(소버린 AI OR 데이터 주권 OR 공공데이터) (학습 OR 라이선스 OR 거래소 OR 저작권)' },
  { p:2, lang:"ko", win:30, q:'(창작자 보상 OR 퍼블리시티권 OR 저작권) (생성형 OR "AI 학습" OR 이미지 OR 스톡)' },
  // Priority 3 — AI 제작 화제작 / 일반 AI 영상·미디어 (7일)
  { p:3, lang:"en", win:7, q:'("AI-generated" OR "made with AI") (film OR "short film" OR commercial OR "music video" OR advertisement)' },
  { p:3, lang:"en", win:7, q:'(Sora OR "Google Veo" OR Runway OR Kling) (film OR commercial OR "music video" OR ad OR campaign)' },
  { p:3, lang:"ko", win:7, q:'(AI 영화 OR AI 단편 OR AI 광고 OR AI 뮤직비디오 OR AI 드라마) (제작 OR 공개 OR 상영 OR 수상 OR 공모전)' }
];

const CATEGORY_BY_PRIORITY = { 1:"AI 사진·영상·스톡", 2:"AI 데이터·라이선싱", 3:"AI 제작 화제작" };

const CORE_ENTITY = [
  "getty images","getty","istock","shutterstock","pond5","alamy",
  "adobe stock","adobe firefly","firefly",
  "미리디","미리캔버스","miridih","miricanvas",
  "통로이미지","tongro","클립아트코리아","clipartkorea","이미지투데이","imagetoday",
  "microstock","마이크로스톡","stock photo","stock photography","stock footage","stock image",
  "스톡사진","스톡 사진","스톡영상","스톡 영상","스톡이미지","스톡 이미지","게티이미지"
];

// 회사명이 finance/티커 맥락으로 쓰이면 엔티티에서 제외 (예: "Adobe stock climbs")
const MARKET_TERM = [
  "ai image","ai video","ai 이미지","ai 영상","ai 사진","generative","synthetic media","생성형",
  "training data","학습데이터","학습 데이터","visual data","비주얼 데이터","dataset","데이터셋",
  "data licensing","content licensing","라이선싱","라이선스","licensing","license deal",
  "contributor","기여자","royalty","로열티","커미션","commission","creator compensation","창작자 보상",
  "저작권","copyright","퍼블리시티","콘텐츠 ip","content ip",
  "공공데이터","소버린","sovereign ai","데이터 주권","데이터 거래","marketplace","거래소",
  "영상 제작","영상제작","이미지 제작","이미지제작","콘텐츠 제작","ai 스튜디오","ai studio",
  // 최소 추가 (복합 제목 복구용)
  "authenticity","verified content","royalty-free","unlimited download","ai slop","royalties"
];

const AI_PROD = [
  "ai로 제작","ai 제작","ai 영화","ai 단편","ai 드라마","ai 광고","ai 뮤직비디오",
  "ai generated","ai-generated","made with ai","ai film","ai short film","ai music video",
  "sora","veo","runway","kling","firefly video","영화제","공모전","수상작","film festival"
];

const EXCLUDE = {
  semiconductor:["반도체","semiconductor","hbm","파운드리","foundry","웨이퍼","tsmc"],
  robot:["로봇","robot","휴머노이드","humanoid"],
  medical:["의료","병원","질환","진단","치료제","신약","임상","medical","healthcare","hospital","nurse","patient"],
  realestate:["부동산","아파트","분양","청약","공시지가","real estate","housing market","mortgage"],
  sports:["프로야구","축구","월드컵","올림픽","국가대표","premier league","nba","mlb"],
  finance:["코스피","코스닥","나스닥","다우","주가","증시","환율","금리","earnings","stock market",
    "share price","nyse","nasdaq:","shares rise","shares fall","investment boom","p/e","trades at",
    "climbing today","fell nearly","시가총액","목표주가","valuation","market cap","분기 실적","stock forecast"],
  crypto:["비트코인","이더리움","코인","가상자산","암호화폐","crypto","bitcoin","ethereum","stablecoin","blockchain"],
  security:["해킹","랜섬웨어","피싱","malware","ransomware","phishing","cyberattack","악성코드","취약점"],
  runwayFashion:["fashion week","runway show","패션쇼","런웨이 쇼","공항 활주로","활주로 재개"]
};

const AD_MARKERS = ["광고","협찬","제휴","할인","쿠폰","체험단","추천인","sponsored","affiliate","프로모션"];
const LOW_TRUST = ["blog.naver.com","post.naver.com","tistory.com","blogspot.","medium.com","facebook.com","brunch.co.kr","cafe.naver.com"];

const TIER_A = ["newsroom.gettyimages.com","gettyimages.com","press.gettyimages.com","investor.shutterstock.com",
  "submit.shutterstock.com","shutterstock.com","blog.adobe.com","adobe.com","miridih.com","tongro.co.kr",
  "msit.go.kr","data.go.kr","nia.or.kr","kdata.or.kr","copyright.or.kr","mcst.go.kr","korea.kr"];
const TIER_B = ["reuters.com","apnews.com","bbc.com","bbc.co.uk","technologyreview.com","wired.com",
  "arstechnica.com","theverge.com","techcrunch.com","variety.com","hollywoodreporter.com","deadline.com",
  "indiewire.com","yna.co.kr","etnews.com","zdnet.co.kr","aitimes.com","ddaily.co.kr","bloter.net"];

// 배포형 보도자료 도메인 — source_type='press_release'로 구분하고 추천 우선순위를 낮춤
const PRESS_RELEASE_DOMAINS = ["prnewswire.com","prnewswire.co.uk","businesswire.com","globenewswire.com",
  "prweb.com","newswire.ca","newswire.com","einpresswire.com","accesswire.com","prlog.org"];

// 사진 크레딧/캡션 맥락 (엔티티가 이 맥락에만 등장하면 제외)
const CREDIT_MARKERS = ["출처=","사진=","제공=","이미지 출처","사진 출처","자료사진","게티이미지뱅크",
  "게티이미지 코리아","photo:","photo credit","credit:","courtesy of","image:","getty images/"];

const lc = s => String(s||"").toLowerCase();
function host(url){ try { return new URL(url).hostname.replace(/^www\./,"").toLowerCase(); } catch { return ""; } }
function dm(h,list){ return list.some(d => h===d || h.endsWith("."+d) || h.includes(d)); }
function anyIn(t,list){ return list.some(x=>t.includes(x)); }
function whichIn(t,list){ return list.filter(x=>t.includes(x)); }

function tierOf(sourceUrl){
  const h = host(sourceUrl);
  if (dm(h,TIER_A)) return { tier:"A", type:"official" };
  if (dm(h,TIER_B)) return { tier:"B", type:"news" };
  if (dm(h,PRESS_RELEASE_DOMAINS)) return { tier:"C", type:"press_release" };
  return { tier:"C", type:"industry" };
}

// 추천 우선순위: 공식·신뢰 언론이 높고 보도자료가 가장 낮음
const TYPE_RANK = { official:5, news:4, industry:3, community:2, press_release:1 };

// 엔티티가 사진 크레딧/캡션에만 등장하는지 판정.
// - 제목에 엔티티가 있으면 크레딧 전용이 아님 (본문 주제로 간주)
// - 요약에서 엔티티가 크레딧 마커 근처(앞 25자 이내)에만 있으면 크레딧 전용으로 봄
function isCreditOnly(title, summary, entHitsInTitle){
  if (entHitsInTitle.length) return false;
  const s = lc(summary);
  const ents = whichIn(s, CORE_ENTITY);
  if (!ents.length) return false;

  // 엔티티 각 등장 위치가 모두 크레딧 마커 근처인가?
  for (const ent of ents) {
    let idx = s.indexOf(ent);
    while (idx !== -1) {
      const windowStart = Math.max(0, idx - 25);
      const near = s.slice(windowStart, idx + ent.length + 5);
      const isCredit = CREDIT_MARKERS.some(m => near.includes(lc(m)));
      if (!isCredit) return false; // 크레딧이 아닌 등장이 하나라도 있으면 본문 언급
      idx = s.indexOf(ent, idx + ent.length);
    }
  }
  return true;
}

// 규칙 게이트: 1~4단계. 통과 여부 + 사전점수 + 사유/제외사유 반환.
function ruleGate(a){
  const title = lc(a.title);
  const text = `${title}  ${lc(a.summary)}`;
  const h = host(a.home);
  const reasons = [];

  // 광고/저신뢰
  const ad = whichIn(title, AD_MARKERS);
  if (ad.length) return { pass:false, category:CATEGORY_BY_PRIORITY[a.priority], reason:"", exclude:`광고성(${ad.join(",")})`, excludeClass:"ad" };
  if (LOW_TRUST.some(d => h.includes(d))) return { pass:false, category:CATEGORY_BY_PRIORITY[a.priority], reason:"", exclude:`저신뢰 도메인(${h})`, excludeClass:"lowtrust" };

  const entInTitle = whichIn(title, CORE_ENTITY);
  const ent = whichIn(text, CORE_ENTITY);
  const mkt = whichIn(text, MARKET_TERM);
  const prod = whichIn(text, AI_PROD);
  const hasAI = /(?:^|[^a-z])ai(?:[^a-z]|$)/.test(text) || text.includes("인공지능") || text.includes("생성형");

  // 사진 크레딧 전용 제외 (규칙 2 보강)
  if (ent.length && isCreditOnly(a.title, a.summary, entInTitle)) {
    return { pass:false, category:CATEGORY_BY_PRIORITY[a.priority], reason:"", exclude:`엔티티가 사진 크레딧/캡션에만 등장`, excludeClass:"credit" };
  }

  // 제외 주제 (강한 핵심조합 예외)
  const strong = ent.length && mkt.length;
  for (const [topic, terms] of Object.entries(EXCLUDE)) {
    if (anyIn(text, terms) && !strong) {
      return { pass:false, category:CATEGORY_BY_PRIORITY[a.priority], reason:"", exclude:`제외 주제(${topic})`, excludeClass: topic==="finance"?"finance":"topic" };
    }
  }

  // 바 AI (AI만 있고 엔티티/시장용어 없음) 제외 (규칙 1)
  if (hasAI && !ent.length && !mkt.length && !prod.length) {
    return { pass:false, category:CATEGORY_BY_PRIORITY[a.priority], reason:"", exclude:`일반 AI 기사(엔티티·시장용어 없음)`, excludeClass:"bareai" };
  }

  // 동시 포함 게이트 (규칙 3)
  const p1ok = ent.length && (mkt.length || (prod.length && hasAI));
  const p2ok = a.priority===2 && mkt.length && hasAI;
  const p3ok = a.priority===3 && prod.length && hasAI;
  if (!(p1ok || p2ok || p3ok)) {
    if (!ent.length && !mkt.length && !prod.length) {
      return { pass:false, category:CATEGORY_BY_PRIORITY[a.priority], reason:"", exclude:`핵심 신호 없음`, excludeClass:"nosignal" };
    }
    return { pass:false, category:CATEGORY_BY_PRIORITY[a.priority], reason:"", exclude:`엔티티+시장용어 동시조건 불충족`, excludeClass:"cooc" };
  }

  // 사전 점수
  const { tier, type } = tierOf(a.home);
  let s = tier==="A"?40 : tier==="B"?30 : tier==="C"?15 : 5;
  reasons.push(`Tier ${tier}(${type})`);
  if (ent.length){ s+=25; reasons.push(`엔티티(${ent.slice(0,2).join(",")})`); }
  if (ent.length && mkt.length){ s+=20; reasons.push(`시장용어 동시(${mkt[0]})`); }
  else if (mkt.length){ s+=8; reasons.push(`시장용어(${mkt[0]})`); }
  if (prod.length && hasAI){ s+=18; reasons.push(`AI제작(${prod.slice(0,2).join(",")})`); }
  if (a.published_at){
    const ageH=(Date.now()-new Date(a.published_at).getTime())/3600000;
    if (ageH<=72){ s+=10; reasons.push("≤3일"); } else if (ageH<=720){ s+=5; reasons.push("≤30일"); }
  }
  if (/수상|선정|공식|award|winner|festival|announce|launch/.test(text)){ s+=7; reasons.push("공식/수상"); }
  s = Math.min(s,100);

  return { pass:true, category:CATEGORY_BY_PRIORITY[a.priority], preScore:s, tier, type,
    reason:reasons.join(" · "), exclude:"", excludeClass:"" };
}

// ── 제목 유사도 기반 동일 사건 중복 병합 ─────────────────────
const TIER_RANK = { A:3, B:2, C:1 };
function normalizeTitle(t){
  return String(t).toLowerCase().replace(/["'"“”‘’]/g,"").replace(/[[\]()【】<>]/g," ")
    .replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();
}
function titleTokens(t){ return new Set(normalizeTitle(t).split(" ").filter(x=>x.length>1)); }
function jaccard(a,b){ if(!a.size||!b.size) return 0; let inter=0; for(const x of a) if(b.has(x)) inter++; const uni=a.size+b.size-inter; return uni?inter/uni:0; }
function pickRep(items){
  return items.slice().sort((a,b)=>{
    const t=(TIER_RANK[b.tier]||0)-(TIER_RANK[a.tier]||0); if(t) return t;
    const at=a.published_at?new Date(a.published_at).getTime():0, bt=b.published_at?new Date(b.published_at).getTime():0;
    return at-bt;
  })[0];
}
// URL 중복 제거된 목록에서 제목이 매우 유사한(≥0.8) 동일 사건을 대표 1건으로 병합.
function clusterByTitle(list){
  const clusters=[];
  list.forEach(a=>{
    const tk=titleTokens(a.title); let hit=null;
    for(const c of clusters){ if(jaccard(tk,c.tk)>=0.8){ hit=c; break; } }
    if(hit){ hit.items.push(a); } else { clusters.push({ tk, items:[a] }); }
  });
  return clusters.map(c=>{ const rep=pickRep(c.items); return { ...rep, clusterSize:c.items.length }; });
}

// ── RSS 파싱 ────────────────────────────────────────────────
function decode(v=""){const e={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
  return String(v).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
    .replace(/&([a-z]+);/gi,(m,n)=>Object.prototype.hasOwnProperty.call(e,n)?e[n]:m);}
function strip(v=""){return decode(v).replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();}
function tag(xml,t){const m=String(xml).match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${t}>`,"i"));return m?decode(m[1]).trim():"";}
function srcUrl(xml){const m=String(xml).match(/<source[^>]*\burl="([^"]*)"[^>]*>/i);return m?m[1]:"";}

function gnUrl(q,lang,win){
  const loc = lang==="en" ? {hl:"en-US",gl:"US",ceid:"US:en"} : {hl:"ko",gl:"KR",ceid:"KR:ko"};
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q+" when:"+win+"d")}&hl=${loc.hl}&gl=${loc.gl}&ceid=${loc.ceid}`;
}

async function fetchFeed(feed){
  const r = await fetch(gnUrl(feed.q,feed.lang,feed.win),{ headers:{ "User-Agent":"Content-IP-Radar/2.0" }, signal:AbortSignal.timeout(10000) });
  if(!r.ok) throw new Error("Google News "+r.status);
  const xml = await r.text();
  const items = (xml.match(/<item>[\s\S]*?<\/item>/gi)||[]).slice(0,12);
  return items.map(it=>{
    let title=strip(tag(it,"title"));
    const source=strip(tag(it,"source"))||"Google News";
    const url=strip(tag(it,"link"));
    const home=srcUrl(it)||url;
    let summary=strip(tag(it,"description"));
    const suf=` - ${source}`; if(title.endsWith(suf)) title=title.slice(0,-suf.length).trim();
    if(summary.startsWith(title)) summary=summary.slice(title.length).trim();
    const pub=new Date(strip(tag(it,"pubDate")));
    return { title:title.slice(0,500), url:url.slice(0,2000), source:source.slice(0,200), home,
      summary:summary.slice(0,3000), category:CATEGORY_BY_PRIORITY[feed.p], priority:feed.p,
      keywords:[feed.q], image_url:null,
      published_at: isNaN(pub.getTime())?null:pub.toISOString() };
  }).filter(a=>a.title&&a.url);
}

// ── 5단계: AI 배치 분류 (Gemini → Claude) ────────────────────
function buildClassifyPrompt(batch){
  const list = batch.map((a,i)=>`[${i}] 카테고리:${a.category}\n제목:${a.title}\n요약:${(a.summary||"").slice(0,300)}\n매체:${a.source}`).join("\n\n");
  return (
    "당신은 콘텐츠 IP·스톡 미디어·AI 이미지/영상 산업 전문 애널리스트입니다.\n" +
    "아래 기사들이 다음 핵심 주제에 '실제로' 부합하는지 판정하세요.\n" +
    "핵심 주제: AI 사진/영상 시장, 스톡사진/스톡영상/마이크로스톡(Getty·iStock·Shutterstock·Pond5·Alamy·Adobe Stock/Firefly·미리디·미리캔버스·통로이미지·클립아트코리아·이미지투데이), " +
    "AI 학습데이터·비주얼 데이터 라이선싱, 콘텐츠 IP·창작자 보상·저작권, 공공데이터·소버린 AI, AI로 실제 제작한 영화·드라마·광고·뮤직비디오.\n" +
    "제외: 단순히 'AI'만 언급한 일반 기사, 회사명이 사진 크레딧에만 나온 기사, finance 의미의 stock, 반도체·의료·로봇·부동산·코인·보안.\n\n" +
    "각 기사를 판정해 JSON 배열로만 답하세요. 형식: " +
    '[{"i":0,"verdict":"핵심 적합|부분 적합|무관","confidence":0-100,"reason":"간단한 근거"}]\n\n' +
    list
  );
}

function extractJsonArray(text){
  const m = String(text).match(/\[[\s\S]*\]/);
  if(!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function callGeminiClassify(key, prompt){
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+key,{
    method:"POST", headers:{ "content-type":"application/json" },
    body: JSON.stringify({ contents:[{ parts:[{ text:prompt }] }], generationConfig:{ temperature:0 } }),
    signal: AbortSignal.timeout(30000)
  });
  if(!r.ok) throw new Error("gemini "+r.status);
  const d = await r.json();
  const parts = d.candidates?.[0]?.content?.parts || [];
  return parts.map(p=>p.text||"").join("");
}

async function callClaudeClassify(key, prompt){
  const r = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST", headers:{ "x-api-key":key, "anthropic-version":"2023-06-01", "content-type":"application/json" },
    body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:2000, messages:[{ role:"user", content:prompt }] }),
    signal: AbortSignal.timeout(30000)
  });
  if(!r.ok) throw new Error("claude "+r.status);
  const d = await r.json();
  return (d.content||[]).map(c=>c.text||"").join("");
}

async function classifyBatch(batch){
  const gem = process.env.GEMINI_API_KEY;
  const anth = process.env.ANTHROPIC_API_KEY;
  const prompt = buildClassifyPrompt(batch);

  let raw = null;
  if (gem) { try { raw = await callGeminiClassify(gem, prompt); } catch(e){ /* fallback */ } }
  if (!raw && anth) { try { raw = await callClaudeClassify(anth, prompt); } catch(e){ /* */ } }
  if (!raw) return null;

  const arr = extractJsonArray(raw);
  if (!Array.isArray(arr)) return null;

  const byIndex = new Map(arr.map(o=>[Number(o.i), o]));
  return batch.map((a,i)=>{
    const v = byIndex.get(i) || {};
    const conf = Math.max(0, Math.min(100, Number(v.confidence)||0));
    const verdict = (v.verdict==="핵심 적합"||v.verdict==="부분 적합") ? v.verdict : "무관";
    return { verdict, confidence:conf, reason:String(v.reason||"").slice(0,200) };
  });
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control","no-store");
  if (req.method !== "GET") return res.status(405).json({ success:false, error:"GET 요청만 허용됩니다." });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const cronSecret = process.env.CRON_SECRET;
  if (!supabaseUrl || !secretKey || !cronSecret) return res.status(500).json({ success:false, error:"서버 환경변수가 설정되지 않았습니다." });
  if ((req.headers.authorization||"") !== `Bearer ${cronSecret}`) return res.status(401).json({ success:false, error:"자동수집 실행 권한이 없습니다." });

  const dry = req.query?.dry === "1"; // dry=1 이면 저장하지 않고 결과만 반환

  try {
    const results = await Promise.allSettled(FEEDS.map(f=>fetchFeed(f)));
    const failedFeeds = results.filter(r=>r.status==="rejected").length;
    let raw = []; results.forEach(r=>{ if(r.status==="fulfilled") raw = raw.concat(r.value); });

    // URL 중복 제거
    const seen=new Set(); const uniq=[];
    for(const a of raw){ if(!seen.has(a.url)){ seen.add(a.url); uniq.push(a); } }

    // 규칙 게이트
    const excludeStats = {};
    let gatedRaw = [];
    uniq.forEach(a=>{
      const g = ruleGate(a);
      if (g.pass){ gatedRaw.push({ ...a, ...g }); }
      else { excludeStats[g.excludeClass] = (excludeStats[g.excludeClass]||0)+1; }
    });

    // 제목 유사도 기반 동일 사건 병합 (대표 1건, Tier 높은 출처 우선)
    const gated = clusterByTitle(gatedRaw);
    const titleDuplicatesMerged = gatedRaw.length - gated.length;

    // 5단계 AI 배치 분류 (25개씩)
    const classified = [];
    for (let i=0;i<gated.length;i+=25){
      const batch = gated.slice(i,i+25);
      const verdicts = await classifyBatch(batch);
      batch.forEach((a,idx)=>{
        const v = verdicts ? verdicts[idx] : { verdict:"무관", confidence:0, reason:"분류 실패" };
        classified.push({ ...a, ai_verdict:v.verdict, ai_confidence:v.confidence, ai_reason:v.reason });
      });
    }

    // 6단계: 신뢰도 80↑ & 적합 → approved
    const approved = classified.filter(a => a.ai_confidence>=80 && (a.ai_verdict==="핵심 적합"||a.ai_verdict==="부분 적합"));

    // 추천순 정렬: 우선순위 → 출처유형(보도자료 최하) → AI 신뢰도 → 사전점수
    approved.sort((x,y)=>
      (x.priority-y.priority) ||
      ((TYPE_RANK[y.type]||0)-(TYPE_RANK[x.type]||0)) ||
      (y.ai_confidence-x.ai_confidence) ||
      (y.preScore-x.preScore));
    const toStore = approved.slice(0,150);

    const stats = {
      fetched: uniq.length, gatePassed: gated.length, titleDuplicatesMerged,
      classified: classified.length, approved: approved.length,
      excludeStats, failedFeeds
    };

    if (dry) {
      return res.status(200).json({ success:true, dryRun:true, ...stats,
        approvedPreview: toStore.map(a=>({ title:a.title, source:a.source, category:a.category, ai_verdict:a.ai_verdict, ai_confidence:a.ai_confidence })) });
    }

    if (!toStore.length) return res.status(200).json({ success:true, saved:0, ...stats });

    // approved 만 저장 (status='approved'). status 컬럼이 없으면 배포 전 migration 필요.
    const payload = toStore.map(a=>({
      title:a.title, url:a.url, source:a.source, summary:a.summary,
      category:a.category, keywords:a.keywords, image_url:null, published_at:a.published_at,
      source_tier:a.tier, source_type:a.type, priority:a.priority,
      relevance_score:a.preScore, trend_score:a.ai_confidence,
      ai_confidence:a.ai_confidence, ai_verdict:a.ai_verdict, review_status:"approved"
    }));

    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/articles?on_conflict=url`,{
      method:"POST",
      headers:{ apikey:secretKey, Authorization:`Bearer ${secretKey}`, "Content-Type":"application/json",
        Prefer:"resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });
    const saveData = await saveResponse.json().catch(()=>[]);
    if (!saveResponse.ok) return res.status(saveResponse.status).json({ success:false, error:saveData, ...stats });

    return res.status(200).json({ success:true, saved:Array.isArray(saveData)?saveData.length:0, ...stats });
  } catch (error) {
    return res.status(500).json({ success:false, error:error.message });
  }
};
