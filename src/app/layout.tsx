import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenNest BuildFlow",
  description: "Project operating system for housing development and construction investment teams."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
