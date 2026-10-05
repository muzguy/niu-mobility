import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/theme-context';
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('niu-theme')||'dark';if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');}else{document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-[#f1f5f9] transition-colors duration-150">
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}

