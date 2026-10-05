import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SimulationProvider } from '@/context/simulation-context';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NIU — Network for Intelligent Urban Mobility',
  description:
    'Smarter movement. Cleaner cities. Intelligent urban mobility platform connecting commuters, vehicles, roads and traffic telemetry.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#090d16] text-[#f1f5f9]">
        <SimulationProvider>
          <Header />
          <div className="flex-1 flex max-w-7xl w-full mx-auto">
            <Sidebar />
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
              {children}
            </main>
          </div>
          <MobileNav />
        </SimulationProvider>
      </body>
    </html>
  );
}
