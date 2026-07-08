import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SITE_URL = "https://univoid.tech";
const DEFAULT_OG_IMAGE = "https://univoid.tech/images/univoid-og.jpg";

/**
 * Convert a stored "bucket:path" value to a publicly accessible image URL
 * via the image-proxy edge function.
 */
function toPublicImageUrl(storedValue: string | null | undefined): string | null {
  if (!storedValue) return null;

  // Already a full URL (external or legacy)
  if (storedValue.startsWith('http://') || storedValue.startsWith('https://')) {
    return storedValue;
  }

  // "bucket:path" format → proxy through image-proxy edge function
  const colonIdx = storedValue.indexOf(':');
  if (colonIdx > 0) {
    const bucket = storedValue.substring(0, colonIdx);
    const path = storedValue.substring(colonIdx + 1);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const params = new URLSearchParams({ bucket, path });
    return `${supabaseUrl}/functions/v1/image-proxy?${params.toString()}`;
  }

  return null;
}

// Bot User-Agent detection patterns
const BOT_PATTERNS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'slackbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'applebot',
  'rogerbot',
  'embedly',
  'quora link preview',
  'outbrain',
  'showyoubot',
  'vkshare',
  'w3c_validator',
  'redditbot',
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Type definitions for database records
interface Material {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  course: string | null;
  branch: string | null;
  thumbnail_url: string | null;
  downloads_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  category: string;
  start_date: string;
  end_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  flyer_url: string | null;
  is_paid: boolean;
  price: number | null;
  registrations_count: number;
  slug: string | null;
}

interface Book {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  category: string | null;
  condition: string | null;
  price: number | null;
  is_sold: boolean;
  image_urls: string[] | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  skills_required: string[] | null;
  max_members: number | null;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  subject: string | null;
  budget: number | null;
  deadline: string | null;
  status: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  college_name: string | null;
  branch: string | null;
  total_xp: number;
  profile_photo_url: string | null;
}

