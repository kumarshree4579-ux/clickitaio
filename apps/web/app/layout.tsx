import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Footer from '../components/Footer';
import NotificationBar from '../components/NotificationBar';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: {
    default: 'Ecom Store',
    template: '%s | Ecom Store',
  },
  description: 'Your one-stop shop for everything you need',
  manifest: '/manifest.json',
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
        <NotificationBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
