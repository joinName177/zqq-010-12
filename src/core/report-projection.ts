import { ArchaeologyReport, FossilArtifact, StrataLayer } from './models';
import {
  DEPTH_METERS_PER_LEVEL,
  formatDepthFromMeters,
  formatLayerDepth,
  formatTemperature
} from './format';

export interface FossilProjectionRow {
  fossil: FossilArtifact;
  layerLabel: string; // 如 'Layer 03'
  depthText: string;  // 如 '-7.2m'
}

export interface StrataProjectionRow {
  layer: StrataLayer;
  index: number;
  depthText: string;       // 层位深度，如 '-2.4m'
  temperatureText: string; // 如 '36°C'
  timeRangeText: string;   // 如 '2017-09-12 ~ 2018-05-20'
  fossils: FossilProjectionRow[];
  isSelected: boolean;
  isPeak: boolean;
  isCooling: boolean;
}

/**
 * 报告数据投影：页面岩芯柱、层位详情与《关系考古报告》弹窗/导出
 * 全部从该投影读取同一份数据快照与同一批格式化文本，确保三处口径一致。
 */
export interface ReportProjection {
  report: ArchaeologyReport;
  selectedLayerIndex: number;
  rows: StrataProjectionRow[];
  current: StrataProjectionRow;
  fossils: FossilProjectionRow[]; // 全部地层化石的扁平清单（与各行 fossils 同源）
  totalDepthText: string;         // 总发掘深度，如 '12.0m'
  selectedLayerBanner: string;    // 当前选择层位说明
}

export function buildReportProjection(
  report: ArchaeologyReport,
  selectedLayerIndex: number
): ReportProjection {
  const strata = report.strata;
  const safeIndex = Math.min(Math.max(0, selectedLayerIndex), Math.max(0, strata.length - 1));

  const rows: StrataProjectionRow[] = strata.map((layer, index) => {
    const layerLabel = `Layer 0${layer.depthLevel}`;
    const fossils: FossilProjectionRow[] = layer.fossilRelics.map(fossil => ({
      fossil,
      layerLabel,
      depthText: formatDepthFromMeters(fossil.depthMeters)
    }));
    return {
      layer,
      index,
      depthText: formatLayerDepth(layer.depthLevel),
      temperatureText: formatTemperature(layer.temperatureCelsius),
      timeRangeText: `${layer.timeRange.start} ~ ${layer.timeRange.end}`,
      fossils,
      isSelected: index === safeIndex,
      isPeak: layer.epochName === report.peakEpoch,
      isCooling: layer.epochName === report.coolingEpoch
    };
  });

  const current = rows[safeIndex] || rows[0];
  // 总发掘深度以最深层位为准（层数可能因稀疏数据少于 5 层，但层位编号不变）
  const maxDepthLevel = strata.reduce((max, layer) => Math.max(max, layer.depthLevel), 0);

  return {
    report,
    selectedLayerIndex: safeIndex,
    rows,
    current,
    fossils: rows.flatMap(row => row.fossils),
    totalDepthText: `${(maxDepthLevel * DEPTH_METERS_PER_LEVEL).toFixed(1)}m`,
    selectedLayerBanner: current
      ? `Layer 0${current.layer.depthLevel} · ${current.layer.epochName}`
      : '无可用层位'
  };
}
