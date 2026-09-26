import { ReportProjection } from '../core/report-projection';

/**
 * 报告导出适配器：负责把「已通过校验」的报告投影交付给浏览器导出通道。
 * 导出的数据源与页面、报告弹窗共用同一个 ReportProjection 快照。
 */
export class ReportExportAdapter {
  /** 触发浏览器打印 / 另存为 PDF（弹窗内的报告投影即导出内容）。 */
  printReportArchive(projection: ReportProjection): void {
    // 导出前在文档标题上临时标注报告编号，便于另存档案时识别来源快照
    const originalTitle = document.title;
    document.title = `${projection.report.siteCode} · 关系考古报告`;
    try {
      window.print();
    } finally {
      document.title = originalTitle;
    }
  }
}
