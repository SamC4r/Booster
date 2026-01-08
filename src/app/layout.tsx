import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OnboardingCheck } from "@/components/onboarding-check";

import { TRPCProvider } from "@/trpc/client";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/contexts/notification-context";
import UnreadTitleUpdater from '@/components/unread-title-updater'

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";

import { ourFileRouter } from "./api/uploadthing/core";
import { extractRouterConfig } from "uploadthing/server";

const montserrat = Montserrat({
    subsets: ["latin"],
    display: "swap",
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    style: ['normal', 'italic'],
    variable: '--font-montserrat'
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boostervideos.net'

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: "Booster",
        template: "%s | Booster",
    },
    description: "Video platform where ",
    keywords: ['video', 'creators', 'video platform', 'shorts', 'longform', 'streaming', 'uploader', 'booster videos'],
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        url: `${SITE_URL}/`,
        siteName: "Booster",
        title: "Booster",
        description: "Video platform oriented for creators and users",
        images: [{ url: `${SITE_URL}/BoosterLongLogo.tmp.png`, width: 1200, height: 630, alt: 'Booster logo' }],
    },
    twitter: {
        card: "summary_large_image",
        site: "@BoosterVideos",
        creator: "@BoosterVideos",
    },
    icons: [
        { rel: "icon", url: "/favicon.ico" },
        { rel: "apple-touch-icon", url: "/favicon.ico" },
    ],
};

export const viewport: Viewport = {
    themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b0b0b" }, { color: "#ffffff" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const { userId } = await auth();
    let accountType = null;
    if (userId) {
        const [user] = await db.select({ accountType: users.accountType }).from(users).where(eq(users.clerkId, userId));
        if (user) {
            accountType = user.accountType;
        }
    }

    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning className={montserrat.variable}>
                <head>
                    <link rel="preconnect" href="https://vitals.vercel-analytics.com" crossOrigin="" />
                    <link rel="preload" as="image" href="/BoosterLongLogo.tmp.png" />
                    <link rel="image_src" href={`${SITE_URL}/BoosterLongLogo.tmp.png`} />
                    <link rel="manifest" href="/site.webmanifest" />
                    {/* JSON-LD structured data for Organization + WebSite */}
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify([
                                {
                                    "@context": "https://schema.org",
                                    "@type": "WebSite",
                                    "url": SITE_URL,
                                    "name": "Booster",
                                    "potentialAction": {
                                        "@type": "SearchAction",
                                        "target": `${SITE_URL}/search?q={search_term_string}`,
                                        "query-input": "required name=search_term_string"
                                    }
                                },
                                {
                                    "@context": "https://schema.org",
                                    "@type": "Organization",
                                    "name": "Booster",
                                    "url": SITE_URL,
                                    "logo": `${SITE_URL}/BoosterLongLogo.tmp.png`,
                                    "sameAs": [
                                        "https://twitter.com/BoosterVideos",
                                        // Add other social profiles here
                                    ]
                                }
                            ])
                        }}
                    />
                </head>
                <body className={`${montserrat.className} antialiased bg-background text-foreground`}>
                    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange themes={['light', 'dark', 'retro']}>
                        <TRPCProvider>
                            <NotificationProvider>
                                <UnreadTitleUpdater />
                                <OnboardingCheck accountType={accountType} userId={userId} />
                                <NextSSRPlugin
                                    routerConfig={extractRouterConfig(ourFileRouter)}
                                />                                {children}
                                <Toaster richColors closeButton />
                                <Analytics />
                            </NotificationProvider>
                        </TRPCProvider>
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}

