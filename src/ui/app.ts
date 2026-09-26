import { ArchaeologyReport } from '../core/models';
import { SampleSite } from '../adapters/sample-data.adapter';
import { buildReportProjection, ReportProjection } from '../core/report-projection';

export interface UIEventHandlers {
  onSelectPreset: (siteId: string) => void;
  onUploadFile: (file: File) => void;
  onOpenReport: () => void;
  onExportReport: () => void;
}

const SEDIMENT_COLORS = ['#e76f51', '#f4a261', '#2a9d8f', '#9d0208', '#6c757d'];

export function renderApp(
  container: HTMLElement,
  report: ArchaeologyReport,
  sampleSites: SampleSite[],
  selectedSiteId: string,
  selectedLayerIndex: number,
  isReportOpen: boolean,
  exportIssues: string[] | null,
  handlers: UIEventHandlers,
  onSelectLayer: (idx: number) => void,
  onCloseReport: () => void
) {
  // 页面与导出报告共用的唯一数据投影（含钳制后的当前选中层）
  const view = buildReportProjection(report, selectedLayerIndex);
  const currentLayer = view.selectedLayer;

  const escapeHtml = (str: string) =>
    str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

  container.innerHTML = `
    <div class="archaeo-app">
      <header class="site-header">
        <div class="brand">
          <div class="brand-icon">⛏️</div>
          <div>
            <h1>对话地层学 · 关系考古勘探系统</h1>
            <p>RELATIONSHIP STRATIGRAPHY &amp; EXCAVATION REPORT · v1.0.0</p>
          </div>
        </div>
        <div class="header-status">
          <span>● 发掘就绪 | 标本勘测点：${escapeHtml(view.siteCode)}</span>
        </div>
      </header>

      <section class="control-hub">
        <div class="preset-sites">
          <div class="preset-title">
            <span>🏺 历史遗址标本库 (点击切换发掘地)：</span>
          </div>
          <div class="preset-btns">
            ${sampleSites
              .map(
                s => `
              <button class="btn-preset ${s.id === selectedSiteId ? 'active' : ''}" data-site="${s.id}">
                <strong>${escapeHtml(s.name)}</strong>
                <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(s.eraSpan)}</div>
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="upload-section">
          <div class="drop-area" id="dropArea">
            <input type="file" id="chatFileInput" class="file-input" accept=".txt,.json,.csv" />
            <p>📄 拖拽或点击导入本地聊天记录文件 (支持微信/QQ/短信文本导出格式)</p>
            <span style="font-size:12px;color:var(--text-muted);">纯前端本地地质切片计算，无任何网络传输</span>
          </div>
          <button class="btn-report" id="btnOpenReport">
            📜 生成关系考古报告
          </button>
        </div>
      </section>

      <main class="strata-layout">
        <!-- Left: Stratigraphic Column -->
        <section class="core-column-wrap">
          <div class="column-title">
            <h3>🏛️ 对话地层岩芯柱 (自浅入深)</h3>
            <span class="depth-indicator">总发掘深度: ${view.totalDepthText}</span>
          </div>
          <div class="strata-stack">
            ${view.layers
              .map(
                layer => `
              <div class="strata-card ${layer.isSelected ? 'selected' : ''}"
                   data-layer="${layer.index}"
                   style="--layer-color: ${report.strata[layer.index].colorHex}">
                <div class="strata-card-header">
                  <span class="layer-tag">${layer.layerTag}</span>
                  <span class="layer-depth">深度 ${layer.depthText}</span>
                </div>
                <div class="layer-name">${escapeHtml(layer.epochName)}</div>
                <div class="layer-meta">
                  <span>${layer.timeRangeText}</span>
                  <span class="temp-badge">${layer.temperatureText}</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </section>

        <!-- Right: Layer Inspection Details -->
        <section class="detail-panel">
          <div class="detail-header">
            <div class="detail-epoch">
              Layer 0${currentLayer.depthLevel}：${escapeHtml(currentLayer.epochName)}
            </div>
            <div class="detail-lithology">
              <strong>岩相剖面特征：</strong>${escapeHtml(currentLayer.lithology)}
            </div>
          </div>

          <!-- Temperature -->
          <div class="temp-gauge-box">
            <div class="gauge-title">
              <span>关系地温指数：${currentLayer.temperatureText}</span>
              <span>记录密度：${currentLayer.messageCount} 条对话遗存</span>
            </div>
            <div class="gauge-bar-bg">
              <div class="gauge-bar-fill" style="width: ${currentLayer.temperatureCelsius}%"></div>
            </div>
          </div>

          <!-- Emotional Sediment -->
          <div class="sediment-box">
            <div style="font-size:13px;color:var(--earth-accent);font-weight:600;">
              🧪 情感词汇沉积物化验分析 (Sediment Spectrum)：
            </div>
            <div class="sediment-bars">
              ${currentLayer.sediment
                .map(
                  (item, i) => `
                <div class="sediment-item">
                  <span>${item.label}</span>
                  <div class="sediment-progress"><div class="sediment-fill" style="width:${item.value}%;background:${SEDIMENT_COLORS[i]};"></div></div>
                  <span>${item.valueText}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Dominant Topics -->
          <div style="background:var(--panel-card);padding:16px;border-radius:8px;border:1px solid var(--border-color);">
            <div style="font-size:13px;color:var(--earth-accent);margin-bottom:6px;">
              🏷️ 该层出土核心话题印记：
            </div>
            <div class="topics-cloud">
              ${currentLayer.topics.map(t => `<span class="topic-chip">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>

          <!-- Fossils in this layer -->
          <div class="fossils-section">
            <h4>⛏️ 该层位代表性对话化石 (Unearthed Artifacts)</h4>
            <div class="fossil-cards">
              ${
                currentLayer.fossils.length > 0
                  ? currentLayer.fossils
                      .map(
                        f => `
                    <div class="fossil-item">
                      <div class="fossil-top">
                        <span class="fossil-badge">${escapeHtml(f.category)}</span>
                        <span style="font-family:var(--font-mono);color:var(--text-muted);">${f.dateText} · 发掘深度 ${f.depthText}</span>
                      </div>
                      <div class="fossil-quote">“${escapeHtml(f.quote)}”</div>
                      <div class="fossil-notes">🔬 考古学鉴定：${escapeHtml(f.notes)} (保存完好度: ${f.preservationText})</div>
                    </div>
                  `
                      )
                      .join('')
                  : `<div style="color:var(--text-muted);font-size:13px;">该地层未发现突异晶体化石，呈现均匀日常沉积。</div>`
              }
            </div>
          </div>
        </section>
      </main>

      <!-- Modal: Report -->
      ${
        isReportOpen
          ? renderReportModal(view, exportIssues, escapeHtml)
          : ''
      }
    </div>
  `;

  // Attach event listeners
  container.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const siteId = btn.getAttribute('data-site');
      if (siteId) handlers.onSelectPreset(siteId);
    });
  });

  const dropArea = container.querySelector('#dropArea');
  const fileInput = container.querySelector('#chatFileInput') as HTMLInputElement;

  if (dropArea && fileInput) {
    dropArea.addEventListener('click', () => fileInput.click());
    dropArea.addEventListener('dragover', e => {
      e.preventDefault();
      dropArea.classList.add('hover');
    });
    dropArea.addEventListener('dragleave', () => dropArea.classList.remove('hover'));
    dropArea.addEventListener('drop', e => {
      e.preventDefault();
      dropArea.classList.remove('hover');
      const files = (e as DragEvent).dataTransfer?.files;
      if (files && files.length > 0) {
        handlers.onUploadFile(files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        handlers.onUploadFile(fileInput.files[0]);
      }
    });
  }

  container.querySelector('#btnOpenReport')?.addEventListener('click', () => {
    handlers.onOpenReport();
  });

  container.querySelectorAll('.strata-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-layer') || '0', 10);
      onSelectLayer(idx);
    });
  });

  container.querySelector('#btnCloseReport')?.addEventListener('click', () => {
    onCloseReport();
  });

  container.querySelector('#btnExportReport')?.addEventListener('click', () => {
    handlers.onExportReport();
  });

  container.querySelector('#reportOverlay')?.addEventListener('click', e => {
    if (e.target === container.querySelector('#reportOverlay')) {
      onCloseReport();
    }
  });
}

