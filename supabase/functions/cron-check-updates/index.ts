import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Get all documents with source_url
    const { data: docs } = await supabase
      .from("documents")
      .select("id, title, source_url, last_updated, doc_date")
      .not("source_url", "is", null)
      .not("content_text", "is", null);

    if (!docs || docs.length === 0) {
      return new Response(JSON.stringify({ success: true, checked: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const updates: { doc: any; newDate: string }[] = [];
    let checked = 0;
    let errors = 0;

    for (const doc of docs) {
      try {
        const resp = await fetch(doc.source_url!, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "ru-RU,ru;q=0.9",
          },
        });

        if (!resp.ok) {
          errors++;
          continue;
        }

        const html = await resp.text();

        // Look for "редакция от DD.MM.YYYY" or "Изменения и дополнения" dates
        const datePatterns = [
          /(?:редакци[ия]|Изменения.*дополнения|изм\.\s*и\s*доп\.).*?(\d{1,2})[.\s](\d{1,2})[.\s](\d{4})/gi,
          /от\s+(\d{1,2})[.\s](\d{1,2})[.\s](\d{4})\s*г?\.\s*№/gi,
        ];

        let latestDate = "";
        for (const pattern of datePatterns) {
          let m;
          while ((m = pattern.exec(html)) !== null) {
            const d = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
            if (d > latestDate) latestDate = d;
          }
        }

        if (latestDate && doc.last_updated) {
          const ourDate = doc.last_updated.split("T")[0];
          if (latestDate > ourDate) {
            updates.push({ doc, newDate: latestDate });
          }
        }

        checked++;
      } catch {
        errors++;
      }

      // Polite delay
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Save pending updates
    if (updates.length > 0) {
      for (const upd of updates) {
        // Check if already pending
        const { data: existing } = await supabase
          .from("pending_updates")
          .select("id")
          .eq("document_id", upd.doc.id)
          .eq("status", "pending")
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("pending_updates").insert({
            document_id: upd.doc.id,
            old_date: upd.doc.last_updated?.split("T")[0] || null,
            new_date: upd.newDate,
            source_url: upd.doc.source_url,
            status: "pending",
          });
        }
      }

      const updateList = updates
        .slice(0, 10)
        .map(
          (u) =>
            `• ${u.doc.title?.substring(0, 80)} — новая ред. от ${u.newDate}`
        )
        .join("\n");

      await sendTelegram(
        `⚡ <b>ОБНОВЛЕНИЯ ДОКУМЕНТОВ</b> (${updates.length} шт.)\n${updateList}\n\n⚠️ Требуется перепарсинг: /admin/health`
      );
    }

    await supabase.from("system_logs").insert({
      action: "check_updates",
      status: errors > docs.length / 2 ? "warning" : "success",
      details: { checked, updates: updates.length, errors, total: docs.length },
    });

    return new Response(
      JSON.stringify({ success: true, checked, updates: updates.length, errors }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await supabase.from("system_logs").insert({
      action: "check_updates",
      status: "error",
      details: { error: errMsg },
    });

    await sendTelegram(`🔴 <b>ОШИБКА проверки обновлений</b>\n${errMsg}`);

    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
