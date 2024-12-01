import { ThemeProvider } from "@/components/theme-provider"
import { PMThemeProvider } from '@/components/PalMirrorThemeProvider';
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PalMirror",
  description: "Just-with-a-bit-more-style AI chat platform",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PMThemeProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
          >

            {children}
          </ThemeProvider>
        </PMThemeProvider>

      </body>
    </html>
  );
}
