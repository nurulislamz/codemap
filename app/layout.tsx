import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

const appBaseUrl =
  process.env.APP_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: {
    default: "LeetCode Backend Helper",
    template: "%s | LeetCode Backend Helper",
  },
  description: "Personal backend interview prep dashboard.",
  openGraph: {
    title: "LeetCode Backend Helper",
    description: "Personal backend interview prep dashboard.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
