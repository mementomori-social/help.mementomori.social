import { getPageImage, source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { appName } from '@/lib/shared';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const revalidate = false;

const skull = `data:image/png;base64,${readFileSync(
  join(process.cwd(), 'public/skull.png'),
).toString('base64')}`;

function clamp(value: string | undefined, max: number) {
  if (!value) return '';
  const s = value.trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export async function GET(
  _req: Request,
  { params }: RouteContext<'/og/docs/[...slug]'>,
) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  const title = clamp(page.data.title, 85);
  const description = clamp(page.data.description, 135);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#1e2028',
          padding: '72px 80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={skull} width={52} height={52} alt="" />
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              fontWeight: 600,
              color: '#8b8dff',
            }}
          >
            {appName}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 42 ? 60 : 72,
              fontWeight: 700,
              color: '#f2f0e9',
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                display: 'flex',
                fontSize: 30,
                color: '#9aa0ad',
                lineHeight: 1.4,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            height: 12,
            borderRadius: 8,
            background: '#6364ff',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
