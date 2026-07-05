import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';
import { formatRelative, getGitHubInfo, getGitInfo } from '@/lib/last-modified';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <LastUpdated page={page} />
    </DocsPage>
  );
}

async function LastUpdated({
  page,
}: {
  page: NonNullable<ReturnType<typeof source.getPage>>;
}) {
  const file = `content/docs/${page.path}`;
  // Prefer the GitHub API (resolves the committer's GitHub username + commit
  // link); fall back to local git when the API is unavailable at build time.
  const info =
    (await getGitHubInfo(`${gitConfig.user}/${gitConfig.repo}`, file)) ??
    getGitInfo(file);
  if (!info) return null;

  const author = (page.data as { author?: string }).author || info.author;
  const when = formatRelative(info.date);

  return (
    <p className="text-fd-muted-foreground" style={{ margin: '2.5rem 0 1rem', fontSize: '0.8rem' }}>
      Last updated{' '}
      {info.url ? (
        <a href={info.url} target="_blank" rel="noreferrer">
          {when}
        </a>
      ) : (
        when
      )}
      {author ? ` by ${author}` : ''}
    </p>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/[[...slug]]'>,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
