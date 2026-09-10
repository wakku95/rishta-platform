import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal: Lightweight, performant on-scroll reveal wrapper.
 * Uses native IntersectionObserver with zero window scroll listeners.
 * 
 * @param {React.ReactNode} children
 * @param {string} className
 * @param {string} animation 'fade-up' | 'fade-in' | 'zoom-in'
 * @param {number} delay ms delay
 * @param {number} duration ms duration
 * @param {number} threshold intersection threshold
 * @param {boolean} once whether to animate only once
 */
export default function ScrollReveal({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  duration = 650,
  threshold = 0.08,
  once = true,
  as: Component = 'div',
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Fallback if IntersectionObserver is unsupported
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, once]);

  const getAnimationStyles = () => {
    switch (animation) {
      case 'fade-in':
        return isVisible ? 'opacity-100' : 'opacity-0';
      case 'zoom-in':
        return isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]';
      case 'fade-up':
      default:
        return isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';
    }
  };

  return (
    <Component
      ref={elementRef}
      className={`transition-all ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${isVisible ? '' : 'will-change-[opacity,transform]'} ${getAnimationStyles()} ${className}`}
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
