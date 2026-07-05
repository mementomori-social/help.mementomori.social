import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/skull.png"
            alt=""
            aria-hidden
            width={22}
            height={22}
            style={{ display: 'inline-block' }}
          />
          <span style={{ fontWeight: 600 }}>{appName}</span>
        </>
      ),
      transparentMode: 'top',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
