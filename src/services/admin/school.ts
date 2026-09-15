import request from "../request";
import type { ApiResponse, PaginatedData } from "../../types/api";
import type { School, Feature } from "../../types/school";

export interface CreateSchoolData {
  code: string;
  name: string;
  website: string;
  /** 可为空串；留空则客户端回退到 website。 */
  edu_system_url: string;
  features: Feature[];
  week_start_day: number;
}

export interface UpdateSchoolData {
  name?: string;
  website?: string;
  edu_system_url?: string;
  features?: Feature[];
  enabled?: boolean;
  week_start_day?: number;
}

/** 列出所有学校（含未启用），支持分页 */
export async function getAdminSchools(
  page = 1,
  pageSize = 50,
): Promise<PaginatedData<School>> {
  const res = await request.get<ApiResponse<PaginatedData<School>>>(
    "/api/v1/admin/schools",
    { params: { page, page_size: pageSize } },
  );
  return res.data.data;
}

/** 新增学校 */
export async function createSchool(data: CreateSchoolData): Promise<School> {
  const res = await request.post<ApiResponse<School>>("/api/v1/admin/schools", data);
  return res.data.data;
}

/** 更新学校（部分更新） */
export async function updateSchool(code: string, data: UpdateSchoolData): Promise<School> {
  const res = await request.put<ApiResponse<School>>(
    `/api/v1/admin/schools/${encodeURIComponent(code)}`,
    data,
  );
  return res.data.data;
}

/** 删除学校 */
export async function deleteSchool(code: string): Promise<void> {
  await request.delete<ApiResponse<null>>(`/api/v1/admin/schools/${encodeURIComponent(code)}`);
}
