import { useEffect } from 'react';

/**
 * Lightweight client-side SEO updater for the React SPA.
 * Synchronizes document.title, canonical URL, meta description, and robots state during client-side navigation.
 */
export default function SEOHead({
  title,
  description,
  canonicalPath = '',
  isIndexable = true,
}) {
  useEffect(() => {
    const fullTitle = title
      ? (title.includes('RaabtaNow') ? title : `${title} | RaabtaNow`)
      : 'Online Rishta in Pakistan | Pakistani Matrimonial Website | RaabtaNow';

    document.title = fullTitle;

    // Update Meta Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    // Update Canonical URL
    const canonicalUrl = `https://raabtanow.com${canonicalPath ? (canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`) : ''}`;
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (isIndexable) {
      if (!canonicalTag) {
        canonicalTag = document.createElement('link');
        canonicalTag.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalTag);
      }
      canonicalTag.setAttribute('href', canonicalUrl);
    } else if (canonicalTag) {
      canonicalTag.remove();
    }

    // Update Robots Meta
    let robotsTag = document.querySelector('meta[name="robots"]');
    if (!robotsTag) {
      robotsTag = document.createElement('meta');
      robotsTag.setAttribute('name', 'robots');
      document.head.appendChild(robotsTag);
    }
    robotsTag.setAttribute(
      'content',
      isIndexable
        ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        : 'noindex, nofollow, noarchive, nosnippet'
    );
  }, [title, description, canonicalPath, isIndexable]);

  return null;
}

