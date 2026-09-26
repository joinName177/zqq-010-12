import { SampleSitesAdapter } from '../src/adapters/sample-data.adapter';
import { ArchaeologyEngineAdapter } from '../src/adapters/archaeology-engine.adapter';
import { buildReportProjection, clampLayerIndex } from '../src/core/report-projection';
import { validateReportForExport } from '../src/core/report-validation';
import { LAYER_DEPTH_METERS, formatDate } from '../src/core/formatters';

const engine = new ArchaeologyEngineAdapter();
const sites = new SampleSitesAdapter().getSites();

let failures = 0;
const check = (cond: boolean, msg: string) => {
  if (!cond) { failures++; console.error('  ✗', msg); }
  else console.log('  ✓', msg);
};

// 0. 本地时区日期不偏移（旧实现 toISOString 在 UTC+8 下会偏到前一天）
console.log('== 日期基准 ==');
check(formatDate(new Date('2018-05-20 00:00:01')) === '2018-05-20', '本地午夜消息日期不偏移');
check(formatDate(new Date('2023-12-31 23:59:59')) === '2023-12-31', '跨日边界不偏移');

for (const site of sites) {
  console.log(`\n== ${site.name} ==`);
  const report = engine.excavateSite(site.data, site.name);

  // 1. 投影：页面与报告同源
  const view = buildReportProjection(report, 2);
  check(view.layers.length === report.strata.length, '投影层数与报告地层一致');
  check(view.selectedLayerIndex === 2 && view.layers[2].isSelected, '当前选中层在投影中唯一标注');
  check(view.layers.filter(l => l.isSelected).length === 1, '仅一个层位被标注为选中');

  // 2. 深度口径：总深度 = 层数 × 统一系数；化石深度 = 层位 × 同一系数
  check(view.totalDepthText === `-${(report.strata.length * LAYER_DEPTH_METERS).toFixed(1)}m`, `总深度口径统一 (${view.totalDepthText})`);
  const origin = report.notableRelics.find(r => r.id === 'relic-origin');
  if (origin) check(origin.depthMeters === 5 * LAYER_DEPTH_METERS, `原点化石深度 ${origin.depthMeters}m = 5×${LAYER_DEPTH_METERS}`);
  report.strata.forEach(l => l.fossilRelics.forEach(f => {
    if (f.id !== 'relic-origin') check(f.depthMeters === l.depthLevel * LAYER_DEPTH_METERS, `化石 ${f.id} 深度与层位一致`);
  }));

  // 3. 日期无 UTC 跨日偏移（本地午夜消息）
  const midnight = report.notableRelics.find(r => r.quote.includes('520'));
  if (midnight) check(midnight.dateStr === '2018-05-20', `午夜消息日期不偏移 (${midnight.dateStr})`);
  report.strata.forEach(l => check(/^\d{4}-\d{2}-\d{2}$/.test(l.timeRange.start), `Layer 0${l.depthLevel} 时间格式统一 YYYY-MM-DD`));
  check(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(report.excavatedAt), `发掘时间格式统一 (${report.excavatedAt})`);

  // 4. 导出前校验通过
  const validation = validateReportForExport(report);
  check(validation.ok, `导出校验通过${validation.ok ? '' : '：' + validation.issues.join('；')}`);

  // 5. 越界选择钳制
  check(clampLayerIndex(report, 99) === report.strata.length - 1, '越界索引钳制到末层');
  check(clampLayerIndex(report, -3) === 0, '负索引钳制到首层');

  // 6. 汇总口径
  const sum = report.strata.reduce((s, l) => s + l.messageCount, 0);
  check(sum === report.totalMessages, `各层遗存之和 ${sum} = 总标本 ${report.totalMessages}`);
}

// 7. 校验能拦截坏数据
console.log('\n== 异常报告拦截 ==');
const bad = engine.excavateSite(sites[0].data, sites[0].name);
bad.strata[0].temperatureCelsius = 120;
bad.totalMessages += 5;
const badResult = validateReportForExport(bad);
check(!badResult.ok && badResult.issues.length >= 2, `异常报告被拦截（${badResult.issues.length} 个问题）`);

console.log(failures === 0 ? '\n全部通过 ✅' : `\n${failures} 项失败 ❌`);
process.exit(failures === 0 ? 0 : 1);
