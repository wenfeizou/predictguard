import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PredictGuard | RiskOps for Prediction-Market Liquidity",
  description:
    "PredictGuard helps prediction-market LPs and vault builders inspect exposure, stress tail scenarios, simulate hedges, and produce evidence-backed risk reports.",
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f5f7f4] text-[#17211d] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
