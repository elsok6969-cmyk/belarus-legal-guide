import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  const problems: string[] = [];

  try {
    // 1. Total documents
    const { count: totalDocs } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true });

    // 2. Documents by type
    const { data: typeCounts } = await supabase
      .from("documents")
      .select("document_type_id, document_types!inner(name_ru)")
      .order("document_type_id");

    const typeMap: Record<string, number> = {};
    for (const d of typeCounts || []) {
      const name = (d as any).document_types?.name_ru || "Другое";
      typeMap[name] = (typeMap[name] || 0) + 1;
    }
    const typeLines = Object.entries(typeMap)
      .map(([name, count]) => `${count} ${name.toLowerCase()}`)
      .join(", ");

    // 3. Empty documents
    const { data: emptyDocs } = await supabase
      .from("documents")
      .select("id")
      .or("content_text.is.null,content_text.eq.");
    
    const emptyCount = emptyDocs?.length || 0;
    if (emptyCount > 0) {
      problems.push(`${emptyCount} документов с пустым контентом`);
    }

    // 4. Views in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: viewsCount } = await supabase
      .from("user_document_history")
      .select("*", { count: "exact", head: true })
      .gte("viewed_at", yesterday);

    // 5. Pending documents
    const { count: pendingCount } = await supabase
      .from("pending_documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 6. Pending updates
    const { count: pendingUpdates } = await supabase
      .from("pending_updates")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 7. Recent errors in system_logs
    const { data: recentErrors } = await supabase
      .from("system_logs")
      .select("action, details")
      .eq("status", "error")
      .gte("created_at", yesterday)
      .limit(5);

    if (recentErrors && recentErrors.length > 0) {
      problems.push(
        `${recentErrors.length} ошибок за 24ч: ${recentErrors.map((e) => e.action).join(", ")}`
      );
    }

    // 8. Last currency update
    const { data: lastRateLog } = await supabase
      .from("system_logs")
      .select("created_at, status")
      .eq("action", "update_currencies")
      .order("created_at", { ascending: false })
      .limit(1);

    const lastRateDate = lastRateLog?.[0]?.created_at
      ? new Date(lastRateLog[0].created_at).toLocaleDateString("ru-RU")
      : "никогда";

    // Build report
    const statusIcon = problems.length === 0 ? "✅" : "⚠️";
    let report = `📈 <b>Ежедневный отчёт</b>\n`;
    report += `📚 Документов: ${totalDocs || 0} (${typeLines})\n`;
    report += `⚠️ Битых: ${emptyCount}\n`;
    report += `👥 Просмотров за 24ч: ${viewsCount || 0}\n`;
    report += `🆕 Ожидают проверки: ${(pendingCount || 0) + (pendingUpdates || 0)}\n`;
    report += `💱 Последнее обновление курсов: ${lastRateDate}\n`;
    report += `${statusIcon} ${problems.length === 0 ? "Система работает нормально" : "Обнаружены проблемы"}`;

    if (problems.length > 0) {
      report += "\n\n🔴 <b>ПРОБЛЕМЫ</b>:\n- " + problems.join("\n- ");
      report += "\n\nЗайди в /admin/health";
    }

    await sendTelegram(report);

    await supabase.from("system_logs").insert({
      action: "health_check",
      status: problems.length === 0 ? "success" : "warning",
      details: {
        total_docs: totalDocs,
        empty_docs: emptyCount,
        views_24h: viewsCount,
        pending_docs: pendingCount,
        pending_updates: pendingUpdates,
        problems,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        total_docs: totalDocs,
        empty_docs: emptyCount,
        views_24h: viewsCount,
        problems,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
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