function generateHTML(data: {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  content: string;
  structuredData?: Record<string, unknown>;
}): string {
  const { title, description, image, url, type, content, structuredData } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(truncate(description, 160))}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(truncate(description, 160))}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:type" content="${escapeHtml(type)}">
  <meta property="og:site_name" content="UniVoid">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(truncate(description, 160))}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta name="twitter:site" content="@UniVoid">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${escapeHtml(url)}">
  
  ${structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>` : ''}
  
  <!-- Redirect to SPA after a short delay for actual users -->
  <noscript>
    <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}">
  </noscript>
</head>
<body>
  <main>
    ${content}
  </main>
  <script>
    // Redirect actual users to the SPA
    window.location.replace("${url}");
  </script>
</body>
</html>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMaterial(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) {
    console.log('Material not found:', id, error);
    return null;
  }

  const material = data as Material;
  const title = `${material.title} | Study Materials | UniVoid`;
  const description = material.description || `Download ${material.title} - ${material.subject || 'Study Material'} for ${material.course || 'students'}. Free PDF notes, study materials and resources on UniVoid.`;
  const image = material.thumbnail_url || DEFAULT_OG_IMAGE;
  const url = `${SITE_URL}/materials/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    "name": material.title,
    "description": description,
    "url": url,
    "image": image,
    "datePublished": material.created_at,
    "dateModified": material.updated_at,
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
  };

  const content = `
    <article>
      <h1>${escapeHtml(material.title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${material.subject ? `<p>Subject: ${escapeHtml(material.subject)}</p>` : ''}
      ${material.course ? `<p>Course: ${escapeHtml(material.course)}</p>` : ''}
      ${material.branch ? `<p>Branch: ${escapeHtml(material.branch)}</p>` : ''}
      <p>Downloads: ${material.downloads_count || 0}</p>
      <p>Views: ${material.views_count || 0}</p>
      <a href="${url}">View and Download on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image, url, type: 'article', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEvent(supabase: any, identifier: string) {
  // Check if it looks like a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'published');
    
  if (isUUID) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier);
  }
  
  const { data, error } = await query.single();

  if (error || !data) {
    console.log('Event not found:', identifier, error);
    return null;
  }

  const event = data as Event;
  const title = `${event.title} | Events | UniVoid`;
  const description = event.description || `Register for ${event.title} - ${event.category} event${event.venue_name ? ` at ${event.venue_name}` : ''}. Join now on UniVoid!`;
  // IMPORTANT: Use flyer_url for social preview image, resolved to a public URL
  const image = toPublicImageUrl(event.flyer_url) || DEFAULT_OG_IMAGE;
  // Use slug for canonical URL
  const eventSlug = event.slug || event.id;
  const url = `${SITE_URL}/events/${eventSlug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": description,
    "url": url,
    "image": image,
    "startDate": event.start_date,
    ...(event.end_date && { "endDate": event.end_date }),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": event.venue_name
      ? "https://schema.org/OfflineEventAttendanceMode"
      : "https://schema.org/OnlineEventAttendanceMode",
    ...(event.venue_name && {
      "location": {
        "@type": "Place",
        "name": event.venue_name,
        "address": event.venue_address || event.venue_name
      }
    }),
    "organizer": {
      "@type": "Organization",
      "name": "UniVoid",
      "url": SITE_URL
    },
    ...(event.is_paid && event.price && {
      "offers": {
        "@type": "Offer",
        "price": event.price,
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": url
      }
    })
  };

  const content = `
    <article>
      <h1>${escapeHtml(event.title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p>Category: ${escapeHtml(event.category)}</p>
      <p>Date: ${formatDate(event.start_date)}</p>
      ${event.venue_name ? `<p>Venue: ${escapeHtml(event.venue_name)}</p>` : ''}
      ${event.venue_address ? `<p>Address: ${escapeHtml(event.venue_address)}</p>` : ''}
      ${event.is_paid ? `<p>Price: ₹${event.price}</p>` : '<p>Free Entry</p>'}
      <p>Registrations: ${event.registrations_count || 0}</p>
      <a href="${url}">Register on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image, url, type: 'event', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBook(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) {
    console.log('Book not found:', id, error);
    return null;
  }

  const book = data as Book;
  const title = `${book.title} | Books | UniVoid`;
  const description = book.description || `Buy ${book.title}${book.author ? ` by ${book.author}` : ''} - ${book.category || 'Book'} available on UniVoid book marketplace.`;
  const image = toPublicImageUrl(book.image_urls?.[0]) || DEFAULT_OG_IMAGE;
  const url = `${SITE_URL}/books/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": book.title,
    "description": description,
    "image": image,
    "url": url,
    ...(book.author && { "author": { "@type": "Person", "name": book.author } }),
    "category": book.category || "Book",
    "offers": {
      "@type": "Offer",
      "price": book.price || 0,
      "priceCurrency": "INR",
      "availability": book.is_sold
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "UniVoid Marketplace"
      }
    },
    ...(book.condition && { "itemCondition": `https://schema.org/${book.condition === 'new' ? 'NewCondition' : 'UsedCondition'}` })
  };

  const content = `
    <article>
      <h1>${escapeHtml(book.title)}</h1>
      ${book.author ? `<p>Author: ${escapeHtml(book.author)}</p>` : ''}
      <p>${escapeHtml(description)}</p>
      ${book.category ? `<p>Category: ${escapeHtml(book.category)}</p>` : ''}
      ${book.condition ? `<p>Condition: ${escapeHtml(book.condition)}</p>` : ''}
      <p>Price: ₹${book.price || 'Contact Seller'}</p>
      <p>Status: ${book.is_sold ? 'Sold' : 'Available'}</p>
      <a href="${url}">View on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image, url, type: 'product', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleProject(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.log('Project not found:', id, error);
    return null;
  }

  const project = data as Project;
  const skills = project.skills_required?.join(', ') || '';
  const title = `${project.title} | Project Partner | UniVoid`;
  const description = project.description || `Join ${project.title} project${skills ? `. Skills needed: ${skills}` : ''}. Find project partners on UniVoid.`;
  const url = `${SITE_URL}/projects/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": project.title,
    "description": description,
    "url": url,
    "datePublished": project.created_at,
    "dateModified": project.updated_at,
    "creator": {
      "@type": "Organization",
      "name": "UniVoid"
    },
    ...(skills && { "keywords": skills })
  };

  const content = `
    <article>
      <h1>${escapeHtml(project.title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${skills ? `<p>Skills Required: ${escapeHtml(skills)}</p>` : ''}
      <p>Team Size: ${project.max_members || 'Flexible'}</p>
      <p>Status: ${project.is_open ? 'Open for Applications' : 'Closed'}</p>
      <a href="${url}">View Project on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image: DEFAULT_OG_IMAGE, url, type: 'article', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTask(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('task_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.log('Task not found:', id, error);
    return null;
  }

  const task = data as Task;
  const title = `${task.title} | Task Plaza | UniVoid`;
  const description = task.description || `${task.task_type} task${task.subject ? ` for ${task.subject}` : ''}. Budget: ₹${task.budget || 'Negotiable'}. Get help on UniVoid Task Plaza.`;
  const url = `${SITE_URL}/tasks/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": task.title,
    "description": description,
    "url": url,
    "datePosted": task.created_at,
    ...(task.deadline && { "validThrough": task.deadline }),
    "hiringOrganization": {
      "@type": "Organization",
      "name": "UniVoid Task Plaza"
    },
    ...(task.budget && {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": task.budget
      }
    }),
    "employmentType": "TEMPORARY"
  };

  const content = `
    <article>
      <h1>${escapeHtml(task.title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p>Type: ${escapeHtml(task.task_type)}</p>
      ${task.subject ? `<p>Subject: ${escapeHtml(task.subject)}</p>` : ''}
      <p>Budget: ₹${task.budget || 'Negotiable'}</p>
      ${task.deadline ? `<p>Deadline: ${formatDate(task.deadline)}</p>` : ''}
      <p>Status: ${task.status || 'Open'}</p>
      <a href="${url}">View Task on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image: DEFAULT_OG_IMAGE, url, type: 'article', content, structuredData });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleProfile(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, college_name, branch, total_xp, profile_photo_url')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.log('Profile not found:', id, error);
    return null;
  }

  const profile = data as Profile;
  const title = `${profile.full_name} | Student Profile | UniVoid`;
  const description = `${profile.full_name}${profile.college_name ? ` from ${profile.college_name}` : ''}${profile.branch ? `, ${profile.branch}` : ''}. XP: ${profile.total_xp || 0}. View profile on UniVoid.`;
  const image = toPublicImageUrl(profile.profile_photo_url) || DEFAULT_OG_IMAGE;
  const url = `${SITE_URL}/profile/${id}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profile.full_name,
    "url": url,
    "image": image,
    ...(profile.college_name && {
      "affiliation": {
        "@type": "EducationalOrganization",
        "name": profile.college_name
      }
    })
  };

  const content = `
    <article>
      <h1>${escapeHtml(profile.full_name)}</h1>
      ${profile.college_name ? `<p>College: ${escapeHtml(profile.college_name)}</p>` : ''}
      ${profile.branch ? `<p>Branch: ${escapeHtml(profile.branch)}</p>` : ''}
      <p>XP: ${profile.total_xp || 0}</p>
      <a href="${url}">View Profile on UniVoid</a>
    </article>
  `;

  return generateHTML({ title, description, image, url, type: 'profile', content, structuredData });
}

