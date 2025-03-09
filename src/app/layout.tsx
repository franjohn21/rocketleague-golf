import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rocketleague Golf - 3D Golf Game",
  description:
    "A Rocketleague-inspired golf game where you drive a car to hit the ball. Features hit counter, golf scoring system, and realistic physics.",
  keywords: [
    "Rocketleague Golf",
    "3D golf",
    "car golf",
    "React golf game",
    "Rocket League",
    "browser game",
    "physics game",
  ],
  authors: [{ name: "Golf Generator Team" }],
  creator: "Golf Generator",
  publisher: "Golf Generator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://golf-generator.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Rocketleague Golf - 3D Golf Game",
    description:
      "Hit the ball with your car in this Rocketleague-inspired golf simulator. Features realistic physics, scoring system, and beautiful 3D visuals.",
    url: "https://golf-generator.vercel.app",
    siteName: "Rocketleague Golf",
    images: [
      {
        url: "/game.png",
        width: 1200,
        height: 630,
        alt: "3D Golf Game - Car hitting a golf ball on a beautiful course",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rocketleague Golf - Car Racing Golf Simulator",
    description:
      "Control a car to hit a golf ball in this Rocketleague-inspired golf game with physics-based gameplay",
    images: ["/game.png"],
    creator: "@golfgenerator",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} bg-gray-100`}>{children}</body>
    </html>
  );
}
