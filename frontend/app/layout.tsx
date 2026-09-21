import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "ReportHub | Social Media Policy Reporting",
  description:
    "Platform pelaporan dan dokumentasi konten media sosial berbasis policy.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
