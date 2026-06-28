import type { Metadata } from "next";
import "./globals.css";
import { PrivyProviderWrapper } from "@/components/layout/PrivyProvider";

export const metadata: Metadata = {
  title: "ChadWallet",
  description: "Trade Solana tokens like a chad",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PrivyProviderWrapper>
          {children}
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
