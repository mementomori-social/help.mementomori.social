'use client';

import { use, useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

export function Mermaid({ chart }: { chart: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <MermaidContent chart={chart} />;
}

const cache = new Map<string, Promise<unknown>>();

function cachePromise<T>(key: string, setPromise: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached as Promise<T>;

  const promise = setPromise();
  cache.set(key, promise);
  return promise;
}

// Mementomori palette: dark #1e2028 surfaces + Mastodon blurple accent.
function themeVariables(dark: boolean) {
  return dark
    ? {
        background: 'transparent',
        primaryColor: '#282c37',
        primaryTextColor: '#e9eaf2',
        primaryBorderColor: '#8b8dff',
        secondaryColor: '#23252e',
        tertiaryColor: '#23252e',
        tertiaryBorderColor: '#3a3d4a',
        lineColor: '#9aa0ad',
        textColor: '#e9eaf2',
        clusterBkg: '#23252e',
        clusterBorder: '#3a3d4a',
        nodeBorder: '#8b8dff',
        edgeLabelBackground: '#1e2028',
        fontFamily: 'inherit',
      }
    : {
        background: 'transparent',
        primaryColor: '#eef0ff',
        primaryTextColor: '#20222b',
        primaryBorderColor: '#5149e9',
        secondaryColor: '#f4f5ff',
        tertiaryColor: '#f4f5ff',
        tertiaryBorderColor: '#d6d9f2',
        lineColor: '#6b7280',
        textColor: '#20222b',
        clusterBkg: '#f4f5ff',
        clusterBorder: '#d6d9f2',
        nodeBorder: '#5149e9',
        edgeLabelBackground: '#ffffff',
        fontFamily: 'inherit',
      };
}

function MermaidContent({ chart }: { chart: string }) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const { default: mermaid } = use(
    cachePromise('mermaid', () => import('mermaid')),
  );

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: 'inherit',
    theme: 'base',
    themeVariables: themeVariables(dark),
  });

  const { svg, bindFunctions } = use(
    cachePromise(`${chart}-${resolvedTheme}`, () => {
      return mermaid.render(id, chart.replaceAll('\\n', '\n'));
    }),
  );

  return (
    <div
      className="mermaid-diagram"
      ref={(container) => {
        if (container) bindFunctions?.(container);
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
