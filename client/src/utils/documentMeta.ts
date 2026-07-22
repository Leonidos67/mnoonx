const DEFAULT_TITLE = 'MNOONX';
const DEFAULT_DESCRIPTION = 'MNOONX — Web3 social platform for posts, communities, and messaging';

export interface DocumentMetaOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  if (typeof document === 'undefined') return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Sets the document title plus description/OG/Twitter meta tags for the current page.
 * Call on mount (and again when the underlying entity id/name changes) from detail pages
 * like profiles, posts, and communities. Returns a cleanup function that restores defaults.
 */
export function setDocumentMeta(options: DocumentMetaOptions): () => void {
  const title = options.title?.trim() || DEFAULT_TITLE;
  const description = options.description?.trim() || DEFAULT_DESCRIPTION;
  const fullTitle = title === DEFAULT_TITLE ? title : `${title} · ${DEFAULT_TITLE}`;

  const previousTitle = document.title;
  document.title = fullTitle;

  upsertMetaTag('name', 'description', description);
  upsertMetaTag('property', 'og:title', fullTitle);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:type', options.type || 'website');
  if (options.url) upsertMetaTag('property', 'og:url', options.url);
  if (options.image) {
    upsertMetaTag('property', 'og:image', options.image);
    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:image', options.image);
  } else {
    upsertMetaTag('name', 'twitter:card', 'summary');
  }
  upsertMetaTag('name', 'twitter:title', fullTitle);
  upsertMetaTag('name', 'twitter:description', description);

  return () => {
    document.title = previousTitle;
    upsertMetaTag('name', 'description', DEFAULT_DESCRIPTION);
    upsertMetaTag('property', 'og:title', DEFAULT_TITLE);
    upsertMetaTag('property', 'og:description', DEFAULT_DESCRIPTION);
  };
}
