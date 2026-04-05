import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://pravoby.by';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

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
  const fullTitle = title.includes('ПравоБУ') ? title : `${title} | ПравоБУ`;
  const url = `${SITE_URL}${path}`;

  // Normalize jsonLd to array
  const jsonLdItems = jsonLd
    ? Array.isArray(jsonLd) ? jsonLd : [jsonLd]
    : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="ru_BY" />
      <meta property="og:site_name" content="ПравоБУ" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {jsonLdItems.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
