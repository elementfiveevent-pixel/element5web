import { useEffect, useRef, useState } from 'react';

type AdFormat = 'auto' | 'horizontal' | 'vertical' | 'rectangle';
type AdSlot = 'in-article' | 'sidebar' | 'header' | 'footer' | 'between-sections';

interface AdUnitProps {
  slot?: AdSlot;
  format?: AdFormat;
  className?: string;
  responsive?: boolean;
}

// AdSense client ID
const AD_CLIENT = 'ca-pub-1169163493596327';

// Map slots to recommended sizes
const slotConfig: Record<AdSlot, { format: AdFormat; style: React.CSSProperties }> = {
  'in-article': {
    format: 'auto',
    style: { display: 'block', textAlign: 'center' },
  },
  sidebar: {
    format: 'vertical',
    style: { display: 'block', minHeight: '250px' },
  },
  header: {
    format: 'horizontal',
    style: { display: 'block', height: '90px' },
  },
  footer: {
    format: 'horizontal',
    style: { display: 'block', height: '90px' },
  },
  'between-sections': {
    format: 'auto',
    style: { display: 'block', textAlign: 'center' },
  },
};

export const AdUnit = ({ 
  slot = 'in-article', 
  format,
  className = '',
  responsive = true 
}: AdUnitProps) => {
  const adRef = useRef<HTMLModElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check for cookie consent
    const consent = localStorage.getItem('cookie-consent');
    setHasConsent(consent === 'all');
  }, []);

  useEffect(() => {
    if (!hasConsent || isLoaded) return;

    try {
      // Push ad to AdSense
      ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle = 
        (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
      setIsLoaded(true);
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [hasConsent, isLoaded]);

  const config = slotConfig[slot];
  const adFormat = format || config.format;

  // Don't render if no consent
  if (!hasConsent) {
    return null;
  }

  return (
    <div 
      className={`ad-container overflow-hidden ${className}`}
      style={{ minHeight: responsive ? 'auto' : '100px' }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          ...config.style,
          width: '100%',
        }}
        data-ad-client={AD_CLIENT}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

// Wrapper for in-article ads with proper spacing
export const InArticleAd = ({ className = '' }: { className?: string }) => (
  <div className={`my-8 ${className}`}>
    <AdUnit slot="in-article" />
  </div>
);

// Wrapper for sidebar ads
export const SidebarAd = ({ className = '' }: { className?: string }) => (
  <div className={`sticky top-4 ${className}`}>
    <AdUnit slot="sidebar" format="vertical" />
  </div>
);

// Wrapper for between-section ads
export const SectionAd = ({ className = '' }: { className?: string }) => (
  <div className={`py-6 border-y border-border/50 my-8 ${className}`}>
    <p className="text-xs text-muted-foreground text-center mb-2">Advertisement</p>
    <AdUnit slot="between-sections" />
  </div>
);
