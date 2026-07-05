import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { Provider } from '@/components/provider';
import { baseOptions } from '@/lib/layout.shared';
import { appName } from '@/lib/shared';
import { source } from '@/lib/source';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://help.mementomori.social'),
  title: {
    default: `${appName} help`,
    template: `%s — ${appName} help`,
  },
  description:
    'Documentation, help, and tips for Mementomori.social, a Finnish Mastodon community.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1e2028' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>
          <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
            {children}
          </DocsLayout>
        </Provider>
      </body>
    </html>
  );
}
