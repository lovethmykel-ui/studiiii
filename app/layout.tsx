import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Rook Studio — @byrook_tv Automated Video & Subtitle Suite',
  description:
    'AI-driven investigative documentary video generator, automated transition choreographer, and kinetic subtitle engine tailored to the youtube.com/@byrook_tv brand aesthetic.',
  openGraph: {
    title: 'Rook Studio — @byrook_tv Automated Video & Subtitle Suite',
    description:
      'AI-driven investigative documentary video generator, automated transition choreographer, and kinetic subtitle engine tailored to the youtube.com/@byrook_tv brand aesthetic.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rook Studio — @byrook_tv Automated Video & Subtitle Suite',
    description:
      'AI-driven investigative documentary video generator, automated transition choreographer, and kinetic subtitle engine tailored to the youtube.com/@byrook_tv brand aesthetic.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#090D16] text-slate-100 font-sans antialiased selection:bg-sky-500/30 selection:text-sky-200"
      >
        {children}
      </body>
    </html>
  );
}
