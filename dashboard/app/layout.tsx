import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DataProvider } from "@/components/DataProvider";
import { Header } from "@/components/Header";
import { ReminderNotifier } from "@/components/ReminderNotifier";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: "#0b0d10", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen">
        <DataProvider>
          <Header />
          <ReminderNotifier />
          <main className="mx-auto max-w-[1600px] overflow-x-hidden px-4 pb-12 pt-4 sm:px-6">{children}</main>
        </DataProvider>
      </body>
    </html>
  );
}
