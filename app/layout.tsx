import { ThemeProvider } from "@/components/theme-provider";
import { PMThemeProvider } from "@/context/PalMirrorThemeProvider";
import { PLMSecureProvider } from "@/context/PLMSecureContext";
import { WebAuthnProvider } from "@/context/PLMSecureWebAuthnContext";
import { RecProvider } from "@/context/PLMRecSystemContext";
import AttributeNotificationProvider from "@/components/notifications/AttributeNotificationProvider";
// import { AnimatePresence, motion } from 'framer-motion';

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import MemoryNotificationProvider from "@/components/notifications/MemoryNotificationProvider";
import { PLMGlobalConfigProvider } from "@/context/PLMGlobalConfig";
import PMNotificationProvider from "@/components/notifications/PalMirrorNotification";
import Sidebar from "@/components/homescreen/Sidebar";

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
  description: "Your world. Your reflection.",
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
        <PLMGlobalConfigProvider>
          <PLMSecureProvider>
            <RecProvider>
              <WebAuthnProvider>
                <PMThemeProvider>
                  <ThemeProvider attribute="class" defaultTheme="dark">
                    <PMNotificationProvider>
                      <MemoryNotificationProvider>
                        <AttributeNotificationProvider>
                          {/* <AnimatePresence>
                      <motion.div
                      key={"h"}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}> */}
                          <Sidebar />
                          {children}

                          {/* </motion.div>
                    </AnimatePresence> */}
                        </AttributeNotificationProvider>
                      </MemoryNotificationProvider>
                    </PMNotificationProvider>
                  </ThemeProvider>
                </PMThemeProvider>
              </WebAuthnProvider>
            </RecProvider>
          </PLMSecureProvider>
        </PLMGlobalConfigProvider>
      </body>
    </html>
  );
}
