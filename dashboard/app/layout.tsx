import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DataProvider } from "@/components/DataProvider";
import { Shell } from "@/components/Header";
import { ReminderNotifier } from "@/components/ReminderNotifier";

export const metadata: Metadata = { title: "Command Centre", robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: "#040a13", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen">
        <DataProvider>
          <ReminderNotifier />
          <Shell>{children}</Shell>
        </DataProvider>
      </body>
    </html>
  );
}