Deno.serve(async (req) => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const url = new URL(req.url);
    const pathParam = url.searchParams.get('path');
    const userAgent = req.headers.get('user-agent') || '';

    console.log('Prerender request:', { path: pathParam, userAgent: userAgent.substring(0, 100), isBot: isBot(userAgent) });

    // Only serve pre-rendered content to bots
    if (!isBot(userAgent)) {
      console.log('Not a bot, redirecting to SPA');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': pathParam ? `${SITE_URL}${pathParam}` : SITE_URL
        }
      });
    }

    if (!pathParam) {
      return new Response('Missing path parameter', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let html: string | null = null;

    // Parse the path and handle different content types
    const materialsMatch = pathParam.match(/^\/materials\/([a-f0-9-]+)$/);
    const eventsMatch = pathParam.match(/^\/events\/([a-zA-Z0-9_-]+)$/);
    const booksMatch = pathParam.match(/^\/books\/([a-f0-9-]+)$/);
    const projectsMatch = pathParam.match(/^\/projects\/([a-f0-9-]+)$/);
    const tasksMatch = pathParam.match(/^\/tasks\/([a-f0-9-]+)$/);
    const profileMatch = pathParam.match(/^\/profile\/([a-f0-9-]+)$/);

    if (materialsMatch) {
      html = await handleMaterial(supabase, materialsMatch[1]);
    } else if (eventsMatch) {
      html = await handleEvent(supabase, eventsMatch[1]);
    } else if (booksMatch) {
      html = await handleBook(supabase, booksMatch[1]);
    } else if (projectsMatch) {
      html = await handleProject(supabase, projectsMatch[1]);
    } else if (tasksMatch) {
      html = await handleTask(supabase, tasksMatch[1]);
    } else if (profileMatch) {
      html = await handleProfile(supabase, profileMatch[1]);
    }

    if (html) {
      console.log('Serving pre-rendered HTML for:', pathParam);
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400'
        }
      });
    }

    // If no content found or path not matched, redirect to SPA
    console.log('No pre-rendered content, redirecting to SPA:', pathParam);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${SITE_URL}${pathParam}`
      }
    });

  } catch (error) {
    console.error("Prerender error:", error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: corsHeaders
    });
  }
});
