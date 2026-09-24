import { useEffect, useState } from "react";
import { MapPin, School, Users } from "lucide-react";
import { toast } from "sonner";
import { getMapPois } from "@/services/map";
import { getAdminSchools } from "@/services/admin/school";
import { getActiveUserCount } from "@/services/login-ops";
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";

export default function DashboardPage() {
  const [poiCount, setPoiCount] = useState<number | null>(null);
  const [schoolCount, setSchoolCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      getMapPois()
        .then((data) => setPoiCount(data.length))
        .catch((err) => toast.error(err instanceof Error ? err.message : "加载POI数据失败")),
      getAdminSchools()
        .then((res) => setSchoolCount(res.total))
        .catch((err) => toast.error(err instanceof Error ? err.message : "加载学校数据失败")),
      getActiveUserCount()
        .then(setUserCount)
        .catch((err) => toast.error(err instanceof Error ? err.message : "加载用户数据失败")),
    ]);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground mt-1.5">系统数据概览</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {poiCount !== null ? (
          <StatCard icon={<MapPin className="size-5" />} label="地图 POI 总数" value={poiCount} />
        ) : (
          <StatCardSkeleton />
        )}
        {schoolCount !== null ? (
          <StatCard icon={<School className="size-5" />} label="学校总数" value={schoolCount} />
        ) : (
          <StatCardSkeleton />
        )}
        {/* 口径：存活的 SSO 票据数，不按人去重——同一学生换一次密码就会多算一个 */}
        {userCount !== null ? (
          <StatCard icon={<Users className="size-5" />} label="活跃用户数" value={userCount} />
        ) : (
          <StatCardSkeleton />
        )}
      </div>
    </div>
  );
}
