import { ArchaeologyReport } from './models';

/**
 * 导出前校验：在打印 / 保存《关系考古报告》之前，核对报告内部数据
 * 与地层投影的一致性。返回问题清单，空数组表示校验通过、允许导出。
 */
export function validateReportForExport(
  report: ArchaeologyReport,
  selectedLayerIndex: number
): string[] {
  const problems: string[] = [];
  const strata = report.strata || [];

  if (strata.length === 0) {
    problems.push('地层数据为空，报告没有可导出的地质剖面');
    return problems;
  }

  if (selectedLayerIndex < 0 || selectedLayerIndex >= strata.length) {
    problems.push(`当前选择层位越界（第 ${selectedLayerIndex + 1} 层，共 ${strata.length} 层）`);
  }

  strata.forEach(layer => {
    const tag = `Layer 0${layer.depthLevel}`;
    if (layer.temperatureCelsius < 0 || layer.temperatureCelsius > 100) {
      problems.push(`${tag} 地温 ${layer.temperatureCelsius}°C 超出 0-100°C 合理区间`);
    }
    if (layer.messageCount <= 0) {
      problems.push(`${tag} 对话标本数为 ${layer.messageCount}，地层切片异常`);
    }
    const sedimentEntries = Object.entries(layer.sediment) as [string, number][];
    for (const [key, value] of sedimentEntries) {
      if (value < 0 || value > 100) {
        problems.push(`${tag} 沉积物「${key}」占比 ${value}% 越界`);
      }
    }
    if (!layer.timeRange.start || !layer.timeRange.end) {
      problems.push(`${tag} 缺少沉积时段起止日期`);
    }
  });

  const layerMessageSum = strata.reduce((sum, layer) => sum + layer.messageCount, 0);
  if (layerMessageSum !== report.totalMessages) {
    problems.push(`各地层标本数之和（${layerMessageSum}）与出土总标本数（${report.totalMessages}）不一致`);
  }

  const layerFossilCount = strata.reduce((sum, layer) => sum + layer.fossilRelics.length, 0);
  if (layerFossilCount !== report.notableRelics.length) {
    problems.push(`化石总清单（${report.notableRelics.length} 件）与各地层出土记录（${layerFossilCount} 件）不一致`);
  }

  if (!report.peakEpoch || !strata.some(layer => layer.epochName === report.peakEpoch)) {
    problems.push('最高温纪元无法在地层投影中定位');
  }
  if (!report.coolingEpoch || !strata.some(layer => layer.epochName === report.coolingEpoch)) {
    problems.push('渐冷纪元无法在地层投影中定位');
  }

  report.notableRelics.forEach(fossil => {
    if (!fossil.dateStr || !fossil.quote) {
      problems.push(`化石「${fossil.name}」缺少出土日期或引文`);
    }
    if (fossil.preservationScore < 0 || fossil.preservationScore > 100) {
      problems.push(`化石「${fossil.name}」保存完好度 ${fossil.preservationScore}% 越界`);
    }
  });

  return problems;
}
