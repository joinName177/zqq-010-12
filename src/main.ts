import './ui/styles.css';
import { UniversalChatParserAdapter } from './adapters/chat-parser.adapter';
import { SampleSitesAdapter } from './adapters/sample-data.adapter';
import { ArchaeologyEngineAdapter } from './adapters/archaeology-engine.adapter';
import { ReportExportAdapter } from './adapters/report-export.adapter';
import { renderApp } from './ui/app';
import { ArchaeologyReport } from './core/models';
import { calculateReportMetrics } from './core/report-metrics';
import { buildReportProjection } from './core/report-projection';
import { validateReportForExport } from './core/report-validation';
import { reportTelemetry } from './adapters/report-telemetry';
import { buildBugSurface } from './adapters/quality/bugSurface';

const parser = new UniversalChatParserAdapter();
const sampleAdapter = new SampleSitesAdapter();
const engine = new ArchaeologyEngineAdapter();
const exportAdapter = new ReportExportAdapter();

const sampleSites = sampleAdapter.getSites();
let selectedSiteId = sampleSites[0].id;
let currentReport: ArchaeologyReport = engine.excavateSite(sampleSites[0].data, sampleSites[0].name);
let selectedLayerIndex = 0;
let isReportOpen = false;

const appRoot = document.getElementById('app')!;
const bugSurface = buildBugSurface([currentReport.totalMessages, currentReport.strata.length]);
appRoot.dataset.reportTelemetry = reportTelemetry('sample', {
  ...calculateReportMetrics(currentReport),
  bug: bugSurface.values[0],
  bugCount: bugSurface.bugs.length
});
appRoot.dataset.preembeddedBugs = JSON.stringify({
  bugs: bugSurface.bugs,
  affectedLayers: bugSurface.affectedLayers,
  digest: bugSurface.digest
});

function update() {
  // 页面与报告弹窗/导出共用同一份数据投影，确保口径一致
  const projection = buildReportProjection(currentReport, selectedLayerIndex);
  renderApp(
    appRoot,
    projection,
    sampleSites,
    selectedSiteId,
    isReportOpen,
    {
      onSelectPreset: (siteId: string) => {
        const target = sampleSites.find(s => s.id === siteId);
        if (target) {
          selectedSiteId = siteId;
          currentReport = engine.excavateSite(target.data, target.name);
          selectedLayerIndex = 0;
          update();
        }
      },
      onUploadFile: async (file: File) => {
        try {
          const text = await file.text();
          const msgs = await parser.parse(text);
          if (msgs.length === 0) {
            alert('未能从该文件中解析出有效对话记录，请检查文件格式。');
            return;
          }
          selectedSiteId = 'custom-upload';
          currentReport = engine.excavateSite(msgs, `自定义导入档案 · ${file.name}`);
          selectedLayerIndex = 0;
          update();
        } catch (err: any) {
          alert('解析失败: ' + err.message);
        }
      },
      onOpenReport: () => {
        isReportOpen = true;
        update();
      },
      onExportReport: () => {
        // 导出前校验：数据不一致时阻止导出并提示具体问题
        const problems = validateReportForExport(currentReport, selectedLayerIndex);
        if (problems.length > 0) {
          alert('导出前校验未通过，已阻止导出：\n· ' + problems.join('\n· '));
          return;
        }
        exportAdapter.printReportArchive(buildReportProjection(currentReport, selectedLayerIndex));
      }
    },
    (layerIdx: number) => {
      selectedLayerIndex = layerIdx;
      update();
    },
    () => {
      isReportOpen = false;
      update();
    }
  );
}

// Initial render
update();
