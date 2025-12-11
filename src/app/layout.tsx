import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import { TRPCProvider } from "@/trpc/client";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/contexts/notification-context";
import UnreadTitleUpdater from '@/components/unread-title-updater'

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
    description: "Video platform oriented for creators and users",
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
        { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
        { rel: "manifest", url: "/site.webmanifest" },
    ],
        // allow indexing by default
        robots: {
            index: true,
            follow: true,
            nosnippet: false,
            noarchive: false,
            // Search engine-specific directives
            googleBot: {
                index: true,
                follow: true,
            }
        }
};

export const viewport: Viewport = {
    themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b0b0b" }, { color: "#ffffff" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning className={montserrat.variable}>
                <head>
                    <link rel="preconnect" href="https://vitals.vercel-analytics.com" crossOrigin="" />
                                            <link rel="preload" as="image" href="/BoosterLongLogo.tmp.png" />
                                                    <link rel="image_src" href={`${SITE_URL}/BoosterLongLogo.tmp.png`} />
                        <link rel="manifest" href="/site.webmanifest" />
                    {/* JSON-LD structured data for Organization + WebSite */}
                                            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                                                    "@context": "https://schema.org",
                                                    "@type": "WebSite",
                                                    "url": SITE_URL,
                                                    "name": "Booster",
                                                    "potentialAction": {
                                                        "@type": "SearchAction",
                                                        "target": `${SITE_URL}/search?q={search_term_string}`,
                                                        "query-input": "required name=search_term_string"
                                                    }
                                            }) }} />
                </head>
                <body className={`${montserrat.className} antialiased bg-background text-foreground`}>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        <TRPCProvider>
                            <NotificationProvider>
                                <UnreadTitleUpdater />
                                {children}
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

