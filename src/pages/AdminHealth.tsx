import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Activity, Database, FileText, RefreshCw, Clock, CheckCircle,
  AlertTriangle, XCircle, Download, SkipForward, Trash2, Play,
  MessageSquare, BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    success: { label: 'OK', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    warning: { label: 'Внимание', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    error: { label: 'Ошибка', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
    pending: { label: 'Ожидает', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    imported: { label: 'Импортирован', cls: 'bg-emerald-100 text-emerald-800' },
    skipped: { label: 'Пропущен', cls: 'bg-muted text-muted-foreground' },
    processed: { label: 'Обработан', cls: 'bg-emerald-100 text-emerald-800' },
  };
  const info = map[status] || { label: status, cls: 'bg-muted text-muted-foreground' };
  return <Badge className={info.cls} variant="secondary">{info.label}</Badge>;
}

function fmt(d: string | null) {
  if (!d) return '—';
  return format(new Date(d), 'dd.MM.yyyy HH:mm', { locale: ru });
}

export default function AdminHealth() {
  const queryClient = useQueryClient();

  // System logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Pending documents
  const { data: pendingDocs } = useQuery({
    queryKey: ['pending-docs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_documents')
        .select('*')
        .order('discovered_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Pending updates
  const { data: pendingUpdates } = useQuery({
    queryKey: ['pending-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_updates')
        .select('*, documents(title, short_title)')
        .order('discovered_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Quick stats
  const { data: stats } = useQuery({
    queryKey: ['health-stats'],
    queryFn: async () => {
      const [docsRes, emptyRes, pendingRes, updatesRes] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('id').or('content_text.is.null'),
        supabase.from('pending_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('pending_updates').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return {
        totalDocs: docsRes.count || 0,
        emptyDocs: emptyRes.data?.length || 0,
        pendingDocs: pendingRes.count || 0,
        pendingUpdates: updatesRes.count || 0,
      };
    },
  });

  // Last log per action type
  const lastLogs = logs?.reduce((acc, log) => {
    if (!acc[log.action]) acc[log.action] = log;
    return acc;
  }, {} as Record<string, any>) || {};

  // Run function manually
  const runFunction = useMutation({
    mutationFn: async (fnName: string) => {
      const { data, error } = await supabase.functions.invoke(fnName);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, fnName) => {
      toast.success(`${fnName} запущен`);
      queryClient.invalidateQueries({ queryKey: ['system-logs'] });
      queryClient.invalidateQueries({ queryKey: ['health-stats'] });
    },
    onError: (e) => toast.error(`Ошибка: ${e.message}`),
  });

  // Update pending doc status
  const updatePendingDoc = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('pending_documents')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-docs'] });
      queryClient.invalidateQueries({ queryKey: ['health-stats'] });
    },
  });

  const updatePendingUpdate = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('pending_updates')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-updates'] });
      queryClient.invalidateQueries({ queryKey: ['health-stats'] });
    },
  });

  // Overall status
  const overallStatus = (() => {
    if (!stats) return 'loading';
    if (stats.emptyDocs > 0) return 'warning';
    const recentErrors = logs?.filter(l => l.status === 'error' && new Date(l.created_at) > new Date(Date.now() - 24 * 3600 * 1000));
    if (recentErrors && recentErrors.length > 0) return 'error';
    return 'healthy';
  })();

  const statusConfig = {
    loading: { icon: RefreshCw, label: 'Загрузка...', color: 'text-muted-foreground', bg: 'bg-muted' },
    healthy: { icon: CheckCircle, label: 'Система работает нормально', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    warning: { icon: AlertTriangle, label: 'Есть замечания', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    error: { icon: XCircle, label: 'Обнаружены ошибки', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  };

  const sc = statusConfig[overallStatus];

  const cronFunctions = [
    { name: 'cron-update-currencies', label: 'Обновление курсов', schedule: 'Ежедневно 10:00' },
    { name: 'cron-check-new-docs', label: 'Проверка новых документов', schedule: 'Каждые 6 часов' },
    { name: 'cron-health-check', label: 'Health Check', schedule: 'Ежедневно 09:00' },
    { name: 'cron-check-updates', label: 'Проверка обновлений', schedule: 'По воскресеньям' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Мониторинг системы
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Статус, логи, и управление автоматическими задачами</p>
      </div>

      {/* Overall status */}
      <Card className={`${sc.bg} border-0`}>
        <CardContent className="p-6 flex items-center gap-4">
          <sc.icon className={`h-10 w-10 ${sc.color}`} />
          <div>
            <h2 className={`text-lg font-bold ${sc.color}`}>{sc.label}</h2>
            <p className="text-sm text-muted-foreground">
              {stats ? `${stats.totalDocs} документов • ${stats.pendingDocs} ожидают проверки • ${stats.pendingUpdates} обновлений` : 'Загрузка...'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{stats?.totalDocs ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Документов</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.emptyDocs ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Без контента</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.pendingDocs ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Новых на pravo.by</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <RefreshCw className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">{stats?.pendingUpdates ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Обновлений</p>
          </CardContent>
        </Card>
      </div>

      {/* Cron functions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Автоматические задачи
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {cronFunctions.map((fn) => {
              const lastLog = lastLogs[fn.name.replace('cron-', '').replace(/-/g, '_')];
              return (
                <div key={fn.name} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{fn.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {fn.schedule} • Последний запуск: {lastLog ? fmt(lastLog.created_at) : 'никогда'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {lastLog && <StatusBadge status={lastLog.status} />}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runFunction.mutate(fn.name)}
                      disabled={runFunction.isPending}
                    >
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Запустить
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Telegram test */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Telegram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runFunction.mutate('send-telegram')}
            disabled={runFunction.isPending}
          >
            Отправить тестовое сообщение
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Для настройки Telegram-уведомлений:
            1. Создайте бота через @BotFather в Telegram и получите токен.
            2. Напишите боту /start.
            3. Узнайте свой chat_id через @userinfobot.
            4. Секреты TELEGRAM_BOT_TOKEN и TELEGRAM_ADMIN_CHAT_ID уже сохранены.
          </p>
        </CardContent>
      </Card>

      {/* Pending documents */}
      {pendingDocs && pendingDocs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Новые документы на pravo.by ({pendingDocs.filter(d => d.status === 'pending').length} ожидают)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {pendingDocs.map((doc) => (
                <div key={doc.id} className="px-6 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmt(doc.discovered_at)}
                      {doc.source_url && (
                        <> • <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Источник</a></>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge status={doc.status} />
                    {doc.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Импортировать"
                          onClick={() => toast.info('Используйте /admin/import для импорта')}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Пропустить"
                          onClick={() => updatePendingDoc.mutate({ id: doc.id, status: 'skipped' })}>
                          <SkipForward className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending updates */}
      {pendingUpdates && pendingUpdates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Обновления документов ({pendingUpdates.filter(u => u.status === 'pending').length} ожидают)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {pendingUpdates.map((upd: any) => (
                <div key={upd.id} className="px-6 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {upd.documents?.short_title || upd.documents?.title || 'Документ'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Было: {upd.old_date || '—'} → Стало: {upd.new_date || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge status={upd.status} />
                    {upd.status === 'pending' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Обработано"
                        onClick={() => updatePendingUpdate.mutate({ id: upd.id, status: 'processed' })}>
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Лог действий (последние 50)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="p-6 space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="px-6 py-2.5 flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={log.status} />
                    <span className="font-mono text-xs">{log.action}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 && (
                      <span className="hidden md:inline truncate max-w-[200px]">
                        {JSON.stringify(log.details).substring(0, 80)}
                      </span>
                    )}
                    <span className="tabular-nums">{fmt(log.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Нет записей</div>
          )}
        </CardContent>
      </Card>

      {/* Cron setup instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📋 Настройка расписания (pg_cron)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Скопируйте и выполните SQL в Lovable Cloud для настройки автоматического запуска:
          </p>
          <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
{`-- Курсы валют: каждый день в 10:00 по Минску (UTC+3 = 07:00 UTC)
SELECT cron.schedule('update-currencies', '0 7 * * *',
  $$SELECT net.http_post(
    url:='https://zqcuqodccbpwawtlrafw.supabase.co/functions/v1/cron-update-currencies',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3Vxb2RjY2Jwd2F3dGxyYWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjU0MzMsImV4cCI6MjA5MDkwMTQzM30.wUGKwFsJxBkV6UkYoONID_trGQqSJNjLqDyUmKP8-Zc"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);

-- Проверка новых документов: каждые 6 часов
SELECT cron.schedule('check-new-docs', '0 */6 * * *',
  $$SELECT net.http_post(
    url:='https://zqcuqodccbpwawtlrafw.supabase.co/functions/v1/cron-check-new-docs',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3Vxb2RjY2Jwd2F3dGxyYWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjU0MzMsImV4cCI6MjA5MDkwMTQzM30.wUGKwFsJxBkV6UkYoONID_trGQqSJNjLqDyUmKP8-Zc"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);

-- Health check: каждый день в 09:00 по Минску (06:00 UTC)
SELECT cron.schedule('health-check', '0 6 * * *',
  $$SELECT net.http_post(
    url:='https://zqcuqodccbpwawtlrafw.supabase.co/functions/v1/cron-health-check',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3Vxb2RjY2Jwd2F3dGxyYWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjU0MzMsImV4cCI6MjA5MDkwMTQzM30.wUGKwFsJxBkV6UkYoONID_trGQqSJNjLqDyUmKP8-Zc"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);

-- Проверка обновлений документов: каждое воскресенье в 03:00 по Минску (00:00 UTC)
SELECT cron.schedule('check-updates', '0 0 * * 0',
  $$SELECT net.http_post(
    url:='https://zqcuqodccbpwawtlrafw.supabase.co/functions/v1/cron-check-updates',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3Vxb2RjY2Jwd2F3dGxyYWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjU0MzMsImV4cCI6MjA5MDkwMTQzM30.wUGKwFsJxBkV6UkYoONID_trGQqSJNjLqDyUmKP8-Zc"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
