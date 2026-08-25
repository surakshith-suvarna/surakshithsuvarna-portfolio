import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.surakshithsuvarna.com"),
  title: "Surakshith Suvarna — Infrastructure & Software Portfolio",
  description: "Senior IT Systems Specialist with 19 years of experience in VMware infrastructure, resilience, automation and production software engineering with Go.",
  authors: [{ name: "Surakshith Suvarna", url: "https://www.surakshithsuvarna.com" }],
  creator: "Surakshith Suvarna",
  publisher: "Surakshith Suvarna",
  keywords: ["Surakshith Suvarna", "Infrastructure Architect", "VMware", "Golang", "Veeam", "Platform Engineering", "Mangalore"],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "Surakshith Suvarna — Infrastructure & Software Portfolio",
    description: "I build resilient systems—from the datacentre to the application layer.",
    siteName: "Surakshith Suvarna",
    url: "/",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Surakshith Suvarna — Infrastructure leadership. Software engineering." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Surakshith Suvarna — Infrastructure & Software Portfolio",
    description: "Infrastructure leadership. Software engineering. Reliable outcomes.",
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/favicon-v2.svg", type: "image/svg+xml" }],
    shortcut: "/favicon-v2.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
