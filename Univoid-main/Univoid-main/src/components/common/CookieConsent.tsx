import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

type ConsentType = 'all' | 'necessary' | null;

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show immediately - no artificial delay
      setShowBanner(true);
    }
  }, []);

  const handleConsent = (type: ConsentType) => {
    localStorage.setItem('cookie-consent', type || 'necessary');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);

    // Enable/disable analytics based on consent
    if (type === 'all') {
      // Enable Google Analytics and AdSense personalization
      window.gtag?.('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_personalization: 'granted',
        ad_user_data: 'granted',
      });
    } else {
      // Only necessary cookies - disable tracking
      window.gtag?.('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_personalization: 'denied',
        ad_user_data: 'denied',
      });
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-5 duration-300">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              🍪 We value your privacy
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              We use cookies to enhance your browsing experience, serve personalized ads, and analyze our traffic. 
              By clicking "Accept All", you consent to our use of cookies.{' '}
              <Link 
                to="/cookie-policy" 
                className="text-primary hover:underline font-medium"
              >
                Learn more
              </Link>
            </p>
            
            {showDetails && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Necessary Cookies</h4>
                    <p className="text-muted-foreground text-xs">
                      Essential for the website to function properly. Cannot be disabled.
                    </p>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-500/10 px-2 py-0.5 rounded">Always Active</span>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Analytics Cookies</h4>
                    <p className="text-muted-foreground text-xs">
                      Help us understand how visitors interact with our website (Google Analytics).
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Advertising Cookies</h4>
                    <p className="text-muted-foreground text-xs">
                      Used to deliver personalized advertisements via Google AdSense.
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <Link 
                    to="/cookie-policy" 
                    className="text-xs text-primary hover:underline"
                  >
                    View full Cookie Policy →
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => handleConsent('necessary')}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="order-3 sm:order-1"
          >
            {showDetails ? 'Hide Details' : 'Cookie Settings'}
          </Button>
          <div className="flex gap-3 sm:ml-auto order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConsent('necessary')}
              className="flex-1 sm:flex-none"
            >
              Necessary Only
            </Button>
            <Button
              size="sm"
              onClick={() => handleConsent('all')}
              className="flex-1 sm:flex-none"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
