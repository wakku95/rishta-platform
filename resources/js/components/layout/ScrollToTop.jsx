import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop: Ensures navigating to any route (especially footer links, policy pages,
 * or navigation items) immediately displays the new page from the very top
 * instead of leaving the user stuck at the bottom/footer.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If there is an anchor hash (e.g., #policy-terms), scroll to that section
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id) || document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // Immediately reset scroll position to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [pathname, search, hash]);

  return null;
}
