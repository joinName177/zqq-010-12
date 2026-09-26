import { ArchaeologyReport, FossilArtifact } from './models';
import {
  formatDate,
  formatDepth,
  formatPercent,
  formatTemperature,
  layerDepthMeters
} from './formatters';

/**
 * 报告数据投影：把领域模型 ArchaeologyReport 投影为
 * 页面展示与报告导出共用的唯一视图模型。
 * 所有展示文本在此一次性格式化，禁止下游各自拼接。
 */

export interface FossilProjection {
  id: string;
  category: string;
  dateText: string;
  depthText: string;
  sender: string;
  quote: string;
  notes: string;
  preservationText: string;
}

export interface SedimentProjection {
  label: string;
  valueText: string;
  value: number;
}

export interface LayerProjection {
  index: number;
  depthLevel: number;
  layerTag: string;       // Layer 01 · Q4-Modern
  epochName: string;
  geologicalCode: string;
  lithology: string;
  timeRangeText: string;  // 2023-01-01 ~ 2023-06-01
  depthText: string;      // -2.4m
  temperatureText: string;
  temperatureCelsius: number;
  messageCount: number;
  sediment: SedimentProjection[];
  topics: string[];
  fossils: FossilProjection[];
  isSelected: boolean;
}

export interface ReportProjection {
  siteCode: string;
  siteName: string;
  excavatedAtText: string;
  totalMessages: number;
  totalDays: number;
  carbon14Text: string;
  totalDepthText: string;
  peakEpoch: string;
  coolingEpoch: string;
  archaeologicalSummary: string;
  curatorAssessment: string;
  layers: LayerProjection[];
  notableRelics: FossilProjection[];
  /** 钳制后的当前选中层索引（页面选中态与报告标注共用） */
  selectedLayerIndex: number;
  selectedLayer: LayerProjection;
}

function projectFossil(fossil: FossilArtifact): FossilProjection {
  return {
    id: fossil.id,
    category: fossil.category,
    dateText: fossil.dateStr,
    depthText: formatDepth(fossil.depthMeters),
    sender: fossil.sender,
    quote: fossil.quote,
    notes: fossil.archaeologicalNotes,
    preservationText: formatPercent(fossil.preservationScore)
  };
}

/** 把任意外部传入的层索引钳制到合法范围，保证页面与报告看到同一当前层 */
export function clampLayerIndex(report: ArchaeologyReport, index: number): number {
  if (report.strata.length === 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  if (index >= report.strata.length) return report.strata.length - 1;
  return Math.floor(index);
}

export function buildReportProjection(report: ArchaeologyReport, selectedLayerIndex: number): ReportProjection {
  const selected = clampLayerIndex(report, selectedLayerIndex);

  const layers: LayerProjection[] = report.strata.map((layer, index) => ({
    index,
    depthLevel: layer.depthLevel,
    layerTag: `Layer 0${layer.depthLevel} · ${layer.geologicalCode}`,
    epochName: layer.epochName,
    geologicalCode: layer.geologicalCode,
    lithology: layer.lithology,
    timeRangeText: `${layer.timeRange.start} ~ ${layer.timeRange.end}`,
    depthText: formatDepth(layerDepthMeters(layer.depthLevel)),
    temperatureText: formatTemperature(layer.temperatureCelsius),
    temperatureCelsius: layer.temperatureCelsius,
    messageCount: layer.messageCount,
    sediment: [
      { label: '依恋温存', value: layer.sediment.warmth, valueText: formatPercent(layer.sediment.warmth) },
      { label: '牵挂思念', value: layer.sediment.longing, valueText: formatPercent(layer.sediment.longing) },
      { label: '生活琐碎', value: layer.sediment.daily, valueText: formatPercent(layer.sediment.daily) },
      { label: '情绪摩擦', value: layer.sediment.friction, valueText: formatPercent(layer.sediment.friction) },
      { label: '沉默冷却', value: layer.sediment.silence, valueText: formatPercent(layer.sediment.silence) }
    ],
    topics: layer.dominantTopics,
    fossils: layer.fossilRelics.map(projectFossil),
    isSelected: index === selected
  }));

  return {
    siteCode: report.siteCode,
    siteName: report.siteName,
    excavatedAtText: report.excavatedAt,
    totalMessages: report.totalMessages,
    totalDays: report.totalDays,
    carbon14Text: formatPercent(report.carbon14Activity),
    totalDepthText: formatDepth(report.strata.length * layerDepthMeters(1)),
    peakEpoch: report.peakEpoch,
    coolingEpoch: report.coolingEpoch,
    archaeologicalSummary: report.archaeologicalSummary,
    curatorAssessment: report.curatorAssessment,
    layers,
    notableRelics: report.notableRelics.map(projectFossil),
    selectedLayerIndex: selected,
    selectedLayer: layers[selected]
  };
}

/** 兼容旧调用：直接给出本地时区日期文本（引擎生成 dateStr / timeRange 时使用） */
export function projectionDateText(date: Date): string {
  return formatDate(date);
}
