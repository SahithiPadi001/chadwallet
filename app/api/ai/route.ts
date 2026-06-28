import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { tokenData } = await req.json();
  if (!tokenData) return NextResponse.json({ error: "tokenData required" }, { status: 400 });

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o";
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`;

  const prompt = `You are a crypto trading assistant. Analyze this Solana token and give a concise 3-sentence insight.
Token: ${tokenData.symbol} (${tokenData.name})
Price: $${tokenData.price}
24h Change: ${tokenData.priceChange24hPercent?.toFixed(2)}%
Market Cap: $${tokenData.marketcap?.toLocaleString()}
Volume 24h: $${tokenData.volume24hUSD?.toLocaleString()}
Keep it factual, short, and useful for a trader.`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey!,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 200,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Azure OpenAI error:", data?.error ?? data);
      return NextResponse.json({ error: data?.error?.message ?? "AI summary failed" }, { status: 500 });
    }
    const summary = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Azure OpenAI error:", err);
    return NextResponse.json({ error: "AI summary failed" }, { status: 500 });
  }
}