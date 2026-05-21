export const metadata = {
  title: 'Tempo',
  description: 'A cozy calendar, task and Memory Book app.',
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  themeColor: '#FF7BAC',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
