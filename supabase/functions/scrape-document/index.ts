import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function scrapeUrl(apiKey: string, url: string): Promise<string | null> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!resp.ok) {
      console.error(`Scrape failed ${url}: ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    return data.data?.markdown || data.markdown || null;
  } catch (e) {
    console.error(`Scrape error ${url}:`, e);
    return null;
  }
}

interface Section {
  heading: string;
  content: string;
  level: number;
  sort_order: number;
}

function cleanMarkdown(markdown: string): string {
  // Remove social sharing links and navigation junk from beginning
  const lines = markdown.split("\n");
  let startIdx = 0;

  // Find where actual content starts — look for "ОБЩАЯ ЧАСТЬ", "Раздел", "Глава 1", "Статья 1" etc.
  for (let i = 0; i < Math.min(lines.length, 200); i++) {
    const line = lines[i].trim();
    if (
      /^(ОБЩАЯ ЧАСТЬ|ОСОБЕННАЯ ЧАСТЬ|РАЗДЕЛ\s+[IVX\d]|ГЛАВА\s+\d|Статья\s+1[\.\s])/i.test(line) ||
      /^(Оглавление|ОГЛАВЛЕНИЕ)$/i.test(line)
    ) {
      startIdx = i;
      break;
    }
  }

  return lines.slice(startIdx).join("\n").trim();
}

function parseMarkdownIntoSections(markdown: string): Section[] {
  const cleaned = cleanMarkdown(markdown);
  const sections: Section[] = [];
  const lines = cleaned.split("\n");
  let currentHeading = "";
  let currentLevel = 1;
  let currentContent: string[] = [];
  let order = 0;
  let inTOC = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip table of contents block
    if (/^(Оглавление|ОГЛАВЛЕНИЕ)$/i.test(trimmed)) {
      inTOC = true;
      continue;
    }

    // Detect end of TOC when we hit actual content (a line that's not just a title reference)
    if (inTOC) {
      // TOC entries are typically short lines with just headings
      // Actual content starts when we see long paragraphs or "Статья X. ..." followed by text
      if (trimmed.length > 200 || /^Статья\s+\d+\.\d+\.\s+\S/.test(trimmed)) {
        inTOC = false;
      } else {
        continue;
      }
    }

    // Match markdown headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)/);

    // Match plain text structural headers
    const structMatch = !headingMatch && trimmed.match(
      /^(ОБЩАЯ ЧАСТЬ|ОСОБЕННАЯ ЧАСТЬ|РАЗДЕЛ\s+[IVX\d]+\.?\s*.*|ПОДРАЗДЕЛ\s+\d+\.?\s*.*|ГЛАВА\s+\d+[\.\\\s].*|Статья\s+\d+[\.\d]*\.?\s+.*)$/i
    );

    // Also match bold-styled headers
    const boldHeading = !headingMatch && !structMatch && trimmed.match(
      /^\*\*\s*((?:ГЛАВА|РАЗДЕЛ|ЧАСТЬ|Статья|ПОДРАЗДЕЛ)\s*.+?)\s*\*\*/i
    );

    const isNewSection = headingMatch || structMatch || boldHeading;

    if (isNewSection) {
      // Save previous section
      if (currentHeading) {
        const content = currentContent.join("\n").trim();
        if (content.length > 0) {
          sections.push({
            heading: currentHeading.substring(0, 500),
            content,
            level: currentLevel,
            sort_order: order++,
          });
        }
      }

      let newHeading = "";
      if (headingMatch) {
        currentLevel = headingMatch[1].length;
        newHeading = headingMatch[2].trim();
      } else if (structMatch) {
        newHeading = structMatch[1].trim().replace(/\\+/g, "");
      } else if (boldHeading) {
        newHeading = boldHeading[1].trim();
      }

      // Determine level
      const lower = newHeading.toLowerCase();
      if (/^(общая часть|особенная часть)/.test(lower)) currentLevel = 1;
      else if (/^раздел\s/.test(lower)) currentLevel = 1;
      else if (/^подраздел\s/.test(lower)) currentLevel = 2;
      else if (/^глава\s/.test(lower)) currentLevel = 2;
      else if (/^статья\s/.test(lower)) currentLevel = 3;

      currentHeading = newHeading;
      currentContent = [];
    } else {
      if (trimmed) {
        currentContent.push(line);
      } else if (currentContent.length > 0) {
        currentContent.push(""); // preserve paragraph breaks
      }
    }
  }

  // Last section
  if (currentHeading) {
    const content = currentContent.join("\n").trim();
    if (content.length > 0) {
      sections.push({
        heading: currentHeading.substring(0, 500),
        content,
        level: currentLevel,
        sort_order: order,
      });
    }
  }

  // If no sections found, create one big section
  if (sections.length === 0 && cleaned.length > 100) {
    sections.push({
      heading: "Текст документа",
      content: cleaned,
      level: 1,
      sort_order: 0,
    });
  }
  }

  return sections;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let documentId: string | null = null;
  let docType: string | null = null;
  let limit = 5;

  try {
    const body = await req.json();
    documentId = body.document_id || null;
    docType = body.doc_type || null;
    limit = body.limit || 5;
  } catch {
    // defaults
  }

  try {
    let documents: Array<{ id: string; title: string; source_url: string | null }>;

    if (documentId) {
      // Single document
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, source_url")
        .eq("id", documentId)
        .single();
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Document not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      documents = [data];
    } else {
      // Batch by doc_type — get documents with empty/short body_text
      let query = supabase
        .from("documents")
        .select("id, title, source_url")
        .not("source_url", "is", null);

      if (docType) {
        query = query.eq("doc_type", docType);
      }

      const { data, error } = await query.limit(limit);
      if (error || !data) {
        return new Response(JSON.stringify({ error: "No documents found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      documents = data;
    }

    let processed = 0;
    let sectionsCreated = 0;
    let errors = 0;

    for (const doc of documents) {
      if (!doc.source_url) {
        errors++;
        continue;
      }

      console.log(`Scraping: ${doc.title} (${doc.source_url})`);

      // Try the original URL first, then etalonline.by variant
      let markdown = await scrapeUrl(firecrawlKey, doc.source_url);

      if (!markdown || markdown.length < 200) {
        // Try etalonline.by
        const etalonUrl = doc.source_url.replace("pravo.by", "etalonline.by");
        console.log(`Trying etalonline.by: ${etalonUrl}`);
        markdown = await scrapeUrl(firecrawlKey, etalonUrl);
      }

      if (!markdown || markdown.length < 200) {
        console.warn(`No content for ${doc.title}`);
        errors++;
        continue;
      }

      console.log(`Got ${markdown.length} chars for ${doc.title}`);

      // Parse into sections
      const sections = parseMarkdownIntoSections(markdown);
      console.log(`Parsed ${sections.length} sections for ${doc.title}`);

      // Update document body_text
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          body_text: markdown,
          updated_at: new Date().toISOString(),
        })
        .eq("id", doc.id);

      if (updateError) {
        console.error(`Update error for ${doc.title}:`, updateError.message);
        errors++;
        continue;
      }

      // Delete old sections
      await supabase.from("document_sections").delete().eq("document_id", doc.id);

      // Insert new sections in batches
      const batchSize = 50;
      for (let i = 0; i < sections.length; i += batchSize) {
        const batch = sections.slice(i, i + batchSize).map((s) => ({
          document_id: doc.id,
          heading: s.heading,
          content: s.content,
          level: s.level,
          sort_order: s.sort_order,
        }));

        const { error: insertError } = await supabase
          .from("document_sections")
          .insert(batch);

        if (insertError) {
          console.error(`Sections insert error:`, insertError.message);
        } else {
          sectionsCreated += batch.length;
        }
      }

      processed++;
      await sleep(500); // Rate limit between documents
    }

    return new Response(
      JSON.stringify({
        success: true,
        documents_processed: processed,
        sections_created: sectionsCreated,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("Scrape document error:", errorMsg);
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
