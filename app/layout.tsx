import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Armadillon — Product Decision Engine",
  description: "NO VALIDATION. NO BUILD.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/*
          Runtime font import rather than next/font/google: no
          build-time network dependency (Google Fonts is unreachable
          during CI/sandbox builds without egress to fonts.googleapis.com),
          and matches how fonts were loaded in the earlier prototype.
          Swap for next/font/google once this app has a normal build
          environment, for the usual FOUC/self-hosting benefits.
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
