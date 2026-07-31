import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { AssistantWidget } from '@/components/assistant/AssistantWidget';

export const metadata: Metadata = {
  title: 'Formazione ADL',
  description: 'Formazione ADL: corsi, manuali, video, quiz e mini giochi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">{children}</main>
            </div>
          </div>
          <AssistantWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
