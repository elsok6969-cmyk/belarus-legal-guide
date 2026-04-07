import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, RefreshCw, Upload, Search, Database } from 'lucide-react';
import { toast } from 'sonner';

interface DbStatus {
  name_ru: string;
  total: number;
  with_content: number;
  broken: number;
}

interface DocType {
  id: string;
  slug: string;
  name_ru: string;
}

interface ParsedDoc {
  title: string;
  doc_number: string;
  doc_date: string;
  status: string;
  content_markdown: string;
  content_text: string;
  raw_html: string;
  sections: any[];
  content_length: number;
  sections_count: number;
}

export default function AdminImport() {
  // Section 1: DB Status
  const [dbStatus, setDbStatus] = useState<DbStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  // Section 2: Import Codexes
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(26);
  const [importCurrent, setImportCurrent] = useState('');
  const [importLog, setImportLog] = useState('');
  const logRef = useRef<HTMLTextAreaElement>(null);

  // Section 3: Single document
  const [docUrl, setDocUrl] = useState('');
  const [docTypeId, setDocTypeId] = useState('');
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parsedDoc, setParsedDoc] = useState<ParsedDoc | null>(null);
  const [saving, setSaving] = useState(false);

  // Section 4: Cleanup
  const [brokenCount, setBrokenCount] = useState<number | null>(null);
  const [dupeCount, setDupeCount] = useState<number | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState('');

  const appendLog = useCallback((line: string) => {
    const ts = new Date().toLocaleTimeString('ru-RU');
    setImportLog(prev => prev + `[${ts}] ${line}\n`);
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  const loadDbStatus = async () => {
    setStatusLoading(true);
    try {
      const { data: types } = await supabase.from('document_types').select('id, name_ru, sort_order').order('sort_order');
      if (!types) return;

      const { data: docs } = await supabase.from('documents').select('id, document_type_id, content_text');

      const statusMap: DbStatus[] = types.map(t => {
        const typeDocs = docs?.filter(d => d.document_type_id === t.id) || [];
        const withContent = typeDocs.filter(d => d.content_text && d.content_text.length > 500).length;
        return {
          name_ru: t.name_ru,
          total: typeDocs.length,
          with_content: withContent,
          broken: typeDocs.length - withContent,
        };
      });
      setDbStatus(statusMap);
    } finally {
      setStatusLoading(false);
    }
  };

  const loadDocTypes = async () => {
    const { data } = await supabase.from('document_types').select('id, slug, name_ru').order('sort_order');
    if (data) setDocTypes(data);
  };

  useEffect(() => {
    loadDbStatus();
    loadDocTypes();
  }, []);

  // Section 2: Import codexes via SSE
  const startImport = async (batch?: number) => {
    setImporting(true);
    setImportProgress(0);
    setImportLog('');
    appendLog(`Запуск импорта${batch ? ` (пакет ${batch})` : ''}...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/import-codexes`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(batch ? { batch } : {}),
      });

      if (!resp.ok) {
        appendLog(`ОШИБКА: HTTP ${resp.status}`);
        setImporting(false);
        return;
      }

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        appendLog('ОШИБКА: нет потока');
        setImporting(false);
        return;
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.done) {
              appendLog(`\nГотово! Импортировано: ${data.imported}, обновлено: ${data.updated}, ошибок: ${data.failed}`);
              if (data.errors?.length > 0) {
                for (const err of data.errors) {
                  appendLog(`  ⚠ ${err.short_title}: ${err.error}`);
                }
              }
            } else {
              setImportProgress(data.progress);
              setImportTotal(data.total);
              setImportCurrent(data.current);

              if (data.status === 'success') {
                appendLog(`✓ "${data.current}" — OK (${data.sections || 0} секций)`);
              } else if (data.status === 'error') {
                appendLog(`✗ "${data.current}" — ОШИБКА: ${data.error}`);
              } else if (data.status === 'parsing') {
                appendLog(`⟳ Парсинг "${data.current}"...`);
              }
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e: any) {
      appendLog(`ОШИБКА: ${e.message}`);
    } finally {
      setImporting(false);
      loadDbStatus();
    }
  };

  // Section 3: Parse single document
  const parseDocument = async () => {
    if (!docUrl) return;
    setParsing(true);
    setParsedDoc(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/parse-pravo-document`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ url: docUrl, document_type: docTypes.find(t => t.id === docTypeId)?.slug || 'law' }),
      });

      const result = await resp.json();
      if (result.success) {
        setParsedDoc(result);
        toast.success(`Спарсен: ${result.title} (${result.content_length} символов)`);
      } else {
        toast.error(`Ошибка: ${result.error}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setParsing(false);
    }
  };

  const saveDocument = async () => {
    if (!parsedDoc || !docTypeId) return;
    setSaving(true);

    try {
      const { data: doc, error } = await supabase
        .from('documents')
        .insert({
          document_type_id: docTypeId,
          title: parsedDoc.title,
          doc_number: parsedDoc.doc_number,
          doc_date: parsedDoc.doc_date,
          status: parsedDoc.status || 'active',
          source_url: docUrl,
          content_markdown: parsedDoc.content_markdown,
          content_text: parsedDoc.content_text,
          raw_html: parsedDoc.raw_html,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Insert sections recursively
      if (parsedDoc.sections?.length > 0 && doc) {
        await insertSectionsRecursive(doc.id, parsedDoc.sections, null);
      }

      toast.success('Документ сохранён!');
      setParsedDoc(null);
      setDocUrl('');
      loadDbStatus();
    } catch (e: any) {
      toast.error(`Ошибка сохранения: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const insertSectionsRecursive = async (documentId: string, sections: any[], parentId: string | null) => {
    for (const sec of sections) {
      const { data } = await supabase
        .from('document_sections')
        .insert({
          document_id: documentId,
          parent_id: parentId,
          section_type: sec.section_type,
          number: sec.number || null,
          title: sec.title || null,
          content_markdown: sec.content_markdown || null,
          content_text: sec.content_text || null,
          sort_order: sec.sort_order,
          level: sec.level,
          path: sec.path || null,
        })
        .select('id')
        .single();

      if (data && sec.children?.length > 0) {
        await insertSectionsRecursive(documentId, sec.children, data.id);
      }
    }
  };

  // Section 4: Cleanup
  const callCleanup = async (action: string) => {
    setCleanupLoading(action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/admin-cleanup`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action }),
      });

      const result = await resp.json();

      if (action === 'count_broken') {
        setBrokenCount(result.count);
      } else if (action === 'count_duplicates') {
        setDupeCount(result.count);
      } else if (action === 'delete_broken' || action === 'delete_duplicates') {
        toast.success(`Удалено: ${result.deleted} записей`);
        loadDbStatus();
        setBrokenCount(null);
        setDupeCount(null);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCleanupLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">Панель импорта данных</h1>

      {/* Section 1: Database Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Статус базы данных
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadDbStatus} disabled={statusLoading}>
            {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Тип документа</TableHead>
                <TableHead className="text-right">Всего</TableHead>
                <TableHead className="text-right">С контентом</TableHead>
                <TableHead className="text-right">Пустых/битых</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dbStatus.map((row) => (
                <TableRow
                  key={row.name_ru}
                  className={
                    row.total > 0 && row.with_content === 0
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : row.broken > 0
                      ? 'bg-yellow-50 dark:bg-yellow-950/20'
                      : ''
                  }
                >
                  <TableCell className="font-medium">{row.name_ru}</TableCell>
                  <TableCell className="text-right">{row.total}</TableCell>
                  <TableCell className="text-right">{row.with_content}</TableCell>
                  <TableCell className="text-right">{row.broken}</TableCell>
                </TableRow>
              ))}
              {dbStatus.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Нет данных</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 2: Import Codexes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Импорт кодексов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => startImport()} disabled={importing}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Импортировать все (26)
            </Button>
            <Button variant="outline" onClick={() => startImport(1)} disabled={importing}>Пакет 1 (1-9)</Button>
            <Button variant="outline" onClick={() => startImport(2)} disabled={importing}>Пакет 2 (10-18)</Button>
            <Button variant="outline" onClick={() => startImport(3)} disabled={importing}>Пакет 3 (19-26)</Button>
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{importCurrent}</span>
                <span>{importProgress}/{importTotal}</span>
              </div>
              <Progress value={(importProgress / importTotal) * 100} />
            </div>
          )}

          <Textarea
            ref={logRef}
            readOnly
            value={importLog}
            placeholder="Лог импорта будет отображаться здесь..."
            className="h-64 font-mono text-xs"
          />
        </CardContent>
      </Card>

      {/* Section 3: Single Document Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Импорт одного документа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://pravo.by/document/?guid=..."
              value={docUrl}
              onChange={e => setDocUrl(e.target.value)}
              className="flex-1"
            />
            <Select value={docTypeId} onValueChange={setDocTypeId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Тип документа" />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name_ru}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={parseDocument} disabled={parsing || !docUrl}>
              {parsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Парсить
            </Button>
          </div>

          {parsedDoc && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{parsedDoc.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    №{parsedDoc.doc_number} от {parsedDoc.doc_date} • {parsedDoc.content_length.toLocaleString()} символов • {parsedDoc.sections_count} секций
                  </p>
                </div>
                <Button onClick={saveDocument} disabled={saving || !docTypeId}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Сохранить в базу
                </Button>
              </div>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap">
                {parsedDoc.content_markdown?.slice(0, 500)}...
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Data Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Очистка данных
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            {/* Delete broken */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => callCleanup('count_broken')}
                disabled={!!cleanupLoading}
              >
                Проверить битые
              </Button>
              {brokenCount !== null && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={brokenCount === 0}>
                      Удалить {brokenCount} битых
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить битые записи?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Будет удалено {brokenCount} документов с контентом менее 500 символов. Это действие необратимо.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => callCleanup('delete_broken')}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Delete duplicates */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => callCleanup('count_duplicates')}
                disabled={!!cleanupLoading}
              >
                Проверить дубли
              </Button>
              {dupeCount !== null && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={dupeCount === 0}>
                      Удалить {dupeCount} дублей
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить дубликаты?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Будет удалено {dupeCount} дублирующихся документов. Останется версия с наибольшим контентом.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => callCleanup('delete_duplicates')}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {cleanupLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Выполняется...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
