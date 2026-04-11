import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function sendTelegram(message: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message.substring(0, 4096), parse_mode: "HTML" }),
  });
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const problems: string[] = [];

  try {
    // A) DB accessible (implicit — if we get here, it works)

    // B) Total documents
    const { count: totalDocs } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true });

    // C) Broken documents (no content or very short)
    const { data: brokenDocs } = await supabase
      .from("documents")
      .select("id")
      .or("content_text.is.null,content_text.eq.");

    const brokenCount = brokenDocs?.length || 0;
    if (brokenCount > 0) {
      problems.push(`${brokenCount} документов с пустым контентом`);
    }

    // D) Sections without text
    const { data: emptySections } = await supabase
      .from("document_sections")
      .select("id")
      .or("content_markdown.is.null,content_markdown.eq.");

    const emptySectionsCount = emptySections?.length || 0;
    if (emptySectionsCount > 15) {
      problems.push(`${emptySectionsCount} секций без текста`);
    }

    // E) Views in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: viewsCount } = await supabase
      .from("user_document_history")
      .select("*", { count: "exact", head: true })
      .gte("viewed_at", yesterday);

    // F) New registrations — count profiles created in last 24h (can't query auth.users from client)
    const { count: newUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday);

    // G) Pending documents
    const { count: pendingCount } = await supabase
      .from("pending_documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // H) Currency rates freshness
    const { data: latestRate } = await supabase
      .from("currency_rates")
      .select("rate_date")
      .order("rate_date", { ascending: false })
      .limit(1);

    const lastRateDate = latestRate?.[0]?.rate_date;
    let ratesDisplay = "никогда";
    if (lastRateDate) {
      ratesDisplay = new Date(lastRateDate).toLocaleDateString("ru-RU");
      const daysSince = (Date.now() - new Date(lastRateDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 2) {
        problems.push(`Курсы не обновлялись ${Math.floor(daysSince)} дней`);
      }
    } else {
      problems.push("Курсы валют отсутствуют");
    }

    // I) Pending updates
    const { count: pendingUpdates } = await supabase
      .from("pending_updates")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Recent errors
    const { data: recentErrors } = await supabase
      .from("system_logs")
      .select("action")
      .eq("status", "error")
      .gte("created_at", yesterday)
      .limit(10);

    if (recentErrors && recentErrors.length > 0) {
      problems.push(`${recentErrors.length} ошибок за 24ч: ${recentErrors.map(e => e.action).join(", ")}`);
    }

    // Build report
    let report = `📈 <b>Ежедневный отчёт Бабиджон</b>\n\n`;
    report += `📚 Документов: ${totalDocs || 0}\n`;
    report += `⚠️ Битых: ${brokenCount}\n`;
    report += `📄 Секций без текста: ${emptySectionsCount}\n`;
    report += `👁 Просмотров за 24ч: ${viewsCount || 0}\n`;
    report += `👤 Новых регистраций: ${newUsers || 0}\n`;
    report += `🆕 Ожидают проверки: ${(pendingCount || 0) + (pendingUpdates || 0)}\n`;
    report += `💱 Курсы обновлены: ${ratesDisplay}\n`;

    if (problems.length === 0) {
      report += `\n✅ Система работает`;
    } else {
      report += `\n🔴 <b>ПРОБЛЕМЫ</b>\n`;
      for (const p of problems) {
        report += `- ${p}\n`;
      }
      report += `\nЗайди: /admin/health`;
    }

    await sendTelegram(report);

    const details = {
      total_docs: totalDocs,
      broken_docs: brokenCount,
      empty_sections: emptySectionsCount,
      views_24h: viewsCount,
      new_users: newUsers,
      pending_docs: pendingCount,
      pending_updates: pendingUpdates,
      rates_date: lastRateDate,
      problems,
    };

    await supabase.from("system_logs").insert({
      action: "health_check",
      status: problems.length === 0 ? "success" : "warning",
      details,
    });

    return new Response(JSON.stringify({ success: true, ...details }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await supabase.from("system_logs").insert({
      action: "health_check",
      status: "error",
      details: { error: errMsg },
    });
    await sendTelegram(`🔴 <b>Health Check FAILED</b>\n${errMsg}`);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
