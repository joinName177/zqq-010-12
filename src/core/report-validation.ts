import { ArchaeologyReport } from './models';

/**
 * 导出前校验：在打印 / 保存《关系考古报告》之前，
 * 校验报告数据完整性与口径一致性，发现问题则阻止导出。
 */

export interface ExportValidation {
  ok: boolean;
  issues: string[];
}

export function validateReportForExport(report: ArchaeologyReport): ExportValidation {
  const issues: string[] = [];

  if (!report.siteName || !report.siteCode) {
    issues.push('遗址名称或编号缺失');
  }
  if (!report.excavatedAt) {
    issues.push('发掘时间缺失');
  }
  if (report.strata.length === 0) {
    issues.push('地层剖面为空，无法生成报告');
    return { ok: false, issues };
  }

  // 汇总口径：各层遗存数之和必须等于总标本数
  const layerMessageSum = report.strata.reduce((sum, layer) => sum + layer.messageCount, 0);
  if (layerMessageSum !== report.totalMessages) {
    issues.push(`各层遗存数之和（${layerMessageSum}）与出土总标本数（${report.totalMessages}）不一致`);
  }
  if (!(report.totalDays >= 1)) {
    issues.push('对话沉淀跨度异常（不足 1 天）');
  }

  // 地层序列与逐层数值范围（层位编号允许因空层缺失，但必须递增且在 1-5 量程内）
  report.strata.forEach((layer, idx) => {
    const tag = `Layer 0${layer.depthLevel}`;
    if (layer.depthLevel < 1 || layer.depthLevel > 5) {
      issues.push(`${tag} 层位编号超出 1-5 地质量程`);
    }
    if (idx > 0 && layer.depthLevel <= report.strata[idx - 1].depthLevel) {
      issues.push(`${tag} 层位编号未按自浅入深顺序递增`);
    }
    if (layer.temperatureCelsius < 0 || layer.temperatureCelsius > 100) {
      issues.push(`${tag} 关系地温 ${layer.temperatureCelsius}°C 超出 0-100 量程`);
    }
    if (!layer.timeRange.start || !layer.timeRange.end || layer.timeRange.start > layer.timeRange.end) {
      issues.push(`${tag} 时间范围异常（${layer.timeRange.start} ~ ${layer.timeRange.end}）`);
    }
    const sedimentSum =
      layer.sediment.warmth + layer.sediment.longing + layer.sediment.daily + layer.sediment.friction + layer.sediment.silence;
    // 合计 0 表示该层未检出词典情感词汇（合法状态），否则必须收敛到 100% 口径
    if (sedimentSum !== 0 && (sedimentSum < 98 || sedimentSum > 102)) {
      issues.push(`${tag} 情感沉积物化验合计 ${sedimentSum}%，偏离 100% 口径`);
    }
    layer.fossilRelics.forEach(fossil => {
      if (!fossil.quote) {
        issues.push(`${tag} 化石「${fossil.name}」缺少引文标本`);
      }
      if (fossil.preservationScore < 0 || fossil.preservationScore > 100) {
        issues.push(`${tag} 化石「${fossil.name}」保存完好度 ${fossil.preservationScore}% 越界`);
      }
    });
  });

  // 化石总账：报告级名录必须与各层出土记录一致
  const layerFossilCount = report.strata.reduce((sum, layer) => sum + layer.fossilRelics.length, 0);
  if (report.notableRelics.length !== layerFossilCount) {
    issues.push(`化石名录（${report.notableRelics.length} 件）与各层出土记录（${layerFossilCount} 件）不一致`);
  }

  if (!report.peakEpoch || !report.coolingEpoch) {
    issues.push('温差纪年（最高温/渐冷纪元）缺失');
  }

  return { ok: issues.length === 0, issues };
}
