module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "POST 요청만 허용됩니다.",
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const ingestKey = process.env.INGEST_API_KEY;

  const receivedKey = req.headers["x-ingest-key"];

  if (!supabaseUrl || !secretKey || !ingestKey) {
    return res.status(500).json({
      success: false,
      error: "서버 환경변수가 설정되지 않았습니다.",
    });
  }

  if (receivedKey !== ingestKey) {
    return res.status(401).json({
      success: false,
      error: "저장 권한이 없습니다.",
    });
  }

  try {
    const input = Array.isArray(req.body?.articles)
      ? req.body.articles
      : [];

    if (input.length === 0) {
      return res.status(400).json({
        success: false,
        error: "저장할 기사가 없습니다.",
      });
    }

    const articles = input.slice(0, 100).map((article) => ({
      title: String(article.title || "").slice(0, 500),
      url: String(article.url || article.link || "").slice(0, 2000),
      source: String(article.source || "").slice(0, 200),
      summary: String(article.summary || article.snippet || "").slice(0, 3000),
      category: String(article.category || "").slice(0, 100),
      keywords: Array.isArray(article.keywords) ? article.keywords : [],
      image_url: article.image_url || article.imageUrl || null,
      published_at: article.published_at || article.date || null,
    })).filter((article) => article.title && article.url);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/articles?on_conflict=url`,
      {
        method: "POST",
        headers: {
          apikey: secretKey,
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(articles),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data,
      });
    }

    return res.status(200).json({
      success: true,
      saved: data.length,
      articles: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
