const categoryLabels: Record<string, string> = {
  automation: "自动化",
  coding: "编程",
  data: "数据",
  development: "开发工具",
  productivity: "效率",
  search: "搜索",
  security: "安全",
  web: "Web",
};

export function categoryLabel(category: string): string {
  return categoryLabels[category] ?? category.replaceAll("-", " ");
}

export function compatibilityTone(status: "compatible" | "incompatible" | "unknown"): string {
  return status === "compatible" ? "is-compatible" : status === "incompatible" ? "is-incompatible" : "is-unknown";
}

export function compatibilityLabel(
  status: "compatible" | "incompatible" | "unknown",
  level: "unverified" | "declared" | "validated" | "tested",
): string {
  const statusLabel = status === "compatible" ? "兼容" : status === "incompatible" ? "不兼容" : "待验证";
  const levelLabel = level === "tested" ? "已测试" : level === "validated" ? "已校验" : level === "declared" ? "依赖声明" : "未验证";
  return `${statusLabel} · ${levelLabel}`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export function formatStars(value: number): string {
  return value >= 1_000 ? `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k` : String(value);
}
