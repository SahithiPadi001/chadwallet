import { redirect } from "next/navigation";
import { getTrendingTokens } from "@/lib/birdeye";

export default async function TokensIndexPage() {
  const tokens = await getTrendingTokens(1).catch(() => []);
  const address = tokens[0]?.address ?? "So11111111111111111111111111111111111111112";
  redirect(`/tokens/${address}`);
}
