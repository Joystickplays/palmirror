import { ThemeProvider } from "@/components/theme-provider";
import { PMThemeProvider } from "@/components/PalMirrorThemeProvider";
import { PLMSecureProvider } from "@/context/PLMSecureContext";
// import { AnimatePresence, motion } from 'framer-motion';

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
      <head>
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PLMSecureProvider>
          <PMThemeProvider>
            <ThemeProvider attribute="class" defaultTheme="dark">
              {/* <AnimatePresence>
                <motion.div
                  key={"h"}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}> */}
                  {children}

                {/* </motion.div>
              </AnimatePresence> */}
            </ThemeProvider>
          </PMThemeProvider>
        </PLMSecureProvider>
      </body>
    </html>
  );
}
