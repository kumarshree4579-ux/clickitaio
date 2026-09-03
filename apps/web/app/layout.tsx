import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import SplashLoader from '../components/SplashLoader';
import ProfileCompletePrompt from '../components/ProfileCompletePrompt';
import { LocationProvider } from '../lib/LocationContext';
import GlobalLocationPrompt from '../components/GlobalLocationPrompt';
import RealtimeListener from '../components/RealtimeListener';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'Daily Basket',
    template: '%s | Daily Basket',
  },
  description: 'Your one-stop shop for everything you need',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo192.png',
    apple: '/logo192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Daily Basket',
  },
  openGraph: {
    type: 'website',
    siteName: 'Daily Basket',
    title: 'Daily Basket',
    description: 'Your one-stop shop for everything you need',
  },
};


async function getSettings() {
  try {
    // using absolute URL for server-side fetch
    const apiUrl = process.env.API_URL || 'http://127.0.0.1:4000';
    const res = await fetch(`${apiUrl}/settings/public`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  const themeStyles = settings?.appTheme ? {
    '--theme-primary': settings.appTheme.primaryColor || '#4f46e5',
    '--theme-primary-dark': settings.appTheme.primaryColor || '#4338ca', // Can add color mixing logic later, fallback to primary for now
    '--theme-primary-light': settings.appTheme.primaryColor ? `${settings.appTheme.primaryColor}20` : '#eef2ff', // 20 hex is ~12% opacity
    '--theme-secondary': settings.appTheme.secondaryColor || '#7c3aed',
    '--bg-image': settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none',
  } as React.CSSProperties : {
    '--theme-primary': '#4f46e5',
    '--theme-primary-dark': '#4338ca',
    '--theme-primary-light': '#eef2ff',
    '--theme-secondary': '#7c3aed',
    '--bg-image': 'none',
  } as React.CSSProperties;

  return (
    <html lang="en" className={`${geist.variable} h-full`} style={themeStyles}>
      <body className="min-h-full flex flex-col bg-gray-50" style={{ backgroundImage: 'var(--bg-image)', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
        <LocationProvider>
          <SplashLoader />
          <ProfileCompletePrompt />
          {children}
          <Footer />
          <MobileBottomNav />
          <GlobalLocationPrompt />
          <RealtimeListener />
        </LocationProvider>
      </body>
    </html>
  );
}
