module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "GET 요청만 허용됩니다.",
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      success: false,
      error: "Supabase 환경변수가 설정되지 않았습니다.",
    });
  }

  const requestedLimit = Number.parseInt(req.query?.limit, 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 50;

  const requestedPage = Number.parseInt(req.query?.page, 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    // 공개 API는 review_status='approved' 기사만 반환한다.
    // (pending/rejected는 DB에 보존되지만 사이트·AI 브리핑에 노출하지 않는다.)
    const response = await fetch(
      `${supabaseUrl}/rest/v1/articles?select=*&review_status=eq.approved&order=collected_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Range: `${from}-${to}`,
          Prefer: "count=exact",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data,
      });
    }

    const contentRange = response.headers.get("content-range") || "";
    const parsedTotal = Number(contentRange.split("/")[1]);
    const total = Number.isFinite(parsedTotal) ? parsedTotal : data.length;

    return res.status(200).json({
      success: true,
      count: data.length,
      total,
      page,
      limit,
      hasMore: from + data.length < total,
      articles: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
