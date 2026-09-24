import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { RefreshCw, ShieldOff, ShieldAlert } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { getBanLogs, unbanUser, type BanLogQuery } from "@/services/login-ops";
import type { BanLogItem } from "@/types/ban-log";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

/**
 * 从 account 还原学校与用户名。
 *
 * 新条目是 `{学校}:{用户名}`，历史条目是三段式 `{学校}:{用户名}:{密码哈希}`
 * （封禁键曾经含密码哈希，换个错误密码就能绕过，后来才去掉）。取前两段即可兼容两者。
 */
function parseAccount(account: string): { school: string; username: string } | null {
  const [school, username] = account.split(":");
  if (!school || !username) return null;
  return { school, username };
}

export default function BanLogsPage() {
  const [items, setItems] = useState<BanLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState("");
  const [username, setUsername] = useState("");
  const [applied, setApplied] = useState<BanLogQuery>({});
  const [unbanTarget, setUnbanTarget] = useState<{ school: string; username: string } | null>(null);
  const [unbanning, setUnbanning] = useState(false);

  // setState 全部落在 .then/.catch 回调里（而不是 await 之后的行内语句）是刻意的：
  // react-hooks/set-state-in-effect 只认前者。仓库里另外三个页面用的是 await 写法，
  // 正因此各自欠着一条 lint error——这里不跟。
  const load = useCallback(
    (query: BanLogQuery) =>
      getBanLogs(query)
        .then((page) => setItems(page.items))
        .catch((err) => {
          setItems([]);
          toast.error(err instanceof Error ? err.message : "加载封禁日志失败");
        })
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void load(applied);
  }, [applied, load]);

  const submitFilters = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setApplied({ school: school.trim() || undefined, username: username.trim() || undefined });
  };

  const handleUnban = async () => {
    if (!unbanTarget) return;
    setUnbanning(true);
    try {
      await unbanUser(unbanTarget.school, unbanTarget.username);
      toast.success(`已解封 ${unbanTarget.username}`);
      setUnbanTarget(null);
      await load(applied);
    } catch (err) {
      // 「该用户当前未被封禁」也走这里：上游回 400，拦截器已带上原文
      toast.error(err instanceof Error ? err.message : "解封失败");
    } finally {
      setUnbanning(false);
    }
  };

  const columns: ColumnDef<BanLogItem, unknown>[] = [
    {
      accessorKey: "created_at",
      header: "时间",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">{row.original.created_at_human}</span>
      ),
    },
    {
      accessorKey: "type_label",
      header: "类型",
      cell: ({ row }) => (
        <Badge variant={row.original.type === "auto_ban" ? "destructive" : "secondary"}>
          {row.original.type_label}
        </Badge>
      ),
    },
    {
      accessorKey: "account",
      header: "账号",
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.account}</span>,
    },
    {
      accessorKey: "reason",
      header: "原因",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.reason || "-"}</span>
      ),
    },
    {
      accessorKey: "unban_at",
      header: "解封时刻",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.unban_at_human ?? "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "操作",
      enableSorting: false,
      cell: ({ row }) => {
        const target = parseAccount(row.original.account);
        return (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg gap-1.5"
            disabled={!target}
            onClick={() => target && setUnbanTarget(target)}
          >
            <ShieldOff className="size-3.5" />
            解封
          </Button>
        );
      },
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">登录封禁</h1>
          <p className="mt-1.5 text-muted-foreground">
            来自 XAUAT.LoginApi 的封禁日志，展示最近 200 条
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl"
          onClick={() => {
            setLoading(true);
            void load(applied);
          }}
          disabled={loading}
          title="刷新"
        >
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </div>

      <form onSubmit={submitFilters} className="mb-6 flex flex-wrap gap-2">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="用户名（学号）..."
          className="max-w-48 rounded-xl h-11"
        />
        <Input
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          placeholder="学校，默认不过滤"
          className="max-w-48 rounded-xl h-11"
        />
        <Button type="submit" className="rounded-xl" disabled={loading}>
          查询
        </Button>
      </form>

      {loading ? (
        <LoadingSkeleton variant="table" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="size-16" />}
          title="暂无封禁记录"
          description="没有账号触发限流封禁，或者当前过滤条件下没有匹配的条目"
        />
      ) : (
        <DataTable columns={columns} data={items} pageSize={20} />
      )}

      <ConfirmDialog
        open={unbanTarget !== null}
        onOpenChange={(open) => !open && setUnbanTarget(null)}
        title="确认解封"
        description={
          unbanTarget
            ? `将解除 ${unbanTarget.school}:${unbanTarget.username} 的封禁，该账号可以立刻重新登录。`
            : undefined
        }
        confirmLabel="解封"
        variant="destructive"
        loading={unbanning}
        onConfirm={() => void handleUnban()}
      />
    </div>
  );
}
