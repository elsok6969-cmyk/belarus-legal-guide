import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://babijon.by";

const STATIC_PAGES = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/codex", priority: "0.9", changefreq: "weekly" },
  { url: "/currencies", priority: "0.8", changefreq: "daily" },
  { url: "/calendar", priority: "0.8", changefreq: "weekly" },
  { url: "/calculator", priority: "0.7", changefreq: "monthly" },
  { url: "/calculator/nds", priority: "0.7" },
  { url: "/calculator/income-tax", priority: "0.7" },
  { url: "/calculator/tax-penalty", priority: "0.6" },
  { url: "/calculator/vacation-pay", priority: "0.6" },
  { url: "/calculator/work-experience", priority: "0.6" },
  { url: "/calculator/statute-of-limitations", priority: "0.6" },
  { url: "/calculator/alimony", priority: "0.6" },
  { url: "/calculator/sick-leave", priority: "0.6" },
  { url: "/calculator/business-trip", priority: "0.6" },
  { url: "/calculator/rent", priority: "0.6" },
  { url: "/pricing", priority: "0.5", changefreq: "monthly" },
  { url: "/news", priority: "0.7", changefreq: "daily" },
  { url: "/production-calendar", priority: "0.6" },
  { url: "/about", priority: "0.3", changefreq: "monthly" },
  { url: "/terms", priority: "0.2" },
  { url: "/privacy", priority: "0.2" },
];

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: documents } = await supabase
    .from("documents")
    .select("id, slug, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(5000);
    .order("updated_at", { ascending: false })
    .limit(5000);

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .not("published_at", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1000);

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const urls = [
    ...STATIC_PAGES.map(
      (p) => `  <url>
    <loc>${SITE_URL}${p.url}</loc>${p.changefreq ? `\n    <changefreq>${p.changefreq}</changefreq>` : ""}
    <priority>${p.priority}</priority>
  </url>`
    ),
    ...(documents || []).map(
      (d) => `  <url>
    <loc>${SITE_URL}/documents/${escape(d.slug || d.id)}</loc>${d.updated_at ? `\n    <lastmod>${d.updated_at.split("T")[0]}</lastmod>` : ""}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
    ),
    ...(articles || []).map(
      (a) => `  <url>
    <loc>${SITE_URL}/news/${escape(a.slug)}</loc>${a.updated_at ? `\n    <lastmod>${a.updated_at.split("T")[0]}</lastmod>` : ""}
    <changefreq>monthly</changefreq>
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
