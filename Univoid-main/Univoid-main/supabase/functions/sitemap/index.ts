import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SITE_URL = "https://univoid.tech";

// Helper to create URL-safe slugs
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

Deno.serve(async (req) => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = {
    ...getCorsHeaders(req),
    "Content-Type": "application/xml",
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all approved content with categories/subjects for programmatic SEO
    const [materialsRes, eventsRes, projectsRes, booksRes, profilesRes] = await Promise.all([
      supabase.from("materials").select("id, updated_at, subject, course, branch").eq("status", "approved"),
      supabase.from("events").select("id, updated_at, category, venue_name, slug").eq("status", "published"),
      supabase.from("projects").select("id, updated_at, skills_required"),
      supabase.from("books").select("id, updated_at, category, slug, title, price").eq("status", "approved"),
      supabase.rpc("get_public_leaderboard", { limit_count: 100 }),
    ]);

    const materials = materialsRes.data || [];
    const events = eventsRes.data || [];
    const projects = projectsRes.data || [];
    const books = booksRes.data || [];
    const profiles = profilesRes.data || [];

    const today = new Date().toISOString().split("T")[0];

    // Extract unique subjects/courses/categories for programmatic SEO pages
    const materialSubjects = new Set<string>();
    const materialCourses = new Set<string>();
    const materialBranches = new Set<string>();
    const eventCategories = new Set<string>();
    const bookCategories = new Set<string>();

    materials.forEach((m) => {
      if (m.subject) materialSubjects.add(m.subject);
      if (m.course) materialCourses.add(m.course);
      if (m.branch) materialBranches.add(m.branch);
    });

    events.forEach((e) => {
      if (e.category) eventCategories.add(e.category);
    });

    books.forEach((b) => {
      if (b.category) bookCategories.add(b.category);
    });

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/materials", priority: "0.9", changefreq: "daily" },
      { loc: "/events", priority: "0.9", changefreq: "daily" },
      { loc: "/projects", priority: "0.8", changefreq: "daily" },
      { loc: "/books", priority: "0.8", changefreq: "daily" },
      { loc: "/leaderboard", priority: "0.6", changefreq: "weekly" },
      { loc: "/about-us", priority: "0.6", changefreq: "monthly" },
      { loc: "/contact", priority: "0.5", changefreq: "monthly" },
      { loc: "/faq", priority: "0.5", changefreq: "monthly" },
      { loc: "/privacy-policy", priority: "0.3", changefreq: "monthly" },
      { loc: "/terms", priority: "0.3", changefreq: "monthly" },
      { loc: "/refund-policy", priority: "0.3", changefreq: "monthly" },
      { loc: "/cookie-policy", priority: "0.3", changefreq: "monthly" },
      { loc: "/legal-disclaimer", priority: "0.3", changefreq: "monthly" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static pages
    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    // Add programmatic SEO pages for material subjects
    for (const subject of materialSubjects) {
      const slug = slugify(subject);
      if (slug) {
        xml += `
  <url>
    <loc>${SITE_URL}/materials?subject=${encodeURIComponent(subject)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    // Add programmatic SEO pages for material courses
    for (const course of materialCourses) {
      const slug = slugify(course);
      if (slug) {
        xml += `
  <url>
    <loc>${SITE_URL}/materials?course=${encodeURIComponent(course)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    // Add programmatic SEO pages for material branches
    for (const branch of materialBranches) {
      const slug = slugify(branch);
      if (slug) {
        xml += `
  <url>
    <loc>${SITE_URL}/materials?branch=${encodeURIComponent(branch)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    // Add programmatic SEO pages for event categories
    for (const category of eventCategories) {
      const slug = slugify(category);
      if (slug) {
        xml += `
  <url>
    <loc>${SITE_URL}/events?category=${encodeURIComponent(category)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    // Add programmatic SEO pages for book categories
    for (const category of bookCategories) {
      const slug = slugify(category);
      if (slug) {
        xml += `
  <url>
    <loc>${SITE_URL}/books?category=${encodeURIComponent(category)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }

    // Add individual materials
    for (const item of materials) {
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/materials/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Add individual events (ONLY use slug for SEO - skip events without slugs to prevent redirect issues)
    for (const item of events) {
      // Skip events without slugs to avoid redirect chains in Google indexing
      if (!item.slug) {
        console.warn(`Event ${item.id} has no slug, skipping in sitemap`);
        continue;
      }
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/events/${item.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Add individual projects
    for (const item of projects) {
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/projects/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    // Add individual books (ONLY use database slug to prevent redirect issues)
    for (const item of books) {
      // Skip books without slugs to avoid redirect chains in Google indexing
      if (!item.slug) {
        console.warn(`Book ${item.id} has no slug, skipping in sitemap`);
        continue;
      }
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/books/${item.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Add profile/rank pages
    for (const profile of profiles) {
      xml += `
  <url>
    <loc>${SITE_URL}/profile/${profile.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    console.log(`Generated sitemap with ${materials.length} materials, ${events.length} events, ${projects.length} projects, ${books.length} books, ${profiles.length} profiles`);
    console.log(`Programmatic pages: ${materialSubjects.size} subjects, ${materialCourses.size} courses, ${eventCategories.size} event categories, ${bookCategories.size} book categories`);

    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: corsHeaders,
      status: 500,
    });
  }
});
