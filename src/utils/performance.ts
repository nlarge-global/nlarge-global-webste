// Performance optimization utilities for SEO

// Lazy loading utility for images
export const optimizeImage = (src: string, alt: string, priority = false) => ({
  src,
  alt,
  loading: priority ? 'eager' : 'lazy',
  decoding: 'async',
  fetchPriority: priority ? 'high' : 'auto',
});

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window !== 'undefined') {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap';
    fontLink.as = 'style';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);

    // Preload critical images
    const logoPreload = document.createElement('link');
    logoPreload.rel = 'preload';
    logoPreload.href = '/logo.png';
    logoPreload.as = 'image';
    document.head.appendChild(logoPreload);
  }
};

// Service Worker registration for offline functionality
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
    }
  }
};

// Web Vitals tracking for Core Web Vitals optimization
export const trackWebVitals = ({ name, value, id }: { name: string; value: number; id: string }) => {
  // Send to analytics service
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, {
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    });
  }
};

// Critical CSS inlining utility
export const inlineCriticalCSS = () => {
  return `
    /* Critical CSS for above-the-fold content */
    html {
      scroll-behavior: smooth;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #ffffff;
      color: #000000;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Navigation critical styles */
    nav {
      position: fixed;
      top: 0;
      width: 100%;
      z-index: 50;
      transition: all 0.3s ease;
    }
    
    /* Hero section critical styles */
    .hero-section {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    /* Font display optimization */
    @font-face {
      font-family: 'Inter';
      font-display: swap;
    }
    
    @font-face {
      font-family: 'Cormorant Garamond';
      font-display: swap;
    }
  `;
};