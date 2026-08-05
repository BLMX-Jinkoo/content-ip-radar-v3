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
  const checkedAt = new Date().toISOString();

  if (!supabaseUrl || !secretKey) {
    return res.status(200).json({
      success: true,
      supabaseConnected: false,
      totalArticles: null,
      lastCollectedAt: null,
      checkedAt
    });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/articles?select=collected_at&order=collected_at.desc&limit=1`,
      {
        headers: {
          apikey: secretKey,
          Authorization: `Bearer ${secretKey}`,
          Prefer: "count=exact"
        },
        signal: AbortSignal.timeout(8000)
      }
    );

    if (!response.ok) {
      return res.status(200).json({
        success: true,
        supabaseConnected: false,
        totalArticles: null,
        lastCollectedAt: null,
        checkedAt
      });
    }

    const data = await response.json();
    const contentRange = response.headers.get("content-range") || "";
    const total = Number(contentRange.split("/")[1]);

    return res.status(200).json({
      success: true,
      supabaseConnected: true,
      totalArticles: Number.isFinite(total)
        ? total
        : (Array.isArray(data) ? data.length : 0),
      lastCollectedAt: data[0]?.collected_at || null,
      checkedAt
    });

  } catch (error) {
    return res.status(200).json({
      success: true,
      supabaseConnected: false,
      totalArticles: null,
      lastCollectedAt: null,
      checkedAt
    });
  }
};
