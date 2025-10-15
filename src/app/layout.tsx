// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

import { TRPCProvider } from "@/trpc/client";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Booster",
    description: "Video platform oriented for creators and users",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning>
                <head>
                    {/* Preconnects to speed up LCP */}
                    <link rel="preconnect" href="https://image.mux.com" crossOrigin="" />
                    <link rel="preconnect" href="https://stream.mux.com" crossOrigin="" />
                    <link rel="preconnect" href="https://cdn.mux.com" crossOrigin="" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                </head>
                <body className={inter.className}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <TRPCProvider>
                            {children}
                            <Toaster richColors closeButton />
                            <Analytics />
                        </TRPCProvider>
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
