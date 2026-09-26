// 全局统一的文本格式化与地层深度换算基准。
// 页面岩芯柱、层位详情、化石卡片与《关系考古报告》必须引用同一套格式函数，
// 任何位置不得再内联拼写深度、温度或日期字符串。

export const DEPTH_METERS_PER_LEVEL = 2.4;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 本地时区日历日（YYYY-MM-DD）。不得使用 toISOString()，避免 UTC 换算导致跨日漂移。 */
export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 本地时区时间戳（YYYY-MM-DD HH:mm:ss），与 formatLocalDate 保持同一日期基准。 */
export function formatLocalDateTime(date: Date): string {
  return `${formatLocalDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/** 发掘深度文本（负值表示地表以下），页面与报告共用。 */
export function formatDepthFromMeters(meters: number): string {
  return `-${meters.toFixed(1)}m`;
}

/** 按层位换算的发掘深度文本。 */
export function formatLayerDepth(depthLevel: number): string {
  return formatDepthFromMeters(depthLevel * DEPTH_METERS_PER_LEVEL);
}

/** 关系地温文本，统一整数舍入口径。 */
export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°C`;
}
