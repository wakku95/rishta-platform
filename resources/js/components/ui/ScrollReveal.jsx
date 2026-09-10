import React, { useEffect, useRef } from 'react';

/**
 * Singleton IntersectionObserver to eliminate multiple observer overhead
 * and prevent React re-renders during mobile momentum touch scrolling.
 */
let sharedObserver = null;
const observerCallbacks = new WeakMap();

function getSharedObserver() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cb = observerCallbacks.get(entry.target);
            if (cb) {
              cb(entry);
            }
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px',
      }
    );
  }
  return sharedObserver;
}

/**
 * ScrollReveal: Zero-re-render, GPU compositor-accelerated scroll reveal wrapper.
 * Directly toggles `.is-revealed` DOM class without invoking React state or reconciler.
 */
export default function ScrollReveal({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  duration = 500,
  as: Component = 'div',
  ...props
}) {
  const elementRef = useRef(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Accessibility check: immediately reveal if user prefers reduced motion
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-revealed');
      return;
    }

    const obs = getSharedObserver();
    if (!obs) {
      el.classList.add('is-revealed');
      return;
    }

    observerCallbacks.set(el, () => {
      el.classList.add('is-revealed');
      obs.unobserve(el);
      observerCallbacks.delete(el);
    });

    obs.observe(el);

    return () => {
      if (obs && el) {
        obs.unobserve(el);
        observerCallbacks.delete(el);
      }
    };
  }, []);

  const animClass =
    animation === 'fade-in'
      ? 'reveal-fade'
      : animation === 'zoom-in'
      ? 'reveal-zoom'
      : 'reveal-up';

  return (
    <Component
      ref={elementRef}
      className={`reveal-init ${animClass} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
