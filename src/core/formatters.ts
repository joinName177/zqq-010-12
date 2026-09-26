/**
 * 统一文本格式与度量常量。
 * 页面展示与《关系考古报告》导出必须共用本模块，
 * 禁止在 UI / 引擎内各自拼接日期、深度、温度文本。
 */

/** 每个地层位的标准埋藏深度（米）。岩芯柱、总深度、化石深度共用此系数。 */
export const LAYER_DEPTH_METERS = 2.4;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 本地时区日历日期：YYYY-MM-DD（不使用 UTC 基准，避免跨日偏移） */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 本地时区日期时间：YYYY-MM-DD HH:mm:ss */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/** 深度文本：-12.0m */
export function formatDepth(meters: number): string {
  return `-${meters.toFixed(1)}m`;
}

/** 地层位埋藏深度（米） */
export function layerDepthMeters(depthLevel: number): number {
  return depthLevel * LAYER_DEPTH_METERS;
}

/** 温度文本：62°C（先取整，页面与报告同一舍入口径） */
export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°C`;
}

/** 百分比文本：35% */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
