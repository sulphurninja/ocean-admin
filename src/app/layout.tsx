import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ocean Platform | Seller Management Portal",
  description: "Manage sellers, users, and subscriptions for Ocean Platform",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#4f46e5", // Indigo color to match UI
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://oceanplatform.com",
    title: "Ocean Platform | Seller Management Portal",
    description: "Manage sellers, users, and subscriptions for Ocean Platform",
    siteName: "Ocean Platform",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ocean Platform Dashboard"
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Add any additional scripts or stylesheets here */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {children}
      </body>
    </html>
  );
}
