import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PRAVO_NEWS_URL = "https://pravo.by/novosti/novosti-zakonodatelstva/";

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

async function sendTelegram(message: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // 1. Fetch pravo.by news page
    const resp = await fetch(PRAVO_NEWS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
    });

    if (!resp.ok) {
      throw new Error(`pravo.by returned ${resp.status}`);
    }

    const html = await resp.text();

    // 2. Extract document links
    // Pattern: links to document pages like /document/?guid=...&p0=...
    // Also look for news items with document references
    const linkRe = /<a[^>]+href="([^"]*(?:\/document\/\?[^"]+|\/novosti\/novosti-zakonodatelstva\/\d+\/[^"]+))"[^>]*>([\s\S]*?)<\/a>/gi;
    const discovered: { title: string; url: string }[] = [];
    let match;

    while ((match = linkRe.exec(html)) !== null) {
      let url = match[1];
      const title = stripTags(match[2]).trim();

      if (!title || title.length < 10) continue;

      // Make absolute URL
      if (url.startsWith("/")) {
        url = "https://pravo.by" + url;
      }

      // Skip duplicates in this batch
      if (!discovered.find((d) => d.url === url)) {
        discovered.push({ title, url });
      }
    }

    // Also try extracting from news list items
    const newsItemRe = /<div[^>]*class="[^"]*news[_-]?item[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = newsItemRe.exec(html)) !== null) {
      let url = match[1];
      const title = stripTags(match[2]).trim();
      if (!title || title.length < 10) continue;
      if (url.startsWith("/")) url = "https://pravo.by" + url;
      if (!discovered.find((d) => d.url === url)) {
        discovered.push({ title, url });
      }
    }

    const items = discovered.slice(0, 20);
    console.log(`Found ${items.length} items on pravo.by`);

    if (items.length === 0) {
      await supabase.from("system_logs").insert({
        action: "check_new_docs",
        status: "success",
        details: { found: 0, new: 0, message: "No items parsed from page" },
      });
      return new Response(JSON.stringify({ success: true, found: 0, new_docs: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Check which are already in our DB or pending
    const urls = items.map((i) => i.url);
    const titles = items.map((i) => i.title);

    const { data: existingDocs } = await supabase
      .from("documents")
      .select("source_url, title")
      .or(
        urls.map((u) => `source_url.eq.${u}`).join(",")
      );

    const { data: existingPending } = await supabase
      .from("pending_documents")
      .select("source_url, title")
      .or(
        urls.map((u) => `source_url.eq.${u}`).join(",")
      );

    const existingUrls = new Set([
      ...(existingDocs || []).map((d) => d.source_url),
      ...(existingPending || []).map((d) => d.source_url),
    ]);

    const newItems = items.filter((i) => !existingUrls.has(i.url));

    // 4. Save new items to pending_documents
    if (newItems.length > 0) {
      await supabase.from("pending_documents").insert(
        newItems.map((item) => ({
          title: item.title.substring(0, 500),
          source_url: item.url,
          doc_type: "unknown",
          status: "pending",
        }))
      );

      // 5. Notify via Telegram
      const docList = newItems
        .slice(0, 10)
        .map((d, i) => `${i + 1}. ${d.title.substring(0, 100)}`)
        .join("\n");

      await sendTelegram(
        `📋 <b>Найдены новые документы</b> (${newItems.length} шт.)\n${docList}${newItems.length > 10 ? "\n..." : ""}\n\nИмпортировать? Зайди в /admin/health`
      );
    }

    await supabase.from("system_logs").insert({
      action: "check_new_docs",
      status: "success",
      details: { found: items.length, new: newItems.length },
    });

    return new Response(
      JSON.stringify({ success: true, found: items.length, new_docs: newItems.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await supabase.from("system_logs").insert({
      action: "check_new_docs",
      status: "error",
      details: { error: errMsg },
    });

    await sendTelegram(
      `🔴 <b>ОШИБКА проверки новых документов</b>\n${errMsg}`
    );

    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
