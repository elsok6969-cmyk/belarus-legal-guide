import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://belarus-legal-guide.lovable.app';
const DEFAULT_OG_IMAGE = '';

interface PageSEOProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function PageSEO({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd,
}: PageSEOProps) {
  const fullTitle = title;
  const url = SITE_URL ? `${SITE_URL}${path}` : path;

  const jsonLdItems = jsonLd
    ? Array.isArray(jsonLd) ? jsonLd : [jsonLd]
    : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:locale" content="ru_BY" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {jsonLdItems.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