/**
 * 报告弹窗：与页面共用同一 ReportProjection，
 * 地层剖面、温度、化石名录与页面展示完全一致。
 */
function renderReportModal(
  view: ReportProjection,
  exportIssues: string[] | null,
  escapeHtml: (str: string) => string
): string {
  return `
    <div class="modal-overlay" id="reportOverlay">
      <div class="modal-content">
        <div class="report-seal">国家地层考古认证</div>
        <div class="report-header">
          <h2>《${escapeHtml(view.siteName)}》关系考古发掘总报告</h2>
          <div class="report-sub">
            ARCHAEOLOGICAL FIELD REPORT · 编号 ${escapeHtml(view.siteCode)} · 发掘时间：${view.excavatedAtText}
          </div>
        </div>

        <div class="report-grid">
          <div class="report-stat-card">
            <div class="val">${view.totalDays} 天</div>
            <div class="lbl">对话地质沉淀跨度</div>
          </div>
          <div class="report-stat-card">
            <div class="val">${view.totalMessages} 条</div>
            <div class="lbl">出土总话语标本</div>
          </div>
          <div class="report-stat-card">
            <div class="val">${view.carbon14Text}</div>
            <div class="lbl">碳14现代残余活性</div>
          </div>
        </div>

        <div class="report-section">
          <h4>地层剖面与温差纪年（总发掘深度 ${view.totalDepthText}）：</h4>
          <table class="report-strata-table">
            <thead>
              <tr>
                <th>层位</th>
                <th>地质纪元</th>
                <th>沉积跨度</th>
                <th>埋藏深度</th>
                <th>关系地温</th>
                <th>遗存密度</th>
              </tr>
            </thead>
            <tbody>
              ${view.layers
                .map(
                  layer => `
                <tr class="${layer.isSelected ? 'current-layer' : ''}">
                  <td>${layer.layerTag}${layer.isSelected ? ' <span class="current-mark">★ 当前勘测层位</span>' : ''}</td>
                  <td>${escapeHtml(layer.epochName)}</td>
                  <td>${layer.timeRangeText}</td>
                  <td>${layer.depthText}</td>
                  <td>${layer.temperatureText}</td>
                  <td>${layer.messageCount} 条</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <p>最高温纪元：<strong>${escapeHtml(view.peakEpoch)}</strong>　渐冷纪元：<strong>${escapeHtml(view.coolingEpoch)}</strong></p>
        </div>

        <div class="report-section">
          <h4>当前层位情感沉积化验（Layer 0${view.selectedLayer.depthLevel} · ${escapeHtml(view.selectedLayer.epochName)}）：</h4>
          <p>${view.selectedLayer.sediment.map(item => `${item.label} ${item.valueText}`).join(' · ')}</p>
          <p>核心话题印记：${view.selectedLayer.topics.map(t => escapeHtml(t)).join('、')}</p>
        </div>

        <div class="report-section">
          <h4>出土对话化石名录（共 ${view.notableRelics.length} 件）：</h4>
          ${
            view.notableRelics.length > 0
              ? view.notableRelics
                  .map(
                    f => `
              <div class="report-fossil-item">
                <div class="report-fossil-head">
                  <span class="fossil-badge">${escapeHtml(f.category)}</span>
                  <span>${f.dateText} · 发掘深度 ${f.depthText} · 保存完好度 ${f.preservationText}</span>
                </div>
                <div class="fossil-quote">“${escapeHtml(f.quote)}”</div>
              </div>
            `
                  )
                  .join('')
              : '<p>本次发掘未出土突异晶体化石。</p>'
          }
        </div>

        <div class="report-section">
          <h4>地质剖面综述：</h4>
          <p>${escapeHtml(view.archaeologicalSummary)}</p>
        </div>

        <div class="report-section">
          <h4>馆藏专家终审评定：</h4>
          <p>“${escapeHtml(view.curatorAssessment)}”</p>
        </div>

        ${
          exportIssues && exportIssues.length > 0
            ? `
          <div class="export-issues">
            <h4>⚠️ 导出前校验未通过，已阻止导出：</h4>
            <ul>
              ${exportIssues.map(issue => `<li>${escapeHtml(issue)}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }

        <div class="report-actions">
          <button class="btn-secondary" id="btnCloseReport">关闭报告</button>
          <button class="btn-report" id="btnExportReport">🖨️ 打印 / 保存标本档案</button>
        </div>
      </div>
    </div>
  `;
}
