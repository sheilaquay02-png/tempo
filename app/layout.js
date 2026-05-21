export const metadata = {
  title: 'Tempo',
  description: 'A soft daily rhythm app for planning, tasks, routines, habits and reflection.',
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
