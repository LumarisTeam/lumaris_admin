import xauatRequest from "./xauat-request";
import type { LogEntry, LogPage, LogLevel } from "@/types/log";

interface BackendLogPage {
  page?: number;
  Page?: number;
  pageSize?: number;
  page_size?: number;
  PageSize?: number;
  total?: number;
  Total?: number;
  totalPages?: number;
  total_pages?: number;
  TotalPages?: number;
  items?: LogEntry[];
  Items?: LogEntry[];
}
export interface LogQuery { page: number; pageSize: number; level?: LogLevel; search?: string }

function normalize(data: BackendLogPage): LogPage {
  const pageSize = data.pageSize ?? data.page_size ?? data.PageSize ?? 50;
  const total = data.total ?? data.Total ?? 0;
  return {
    page: data.page ?? data.Page ?? 1,
    pageSize,
    total,
    totalPages: data.totalPages ?? data.total_pages ?? data.TotalPages ?? (total ? Math.ceil(total / pageSize) : 0),
    items: data.items ?? data.Items ?? [],
  };
}

export async function getEduApiLogs(query: LogQuery): Promise<LogPage> {
  const response = await xauatRequest.get<BackendLogPage>("/Logs", { params: query });
  return normalize(response.data);
}
