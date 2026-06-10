import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PredictGuard",
  description: "PredictGuard: The Risk Layer for DeepBook Predict",
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
