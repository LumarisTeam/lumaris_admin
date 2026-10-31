import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, CircleAlert, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getEduApiLogs, type LogQuery } from "@/services/logs";
import type { LogEntry, LogLevel, LogPage } from "@/types/log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const levels: Array<LogLevel | "all"> = ["all", "Trace", "Debug", "Information", "Warning", "Error", "Fatal"];
const emptyPage: LogPage = { page: 1, pageSize: 50, total: 0, totalPages: 0, items: [] };

function levelVariant(level: string) {
  if (level === "Error" || level === "Fatal") return "destructive" as const;
  if (level === "Warning") return "secondary" as const;
  return "outline" as const;
}

function DetailField({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return <div className="grid gap-1">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <div className={`whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-3 text-sm ${mono ? "font-mono text-xs" : ""}`}>{children}</div>
  </div>;
}

function LogTable({ items }: { items: LogEntry[] }) {
  const [selected, setSelected] = useState<LogEntry | null>(null);
  return <>
    <div className="rounded-2xl border border-border/50 overflow-hidden">
      <Table className="table-fixed">
        <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableHead className="w-36">时间</TableHead><TableHead className="w-20">级别</TableHead><TableHead className="w-44">来源</TableHead><TableHead>消息</TableHead><TableHead className="w-40">异常</TableHead><TableHead className="w-16 text-right">操作</TableHead>
        </TableRow></TableHeader>
        <TableBody>{items.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">暂无日志</TableCell></TableRow> : items.map((item, index) => <TableRow key={`${item.timestamp}-${index}`}>
          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</TableCell>
          <TableCell><Badge variant={levelVariant(item.level)}>{item.level}</Badge></TableCell>
          <TableCell className="max-w-48 truncate text-xs align-top">{item.source || "-"}</TableCell>
          <TableCell className="align-top">
            <div className="line-clamp-3 whitespace-pre-wrap break-words text-sm">{item.message}</div>
          </TableCell>
          <TableCell className="align-top">
            <div className="line-clamp-3 whitespace-pre-wrap break-words text-xs text-destructive">{item.exception || "-"}</div>
          </TableCell>
          <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(item)}>详情</Button></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
    <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="sm:max-w-2xl">
        {selected ? <>
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
            <DialogDescription>{new Date(selected.timestamp).toLocaleString()} · {selected.level}</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
            <DetailField label="来源" mono>{selected.source || "-"}</DetailField>
            <DetailField label="消息" mono>{selected.message}</DetailField>
            <DetailField label="异常" mono><span className="text-destructive">{selected.exception || "-"}</span></DetailField>
          </div>
        </> : null}
      </DialogContent>
    </Dialog>
  </>;
}

export default function LogsPage() {
  const [page, setPage] = useState<LogPage>(emptyPage);
  const [query, setQuery] = useState<LogQuery>({ page: 1, pageSize: 50 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (next: LogQuery) => {
    setLoading(true); setError(null);
    try {
      setPage(await getEduApiLogs(next));
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载日志失败";
      setError(message); toast.error(message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load({ page: 1, pageSize: 50 }), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const updateQuery = (next: Partial<LogQuery>) => setQuery((current) => ({ ...current, ...next }));
  const refresh = () => void load(query);
  const submitSearch = (event: FormEvent) => { event.preventDefault(); const next = { ...query, page: 1 }; updateQuery(next); void load(next); };
  const changePage = (pageNumber: number) => { const next = { ...query, page: pageNumber }; updateQuery(next); void load(next); };

  return <div className="mx-auto max-w-7xl">
    <div className="mb-8"><h1 className="text-3xl font-bold tracking-tight">系统日志</h1><p className="mt-1.5 text-muted-foreground">查看 XAUAT EduApi 的运行日志</p></div>
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <form onSubmit={submitSearch} className="flex min-w-60 flex-1 gap-2"><Input value={query.search || ""} onChange={(event) => updateQuery({ search: event.target.value })} placeholder="搜索消息、来源或异常..." /><Button type="submit">搜索</Button></form>
      <Select value={query.level || "all"} onValueChange={(value) => { const next = { ...query, level: value === "all" ? undefined : value as LogLevel, page: 1 }; updateQuery(next); void load(next); }}><SelectTrigger className="w-40"><SelectValue placeholder="最低级别" /></SelectTrigger><SelectContent>{levels.map((level) => <SelectItem key={level} value={level}>{level === "all" ? "全部级别" : level}</SelectItem>)}</SelectContent></Select>
      <Button variant="outline" size="icon" onClick={refresh} disabled={loading} title="刷新"><RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} /></Button>
    </div>
    {error ? <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><CircleAlert className="size-4" />{error}</div> : null}
    <LogTable items={page.items} />
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground"><span>共 {page.total} 条，第 {page.totalPages ? query.page : 0}/{page.totalPages} 页</span><div className="flex gap-1"><Button variant="outline" size="icon-sm" onClick={() => changePage(query.page - 1)} disabled={loading || query.page <= 1}><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon-sm" onClick={() => changePage(query.page + 1)} disabled={loading || query.page >= page.totalPages}><ChevronRight className="size-4" /></Button></div></div>
  </div>;
}
