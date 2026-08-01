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

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/articles?select=*&order=collected_at.desc&limit=100`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
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

    return res.status(200).json({
      success: true,
      count: data.length,
      articles: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
