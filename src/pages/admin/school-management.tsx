import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { getAdminSchools, createSchool, updateSchool, deleteSchool } from "@/services/admin/school";
import type { School, Feature } from "@/types/school";
import { FEATURE_LABELS, ALL_FEATURES, WEEK_DAYS } from "@/types/school";
import { DataTable } from "@/components/shared/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SchoolManagementPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formEduSystemUrl, setFormEduSystemUrl] = useState("");
  const [formFeatures, setFormFeatures] = useState<Feature[]>([]);
  const [formEnabled, setFormEnabled] = useState(true);
  const [formWeekStartDay, setFormWeekStartDay] = useState(0);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<School | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminSchools();
      setSchools(res.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setFormCode("");
    setFormName("");
    setFormWebsite("");
    setFormEduSystemUrl("");
    setFormFeatures([]);
    setFormEnabled(true);
    setFormWeekStartDay(0);
    setFormOpen(true);
  };

  const openEdit = (school: School) => {
    setEditing(school);
    setFormCode(school.code);
    setFormName(school.name);
    setFormWebsite(school.website);
    setFormEduSystemUrl(school.edu_system_url ?? "");
    setFormFeatures(school.features ?? []);
    setFormEnabled(school.enabled);
    setFormWeekStartDay(school.week_start_day ?? 0);
    setFormOpen(true);
  };

  const toggleFeature = (f: Feature) => {
    setFormFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim() || !formWebsite.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateSchool(editing.code, {
          name: formName.trim(),
          website: formWebsite.trim(),
          edu_system_url: formEduSystemUrl.trim(),
          features: formFeatures,
          enabled: formEnabled,
          week_start_day: formWeekStartDay,
        });
        setSchools((prev) => prev.map((s) => (s.code === editing.code ? updated : s)));
        toast.success("更新成功");
      } else {
        const created = await createSchool({
          code: formCode.trim(),
          name: formName.trim(),
          website: formWebsite.trim(),
          edu_system_url: formEduSystemUrl.trim(),
          features: formFeatures,
          week_start_day: formWeekStartDay,
        });
        setSchools((prev) => [...prev, created]);
        toast.success("创建成功");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSchool(deleteTarget.code);
      setSchools((prev) => prev.filter((s) => s.code !== deleteTarget.code));
      toast.success("删除成功");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<School, unknown>[] = [
    { accessorKey: "code", header: "代码" },
    { accessorKey: "name", header: "名称" },
    {
      accessorKey: "website",
      header: "官网",
      cell: ({ getValue }) => (
        <a
          href={getValue() as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline text-sm truncate max-w-45 block"
        >
          {getValue() as string}
        </a>
      ),
    },
    {
      accessorKey: "edu_system_url",
      header: "教务系统",
      cell: ({ getValue }) => {
        const url = (getValue() as string) ?? "";
        if (!url) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline text-sm truncate max-w-45 block"
          >
            {url}
          </a>
        );
      },
    },
    {
      accessorKey: "features",
      header: "功能",
      cell: ({ getValue }) => {
        const features = (getValue() as Feature[]) ?? [];
        return (
          <div className="flex flex-wrap gap-1 max-w-75">
            {features.map((f) => (
              <Badge key={f} variant="outline" className="rounded-md text-xs px-1.5 py-0">
                {FEATURE_LABELS[f] ?? f}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "enabled",
      header: "状态",
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? "default" : "secondary"} className="rounded-lg text-xs">
          {getValue() ? "已启用" : "未启用"}
        </Badge>
      ),
    },
    {
      accessorKey: "week_start_day",
      header: "周起始日",
      cell: ({ getValue }) => {
        const day = WEEK_DAYS.find(({ value }) => value === getValue());
        return day?.label ?? "周日";
      },
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" className="rounded-lg" onClick={() => openEdit(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-lg text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const isSaveDisabled = saving || !formName.trim() || !formCode.trim() || !formWebsite.trim();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">学校管理</h1>
          <p className="text-muted-foreground mt-1.5">管理学校数据</p>
        </div>
        <Button className="rounded-xl gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          添加学校
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="搜索名称或代码..."
          className="max-w-md"
        />
      </div>

      {!loading && schools.length === 0 ? (
        <EmptyState
          title="暂无学校数据"
          description="点击上方按钮添加第一个学校"
          action={
            <Button className="rounded-xl gap-2" onClick={openCreate}>
              <Plus className="size-4" />
              添加学校
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑学校" : "添加学校"}</DialogTitle>
            <DialogDescription>
              {editing ? "修改学校信息" : "添加一个新的学校"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>学校代码 *</Label>
              <Input
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="例如: XAUAT"
                className="rounded-xl"
                disabled={!!editing}
              />
            </div>
            <div className="space-y-1.5">
              <Label>学校名称 *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="例如: 西安建筑科技大学"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>官方网站 *</Label>
              <Input
                value={formWebsite}
                onChange={(e) => setFormWebsite(e.target.value)}
                placeholder="https://www.example.edu.cn"
                className="rounded-xl"
                type="url"
              />
            </div>
            <div className="space-y-1.5">
              <Label>教务系统地址</Label>
              <Input
                value={formEduSystemUrl}
                onChange={(e) => setFormEduSystemUrl(e.target.value)}
                placeholder="https://jwc.example.edu.cn"
                className="rounded-xl"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                学生登录教务系统的地址，可留空。留空时客户端回退到官方网站。
              </p>
            </div>
            <div className="space-y-2">
              <Label>功能模块</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Checkbox
                      id={`feature-${f}`}
                      checked={formFeatures.includes(f)}
                      onCheckedChange={() => toggleFeature(f)}
                      className="rounded"
                    />
                    <Label
                      htmlFor={`feature-${f}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {FEATURE_LABELS[f]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="week-start-day">周起始日</Label>
              <Select
                value={String(formWeekStartDay)}
                onValueChange={(value) => setFormWeekStartDay(Number(value))}
              >
                <SelectTrigger id="week-start-day" className="rounded-xl w-full">
                  <SelectValue placeholder="选择周起始日" />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_DAYS.map(({ value, label }) => (
                    <SelectItem key={value} value={String(value)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editing && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="form-enabled"
                  checked={formEnabled}
                  onCheckedChange={(v) => setFormEnabled(!!v)}
                  className="rounded"
                />
                <Label htmlFor="form-enabled" className="text-sm font-normal cursor-pointer">
                  启用
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl">
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="rounded-xl"
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="确认删除"
        description={`确定要删除学校「${deleteTarget?.name}」吗？此操作不可撤销。`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
