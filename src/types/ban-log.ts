/**
 * 一条封禁日志。
 *
 * 字段名保持 snake_case：EduApi 的 `v1/login-ops/ban-logs` 直接把
 * XAUAT.LoginApi 的响应原样透传，没有再做一层命名转换。
 */
export interface BanLogItem {
  /** `auto_ban`（自动封禁）或 `manual_unban`（手动解封）。 */
  type: string;
  /** 中文标签：自动封禁 / 手动解封。 */
  type_label: string;
  created_at: number;
  /** `yyyy-MM-dd HH:mm:ss`。 */
  created_at_human: string;
  /**
   * 解封时刻。
   *
   * 是可选的，但**不要**据此推断"手动解封没有"——正常的手动解封条目取的是解封前的
   * `previous` 快照，快照里有 `unban_at`，所以照样会带上。只有既无 `data` 又无
   * `previous` 的条目才会整个键缺失。无论如何都不能按 `0` 处理（会被格式化成 1970 年）。
   */
  unban_at?: number;
  unban_at_human?: string;
  reason: string;
  /**
   * 账号标识。新形状是 `{学校}:{用户名}`，历史条目是三段式
   * `{学校}:{用户名}:{密码哈希}` —— 解封时取前两段即可兼容两者。
   */
  account: string;
}
