import { Helmet } from "react-helmet";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product" | "event" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
  // Enhanced SEO props
  locale?: string;
  siteName?: string;
  twitterHandle?: string;
  alternateUrls?: { hreflang: string; href: string }[];
  breadcrumbs?: { name: string; url: string }[];
  price?: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
}

const DEFAULT_OG_IMAGE = "https://univoid.tech/images/univoid-og.jpg";
const SITE_URL = "https://univoid.tech";
const SITE_NAME = "UniVoid";
const TWITTER_HANDLE = "@UniVoid";

// Helper to generate breadcrumb structured data
const generateBreadcrumbData = (breadcrumbs: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": crumb.name,
    "item": crumb.url.startsWith("http") ? crumb.url : `${SITE_URL}${crumb.url}`
  }))
});

// Helper to generate organization structured data
const generateOrganizationData = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "UniVoid",
  "url": SITE_URL,
  "logo": `${SITE_URL}/favicon.png`,
  "description": "India's largest student learning platform for study materials, events, and opportunities.",
  "sameAs": [
    "https://twitter.com/UniVoid",
    "https://instagram.com/univoid.tech"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": `${SITE_URL}/contact`
  }
});

// Helper to generate website search action
const generateWebsiteSearchData = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "UniVoid",
  "url": SITE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${SITE_URL}/materials?search={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
});

export const SEOHead = ({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  keywords,
  noIndex = false,
  structuredData,
  locale = "en_IN",
  siteName = SITE_NAME,
  twitterHandle = TWITTER_HANDLE,
  alternateUrls,
  breadcrumbs,
  price,
  currency = "INR",
  availability,
}: SEOHeadProps) => {
  const fullTitle = title.includes("UniVoid") ? title : `${title} | UniVoid`;
  const fullUrl = url ? (url.startsWith("http") ? url : `${SITE_URL}${url}`) : SITE_URL;
  const ogImage = image || DEFAULT_OG_IMAGE;
  const fullImageUrl = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;
  const truncatedDesc = description.length > 160 ? description.substring(0, 157) + "..." : description;

  // Combine all structured data
  const allStructuredData = [];
  
  // Add organization data on homepage
  if (url === "/" || !url) {
    allStructuredData.push(generateOrganizationData());
    allStructuredData.push(generateWebsiteSearchData());
  }
  
  // Add breadcrumb data if provided
  if (breadcrumbs && breadcrumbs.length > 0) {
    allStructuredData.push(generateBreadcrumbData(breadcrumbs));
  }
  
  // Add custom structured data
  if (structuredData) {
    allStructuredData.push({
      "@context": "https://schema.org",
      ...structuredData,
    });
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={truncatedDesc} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Keywords */}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      
      {/* Author */}
      {author && <meta name="author" content={author} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncatedDesc} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Article specific OG tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      
      {/* Product specific OG tags */}
      {type === "product" && price !== undefined && (
        <meta property="product:price:amount" content={String(price)} />
      )}
      {type === "product" && price !== undefined && (
        <meta property="product:price:currency" content={currency} />
      )}
      {type === "product" && price !== undefined && availability && (
        <meta
          property="product:availability"
          content={availability === "InStock" ? "in stock" : availability === "OutOfStock" ? "out of stock" : "preorder"}
        />
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncatedDesc} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Alternate language URLs */}
      {alternateUrls && alternateUrls.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
      
      {/* Mobile optimization */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#6366f1" />
      
      {/* Structured Data */}
      {allStructuredData.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(allStructuredData.length === 1 ? allStructuredData[0] : allStructuredData)}
        </script>
      )}
    </Helmet>
  );
};

// Export helpers for use in page components
export const generateEventStructuredData = (event: {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  venue?: string;
  address?: string;
  price?: number;
  image?: string;
  url: string;
}) => ({
  "@type": "Event",
  "name": event.title,
  "description": event.description,
  "startDate": event.startDate,
  ...(event.endDate && { "endDate": event.endDate }),
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": event.venue 
    ? "https://schema.org/OfflineEventAttendanceMode" 
    : "https://schema.org/OnlineEventAttendanceMode",
  ...(event.venue && {
    "location": {
      "@type": "Place",
      "name": event.venue,
      "address": event.address || event.venue
    }
  }),
  "organizer": {
    "@type": "Organization",
    "name": "UniVoid",
    "url": SITE_URL
  },
  ...(event.price !== undefined && {
    "offers": {
      "@type": "Offer",
      "price": event.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": event.url
    }
  }),
  "image": event.image || DEFAULT_OG_IMAGE,
  "url": event.url
});

export const generateMaterialStructuredData = (material: {
  title: string;
  description?: string;
  subject?: string;
  course?: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}) => ({
  "@type": "DigitalDocument",
  "name": material.title,
  "description": material.description,
  "url": material.url,
  "image": material.image || DEFAULT_OG_IMAGE,
  "datePublished": material.datePublished,
  ...(material.dateModified && { "dateModified": material.dateModified }),
  "provider": {
    "@type": "Organization",
    "name": "UniVoid",
    "url": SITE_URL
  },
  "audience": {
    "@type": "EducationalAudience",
    "educationalRole": "student"
  },
  ...(material.subject && { "about": material.subject }),
  ...(material.course && { "educationalLevel": material.course })
});

export const generateProductStructuredData = (product: {
  title: string;
  description?: string;
  price: number;
  image?: string;
  url: string;
  availability?: "InStock" | "OutOfStock";
  condition?: "new" | "used";
}) => ({
  "@type": "Product",
  "name": product.title,
  "description": product.description,
  "image": product.image || DEFAULT_OG_IMAGE,
  "url": product.url,
  "offers": {
    "@type": "Offer",
    "price": product.price,
    "priceCurrency": "INR",
    "availability": product.availability === "OutOfStock" 
      ? "https://schema.org/OutOfStock" 
      : "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "UniVoid Marketplace"
    }
  },
  ...(product.condition && { 
    "itemCondition": `https://schema.org/${product.condition === "new" ? "NewCondition" : "UsedCondition"}` 
  })
});

export default SEOHead;
