import { useEffect } from 'react';

/**
 * Tawk.to Live Chat Widget.
 * Injects Tawk.to widget script into the DOM dynamically.
 * Configurable via window.TAWKTO_PROPERTY_ID or import.meta.env.VITE_TAWKTO_PROPERTY_ID.
 */
export default function TawkToChat({ 
  propertyId = '6ad7ca018e1f2934c918420a', 
  widgetId = '1k5deq690' 
}) {
  useEffect(() => {
    // If already loaded by welcome.blade.php or previous mount, skip
    if (window.Tawk_API && window.Tawk_API.isChatStarted) return;
    if (document.getElementById('tawk-script')) return;

    const propId = propertyId || import.meta.env.VITE_TAWKTO_PROPERTY_ID || '6ad7ca018e1f2934c918420a';
    const widId = widgetId || import.meta.env.VITE_TAWKTO_WIDGET_ID || '1k5deq690';

    if (!propId) {
      return;
    }

    if (document.getElementById('tawk-script')) {
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement('script');
    s1.id = 'tawk-script';
    s1.async = true;
    s1.src = `https://embed.tawk.to/${propId}/${widId}`;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');

    const s0 = document.getElementsByTagName('script')[0];
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    } else {
      document.head.appendChild(s1);
    }
  }, [propertyId, widgetId]);

  return null;
}
