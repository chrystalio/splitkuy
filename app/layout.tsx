import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const SITE_URL = "https://splitkuy.krisdev.my.id";
const SITE_DESCRIPTION =
  "Split restaurant bills in seconds with mathematically perfect math — proportional discounts and taxes, quantity-based item sharing, and stray Rupiah reconciliation. Mobile-first, no sign-up, runs in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SplitKuy — Split bills fairly, down to the last Rupiah",
    template: "%s · SplitKuy",
  },
  description: SITE_DESCRIPTION,
  applicationName: "SplitKuy",
  keywords: [
    "bill splitter",
    "split bill",
    "restaurant bill",
    "splitwise alternative",
    "Indonesian Rupiah",
    "IDR",
    "proportional split",
    "group dining",
    "receipt splitter",
    "bill sharing",
  ],
  authors: [{ name: "Chrystalio" }],
  creator: "Chrystalio",
  publisher: "SplitKuy",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "SplitKuy",
    title: "SplitKuy — Split bills fairly, down to the last Rupiah",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SplitKuy — proportional bill splitting for Indonesian Rupiah",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SplitKuy — Split bills fairly, down to the last Rupiah",
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  category: "finance",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
  ],
};

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=document.documentElement;if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}else{d.classList.remove('dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* FOUC prevention: run synchronously before React hydrates so there is no
            flash of the wrong theme. Plain <script> in a Server Component <head>
            executes via HTML parse (never as a React child), so React 19 won't warn.
            suppressHydrationWarning silences the structural check — output is
            identical on server and client, no typeof-window branch needed. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}