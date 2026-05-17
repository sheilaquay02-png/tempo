import "./globals.css";

export const metadata = {
  title: "Tempo",
  description: "Your calm, focused scheduling app",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon.png",
    icon: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tempo",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tempo" />
        <meta name="theme-color" content="#FF7BAC" />
      </head>
      <body>{children}</body>
    </html>
  );
}