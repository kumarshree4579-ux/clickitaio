import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Footer from '../components/Footer';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Ecom Store',
    template: '%s | Ecom Store',
  },
  description: 'Your one-stop shop for everything you need',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ecom Store',
  },
  openGraph: {
    type: 'website',
    siteName: 'Ecom Store',
    title: 'Ecom Store',
    description: 'Your one-stop shop for everything you need',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        {children}
        <Footer />
      </body>
    </html>
  );
}
