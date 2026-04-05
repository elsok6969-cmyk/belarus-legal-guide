import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://pravoby.by";

const STATIC_PAGES = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/documents", priority: "0.9", changefreq: "daily" },
  { url: "/calendar", priority: "0.8", changefreq: "weekly" },
  { url: "/rates", priority: "0.7", changefreq: "daily" },
  { url: "/news", priority: "0.7", changefreq: "daily" },
  { url: "/topics", priority: "0.7", changefreq: "weekly" },
  { url: "/experts", priority: "0.6", changefreq: "monthly" },
  { url: "/about", priority: "0.5", changefreq: "monthly" },
  { url: "/how-it-works", priority: "0.5", changefreq: "monthly" },
  { url: "/pricing", priority: "0.6", changefreq: "monthly" },
];

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: documents } = await supabase
    .from("documents")
    .select("slug, updated_at")
    .not("slug", "is", null)
    .order("updated_at", { ascending: false })
    .limit(5000);

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .not("published_at", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1000);

  const { data: topics } = await supabase
    .from("topics")
    .select("slug")
    .limit(500);

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const urls = [
    ...STATIC_PAGES.map(
      (p) => `  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    ),
    ...(documents || []).map(
      (d) => `  <url>
    <loc>${SITE_URL}/doc/${escape(d.slug)}</loc>
    ${d.updated_at ? `<lastmod>${d.updated_at.split("T")[0]}</lastmod>` : ""}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
    ),
    ...(articles || []).map(
      (a) => `  <url>
    <loc>${SITE_URL}/news/${escape(a.slug)}</loc>
    ${a.updated_at ? `<lastmod>${a.updated_at.split("T")[0]}</lastmod>` : ""}
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    ),
    ...(topics || []).map(
      (t) => `  <url>
    <loc>${SITE_URL}/topics/${escape(t.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
});
