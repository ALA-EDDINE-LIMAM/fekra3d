import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://fekra3d.tn';

export default function Seo({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  noindex = false,
  structuredData,
}) {
  const canonicalUrl = `${SITE_URL}${path}`;
  const imageUrl = image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl && (
        <>
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:alt" content={`${title} - Fekra3D`} />
          <meta name="twitter:image" content={imageUrl} />
        </>
      )}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}