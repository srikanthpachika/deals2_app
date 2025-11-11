import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deals2Beat — curated daily deals',
  description: 'Under-50 fresh deals daily. Simple, fast, and ad-supported.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body className="max-w-3xl mx-auto p-4 font-sans">
        <header className="py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold">Deals2Beat</a>
          <nav className="text-sm">
            <a href="/admin" className="underline">Admin</a>
          </nav>
        </header>
        <main className="flex flex-col gap-6">{children}</main>
        <footer className="py-10 text-center text-sm opacity-70">
          © {new Date().getFullYear()} Deals2Beat — Less than 50 deals per day.
        </footer>
      </body>
    </html>
  );
}