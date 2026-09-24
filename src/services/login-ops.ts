import xauatRequest from "./xauat-request";
import type { ApiResponse, PaginatedData } from "../types/api";
import type { BanLogItem } from "../types/ban-log";

export interface BanLogQuery {
  school?: string;
  username?: string;
}

/**
 * 活跃用户数。
 *
 * 口径是当前存活的 SSO 票据数量，**不按人去重**——同一个学生换一次密码
 * 就会多算一个。这是上游（LoginApi/Flask）的既有定义。
 */
export async function getActiveUserCount(): Promise<number> {
  const res = await xauatRequest.get<ApiResponse<{ count: number }>>(
    "v1/login-ops/user-count",
  );
  return res.data.data.count;
}

/** 封禁日志（最新在前）。上游固定只返回最近 200 条，因此不分页。 */
export async function getBanLogs(query: BanLogQuery = {}): Promise<PaginatedData<BanLogItem>> {
  const res = await xauatRequest.get<ApiResponse<PaginatedData<BanLogItem>>>(
    "v1/login-ops/ban-logs",
    { params: { school: query.school || undefined, username: query.username || undefined } },
  );
  return res.data.data ?? { total: 0, items: [] };
}

/**
 * 手动解封。
 *
 * 「该用户当前未被封禁」上游回 400，会被 axios 拦截器转成带原文的 `Error`，
 * 调用方直接 toast 即可。
 */
export async function unbanUser(school: string, username: string): Promise<void> {
  await xauatRequest.post<ApiResponse<unknown>>("v1/login-ops/unban", { school, username });
}
