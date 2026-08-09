import type { Metadata } from "next";
import "./globals.css";
import Titlebar from "./components/Titlebar";
import BottomNav from "./components/BottomNav";
import { Menu11Icon } from "@hugeicons-pro/core-solid-rounded";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import AppBootstrap from "./components/AppBootstrap";

export const metadata: Metadata = {
  title: "crtl",
  description: "crtl desktop app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full"
    >
      <body className="select-none min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        <ThemeProvider />
        <AppBootstrap />
        <Titlebar
          icon={Menu11Icon}
          title="CRTL"
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center w-full">
          <div className="w-full px-6 py-8 flex flex-col flex-1">
            {children}
          </div>
        </main>
        <BottomNav />
        <Toaster
          position="top-center"
          theme="system"
          toastOptions={{
            style: {
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              borderRadius: "var(--radius-xl)",
              fontSize: "12px",
              fontFamily: "Geist, sans-serif",
              boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
              backdropFilter: "blur(16px)",
              padding: "12px 16px",
            },
          }}
          offset={12}
        />
      </body>
    </html>
  );
}
