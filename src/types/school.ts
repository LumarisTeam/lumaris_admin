export type Feature =
  | "timetable"
  | "grade_query"
  | "gpa_calculation"
  | "course_schedule"
  | "exam_schedule"
  | "login"
  | "bus_schedule"
  | "program"
  | "study_progress"
  | "electricity"
  | "payment"
  | "map";

export const FEATURE_LABELS: Record<Feature, string> = {
  timetable: "日历",
  grade_query: "成绩查询",
  gpa_calculation: "GPA计算",
  course_schedule: "课程显示",
  exam_schedule: "考试安排",
  login: "登录",
  bus_schedule: "校车时刻表",
  program: "培养方案",
  study_progress: "学业进度",
  electricity: "电费查询",
  payment: "校园卡",
  map: "校园地图",
};

export const ALL_FEATURES: Feature[] = Object.keys(FEATURE_LABELS) as Feature[];

/** Weekday values used by the school API (0 = Sunday, 6 = Saturday). */
export const WEEK_DAYS = [
  { value: 0, label: "周日" },
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
] as const;

export interface School {
  code: string;
  name: string;
  website: string;
  /** 学生登录教务系统的地址；为空时客户端回退到 website。 */
  edu_system_url: string;
  features: Feature[];
  enabled: boolean;
  week_start_day: number;
  created_at: string;
  updated_at: string;
}
