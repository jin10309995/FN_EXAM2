/**
 * generate_word_manual.js
 * 產生 FN-EXAM 操作手冊 Word 檔（含流程圖與操作畫面）
 * 執行：node generate_word_manual.js
 */

const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

// Register Microsoft JhengHei for Chinese text in flowcharts
const FONT_PATH = 'C:\\Windows\\Fonts\\msjh.ttc';
if (require('fs').existsSync(FONT_PATH)) {
  GlobalFonts.registerFromPath(FONT_PATH, 'MsJhengHei');
}
const FLOW_FONT = GlobalFonts.families.some(f => f.family === 'MsJhengHei') ? 'MsJhengHei' : 'sans-serif';
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  ImageRun, BorderStyle, PageBreak, ShadingType,
  convertInchesToTwip, Header, Footer, PageNumber,
  NumberFormat, UnderlineType, TableAnchorType, HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom, LevelFormat, convertMillimetersToTwip,
  ExternalHyperlink, Bookmark
} = require('docx');

const SS_DIR = path.join(__dirname, 'doc_screenshots');
const OUT_FILE = path.join(__dirname, 'doc', '操作手冊_v4.0.docx');

// ─── Color palette ──────────────────────────────────────────────────
const BLUE    = '2563EB';
const LBLUE   = 'DBEAFE';
const GRAY    = '374151';
const LGRAY   = 'F3F4F6';
const WHITE   = 'FFFFFF';
const GREEN   = '16A34A';
const LGREEN  = 'DCFCE7';
const YELLOW  = 'CA8A04';
const LYELLOW = 'FEF9C3';
const RED     = 'DC2626';
const BORDER  = 'CBD5E1';

// ─── Helper: styled heading ─────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, color: BLUE, bold: true, size: 36 })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, color: GRAY, bold: true, size: 28 })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, bold: true, size: 24 })]
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, ...opts })]
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22 })]
  });
}
function numbered(text, num) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 22 }),
      new TextRun({ text, size: 22 })
    ]
  });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function blank() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun('')] });
}

// ─── Helper: info box ───────────────────────────────────────────────
function infoBox(title, lines, bgHex = LBLUE, borderHex = BLUE) {
  const rows = [
    new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: bgHex },
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 12, color: borderHex },
        left:   { style: BorderStyle.SINGLE, size: 12, color: borderHex },
        right:  { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
      },
      children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 22, color: borderHex })] })]
    })] }),
    ...lines.map(l => new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: bgHex },
      borders: {
        top:    { style: BorderStyle.NONE },
        left:   { style: BorderStyle.SINGLE, size: 12, color: borderHex },
        right:  { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
      },
      children: [new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: `  ${l}`, size: 20 })] })]
    })] })),
    new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: bgHex },
      borders: {
        top:    { style: BorderStyle.NONE },
        left:   { style: BorderStyle.SINGLE, size: 12, color: borderHex },
        right:  { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.SINGLE, size: 12, color: borderHex },
      },
      children: [new Paragraph({ children: [new TextRun('')] })]
    })] }),
  ];
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows, borders: { insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } } });
}

// ─── Helper: simple 2-col table ─────────────────────────────────────
function infoTable(headers, rows2) {
  const hRow = new TableRow({ tableHeader: true, children: headers.map(h => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: BLUE },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, color: WHITE, size: 20 })] })]
  })) });
  const dRows = rows2.map((r, i) => new TableRow({ children: r.map(c => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? WHITE : LGRAY },
    children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: c, size: 20 })] })]
  })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hRow, ...dRows] });
}

// ─── Helper: embed screenshot ───────────────────────────────────────
function screenshot(filename, label, widthPx = 600) {
  const imgPath = path.join(SS_DIR, filename);
  if (!fs.existsSync(imgPath)) return [para(`[截圖：${label}（檔案未找到）]`, { italics: true, color: 'AA0000' })];
  const imgData = fs.readFileSync(imgPath);
  const w = widthPx * 9525; // EMU: 1pt=12700, 1px@96dpi≈9525
  const h = Math.round(w * 800 / 1280);
  return [
    new Paragraph({
      spacing: { before: 80, after: 0 },
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: imgData, transformation: { width: Math.round(w/9525), height: Math.round(h/9525) }, type: 'png' })]
    }),
    new Paragraph({
      spacing: { before: 20, after: 100 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: label, italics: true, size: 18, color: '6B7280' })]
    })
  ];
}

// ─── FLOWCHART GENERATOR ────────────────────────────────────────────
function drawFlowchart(steps, title, filename) {
  const BOX_W = 280, BOX_H = 52, GAP = 40, CANVAS_W = 600;
  const PADDING = 60;
  const totalH = PADDING + steps.length * (BOX_H + GAP) + PADDING;
  const canvas = createCanvas(CANVAS_W, totalH);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, CANVAS_W, totalH);

  // Title
  ctx.fillStyle = '#1E40AF';
  ctx.font = `bold 20px ${FLOW_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS_W / 2, 36);

  steps.forEach((step, i) => {
    const x = (CANVAS_W - BOX_W) / 2;
    const y = PADDING + i * (BOX_H + GAP);
    const cx = x + BOX_W / 2;
    const isStart = i === 0;
    const isEnd = i === steps.length - 1;
    const isDiamond = step.type === 'diamond';

    // Arrow from previous step
    if (i > 0) {
      const prevY = PADDING + (i - 1) * (BOX_H + GAP) + BOX_H;
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, prevY);
      ctx.lineTo(cx, y - 8);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.moveTo(cx, y - 2);
      ctx.lineTo(cx - 7, y - 14);
      ctx.lineTo(cx + 7, y - 14);
      ctx.closePath();
      ctx.fill();
    }

    // Box shape
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    if (isDiamond) {
      // Diamond shape for decision
      const hw = BOX_W / 2, hh = BOX_H / 2;
      ctx.fillStyle = '#FEF3C7';
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + hw, y + hh);
      ctx.lineTo(cx, y + BOX_H);
      ctx.lineTo(cx - hw, y + hh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#92400E';
    } else if (isStart || isEnd) {
      // Rounded pill
      const r = BOX_H / 2;
      ctx.fillStyle = isStart ? '#1D4ED8' : '#15803D';
      ctx.strokeStyle = isStart ? '#1E3A8A' : '#14532D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + BOX_W, y, x + BOX_W, y + BOX_H, r);
      ctx.arcTo(x + BOX_W, y + BOX_H, x, y + BOX_H, r);
      ctx.arcTo(x, y + BOX_H, x, y, r);
      ctx.arcTo(x, y, x + BOX_W, y, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
    } else {
      // Rectangle with rounded corners
      const r = 8;
      ctx.fillStyle = step.color || '#EFF6FF';
      ctx.strokeStyle = step.border || '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, BOX_W, BOX_H, r);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1E3A8A';
    }
    ctx.shadowBlur = 0;

    // Text
    ctx.font = isDiamond ? `bold 14px ${FLOW_FONT}` : `15px ${FLOW_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = step.label.split('\n');
    const lineH = 18;
    lines.forEach((line, li) => {
      const ty = y + BOX_H / 2 + (li - (lines.length - 1) / 2) * lineH;
      ctx.fillText(line, cx, ty);
    });

    // Step number badge
    if (!isStart && !isEnd && !isDiamond) {
      ctx.fillStyle = step.border || '#3B82F6';
      ctx.beginPath();
      ctx.arc(x + 18, y + BOX_H / 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold 12px ${FLOW_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i, x + 18, y + BOX_H / 2);
    }
  });

  const outPath = path.join(SS_DIR, filename);
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  return outPath;
}

// ─── COVER PAGE ─────────────────────────────────────────────────────
function makeCover() {
  return [
    blank(), blank(), blank(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: 'FN-EXAM', size: 72, bold: true, color: BLUE })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: '升國中數理資優班考題系統', size: 48, bold: true, color: GRAY })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: '操作手冊', size: 56, bold: true, color: BLUE })]
    }),
    blank(),
    infoTable(
      ['欄位', '內容'],
      [
        ['文件代碼', 'FN-EXAM-OPS'],
        ['版次', '4.0'],
        ['生效日期', '2026-03-26'],
        ['文件狀態', 'Baseline'],
        ['文件擁有者', 'OPS / QA'],
        ['核准者', 'PM、OPS Lead'],
      ]
    ),
    blank(), blank(), blank(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '© 2026 FN-EXAM Project Team', size: 18, color: '9CA3AF' })]
    }),
    pageBreak()
  ];
}

// ─── MAIN ────────────────────────────────────────────────────────────
async function main() {
  console.log('產生流程圖...');

  // Flowchart 1: 學生作答流程
  drawFlowchart([
    { label: '開始', type: 'start' },
    { label: '開啟 login.html\n點擊「🎒 學生帳號」快速填入', color: '#EFF6FF', border: '#3B82F6' },
    { label: '輸入帳號密碼 → 登入', color: '#EFF6FF', border: '#3B82F6' },
    { label: '考試列表 (exam-list.html)\n選擇進行中考卷', color: '#F0FDF4', border: '#16A34A' },
    { label: '輸入存取碼（如需要）\n系統建立作答 Session', color: '#F0FDF4', border: '#16A34A' },
    { label: '作答介面 (exam.html)\n逐題作答 / 書籤標記', color: '#FEF9C3', border: '#CA8A04' },
    { label: '自動儲存進度（每 30 秒）', color: '#FEF9C3', border: '#CA8A04' },
    { label: '點擊「提交」→ 伺服器評分', color: '#FFF7ED', border: '#EA580C' },
    { label: '查看成績 (result.html)\n下載 PDF 報告', color: '#F5F3FF', border: '#7C3AED' },
    { label: '查看答題分析 (analysis.html)', color: '#F5F3FF', border: '#7C3AED' },
    { label: '結束', type: 'end' },
  ], '學生作答流程', 'flow_student.png');

  // Flowchart 2: 管理員試卷管理流程
  drawFlowchart([
    { label: '開始', type: 'start' },
    { label: '開啟 login.html\n點擊「👨‍🏫 老師帳號」快速填入', color: '#EFF6FF', border: '#3B82F6' },
    { label: '進入管理後台 (admin.html)', color: '#EFF6FF', border: '#3B82F6' },
    { label: '題庫管理\n新增 / 編輯 / 刪除 / AI 出題', color: '#F0FDF4', border: '#16A34A' },
    { label: '建立試卷\n設定時長、存取碼、隨機排序', color: '#FEF9C3', border: '#CA8A04' },
    { label: '加入題目 → 狀態設 active', color: '#FEF9C3', border: '#CA8A04' },
    { label: '學生完成作答後\n查看成績統計', color: '#FFF7ED', border: '#EA580C' },
    { label: '人工批改（寫作/口說）\n或點擊「AI批改」批次處理', color: '#FFF7ED', border: '#EA580C' },
    { label: '試卷複製（草稿副本）\n供下次複用', color: '#F5F3FF', border: '#7C3AED' },
    { label: '結束', type: 'end' },
  ], '管理員試卷管理流程', 'flow_admin.png');

  // Flowchart 3: 資安與系統架構
  drawFlowchart([
    { label: '使用者請求', type: 'start' },
    { label: 'Rate Limiter\n(API 200/min；查詢 20/15min)', color: '#FEF9C3', border: '#CA8A04' },
    { label: 'Cookie Session 驗證\n(admin_session / student_session)', color: '#EFF6FF', border: '#3B82F6' },
    { label: 'Timing-Safe Token 比對\n(lookup_token SHA-256 256-bit)', color: '#EFF6FF', border: '#3B82F6' },
    { label: '權限檢查\n(requireAdmin / requireStudent)', color: '#F0FDF4', border: '#16A34A' },
    { label: 'Prepared Statement\n(SQL Injection 防護)', color: '#F0FDF4', border: '#16A34A' },
    { label: '回應（含 CSP / SameSite=Strict）', color: '#F5F3FF', border: '#7C3AED' },
    { label: '完成', type: 'end' },
  ], '資安請求處理流程', 'flow_security.png');

  console.log('流程圖完成，組合 Word 文件...');

  const sections = [];

  // ── 封面 ──
  sections.push(...makeCover());

  // ── 目錄說明 ──
  sections.push(
    h1('目錄'),
    para('第 1 章　系統概覽與角色說明'),
    para('第 2 章　環境準備與啟動'),
    para('第 3 章　學生端操作 SOP（含流程圖）'),
    para('第 4 章　管理員操作 SOP（含流程圖）'),
    para('第 5 章　v4.0 新功能說明'),
    para('第 6 章　資安防護（含流程圖）'),
    para('第 7 章　維運 SOP'),
    para('第 8 章　常見問題（FAQ）'),
    pageBreak()
  );

  // ── 第 1 章：系統概覽 ──
  sections.push(
    h1('第 1 章　系統概覽與角色說明'),
    h2('1.1 系統功能總覽'),
    infoBox('📚 FN-EXAM 功能一覽', [
      '• 帳號登入與角色授權（快速填入按鈕）',
      '• 題庫管理與審查（CRUD、AI 出題、版本歷程）',
      '• 試卷管理（隨機排序、時間窗、存取碼、複製）',
      '• 學生作答、書籤、自動儲存、交卷、查詢',
      '• 計算題數值容差批改、AI 批改、人工批改',
      '• PDF 成績報告匯出（支援中文 Microsoft JhengHei）',
      '• 伺服器端時間驗證、資安防護',
    ], LBLUE, BLUE),
    blank(),
    h2('1.2 角色與權限'),
    infoTable(
      ['角色', '主要操作'],
      [
        ['🎒 學生', '取卷、作答、交卷、查詢成績、下載 PDF、口說上傳'],
        ['👨‍🏫 教師/管理者', '題庫管理、試卷管理、成績查詢、批改、AI 出題'],
        ['🔧 OPS', '部署、備份/還原、監控、事故處理'],
      ]
    ),
    blank(),
    h2('1.3 學段支援'),
    infoTable(
      ['學段代碼', '說明'],
      [
        ['junior_high', '升國中資優班（預設）'],
        ['elementary_6', '國小六年級'],
        ['grade_7 / 8 / 9', '國一～國三'],
        ['bctest', '國中教育會考'],
        ['gept_elementary', '全民英檢初級（GEPT）'],
      ]
    ),
    pageBreak()
  );

  // ── 第 2 章：環境準備 ──
  sections.push(
    h1('第 2 章　環境準備與啟動'),
    h2('2.1 前置需求'),
    bullet('Node.js（LTS）與 npm 可執行'),
    bullet('Windows 10/11（PDF 中文字型 msjh.ttc 已內建）'),
    bullet('若需 AI 功能，設定 .env 中的 LLM API 金鑰'),
    blank(),
    h2('2.2 首次安裝'),
    infoBox('💻 安裝指令（PowerShell）', [
      'npm install',
      'node generate-public.js',
      'node seed.js',
      '# 或直接執行: setup.bat',
    ], LGREEN, GREEN),
    blank(),
    h2('2.3 日常啟動'),
    infoBox('🚀 啟動指令', [
      'npm start',
      '# 或: node server.js',
      '# 或: start.bat',
      '# 自訂 port: set PORT=8080 && node server.js',
    ], LGREEN, GREEN),
    blank(),
    h2('2.4 健康檢查'),
    numbered('開啟瀏覽器，前往 http://localhost:3000/login.html', 1),
    numbered('確認登入頁正常顯示，可看到「👨‍🏫 老師帳號」與「🎒 學生帳號」快速填入按鈕', 2),
    numbered('呼叫 http://localhost:3000/api/subjects，確認回傳 JSON 陣列', 3),
    pageBreak()
  );

  // ── 第 3 章：學生端 SOP ──
  sections.push(
    h1('第 3 章　學生端操作 SOP'),
    h2('3.1 學生作答流程圖'),
    ...(() => {
      const fp = path.join(SS_DIR, 'flow_student.png');
      if (!fs.existsSync(fp)) return [para('[流程圖：學生作答流程]')];
      const d = fs.readFileSync(fp);
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 20 },
          children: [new ImageRun({ data: d, transformation: { width: 480, height: Math.round(480 * 700 / 600) }, type: 'png' })]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: '圖 3-1 學生作答完整流程', italics: true, size: 18, color: '6B7280' })] })
      ];
    })(),
    h2('3.2 登入操作畫面'),
    para('學生開啟 login.html，可直接點擊「🎒 學生帳號」快速填入預設帳密（示範用途），或手動輸入帳號密碼。'),
    ...screenshot('01_login.png', '圖 3-2 登入頁面（含快速填入按鈕）', 580),
    h2('3.3 考試列表'),
    para('登入後進入考試列表頁，顯示所有進行中考卷（active 狀態），點擊考卷標題開始作答。'),
    ...screenshot('02_exam_list.png', '圖 3-3 考試列表頁', 580),
    h2('3.4 作答介面'),
    para('作答介面左側為題號導覽（已答 / 書籤 / 未答色碼區分），右側為題目與選項。倒數計時顯示於右上角。'),
    ...screenshot('03_exam_taking.png', '圖 3-4 學生作答介面', 580),
    h2('3.5 作答注意事項'),
    infoBox('📝 作答規則', [
      '• 題目/選項順序可能每次不同（試卷啟用隨機排序時）',
      '• 點擊題號旁 🔖 可標記書籤，方便後續複查',
      '• 系統每 30 秒自動儲存進度（含中途離開可續作）',
      '• 倒數計時歸零後系統自動提交，請注意剩餘時間',
      '• 選擇「我不會」不會計分，但不影響其他題目',
    ], LYELLOW, YELLOW),
    pageBreak()
  );

  // ── 第 4 章：管理員 SOP ──
  sections.push(
    h1('第 4 章　管理員操作 SOP'),
    h2('4.1 管理員操作流程圖'),
    ...(() => {
      const fp = path.join(SS_DIR, 'flow_admin.png');
      if (!fs.existsSync(fp)) return [para('[流程圖：管理員流程]')];
      const d = fs.readFileSync(fp);
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 20 },
          children: [new ImageRun({ data: d, transformation: { width: 480, height: Math.round(480 * 640 / 600) }, type: 'png' })]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: '圖 4-1 管理員試卷管理完整流程', italics: true, size: 18, color: '6B7280' })] })
      ];
    })(),
    h2('4.2 管理後台操作畫面'),
    para('管理後台（admin.html）提供題庫管理、試卷管理、成績查看、人工批改、AI 出題等功能。'),
    ...screenshot('04_admin_questions.png', '圖 4-2 管理後台題庫管理（admin.html）', 580),
    h2('4.3 題庫管理 SOP'),
    numbered('點擊「➕ 新增題目」建立題目，填寫題目內容、選項、答案、難度、學段', 1),
    numbered('或點擊「AI 出題」，選擇科目/題型/難度，由 AI 生成後人工審核再入庫', 2),
    numbered('既有題目點擊「✏️ 編輯」可修改，系統自動保存版本歷程', 3),
    numbered('刪除前確認題目未被進行中試卷引用', 4),
    blank(),
    h2('4.4 試卷管理 SOP'),
    numbered('點擊「➕ 新增試卷」，填寫標題、描述、時長（分鐘）、狀態', 1),
    numbered('搜尋並加入題目（可依科目/題型/難度篩選）', 2),
    numbered('選填存取碼（學生需輸入才能參加）、可作答次數', 3),
    numbered('勾選「題目隨機順序」和「選項隨機順序」防止背記規律', 4),
    numbered('儲存後將狀態改為 active 即開放給學生', 5),
    numbered('點擊「複製」可快速複製現有試卷為草稿副本', 6),
    blank(),
    h2('4.5 批改流程'),
    infoTable(
      ['題目類型', '批改方式'],
      [
        ['選擇題（choice）', '系統自動批改（不分大小寫）'],
        ['是非題（true_false）', '系統自動批改（T/F）'],
        ['填空題（fill）', '系統自動批改（不分大小寫）'],
        ['計算題（calculation）', '系統自動批改（數值容差比對）'],
        ['寫作題（writing）', '人工批改 或 點擊「AI批改」'],
        ['口說題（speaking）', '批改介面播放學生錄音後給分'],
      ]
    ),
    blank(),
    h2('4.6 試卷管理操作畫面'),
    para('試卷管理頁顯示所有考卷狀態（草稿/進行中/已結束），並提供「複製考卷」與「AI 批次批改」按鈕。'),
    ...screenshot('05_admin_exam.png', '圖 4-6 試卷管理介面（含複製與 AI 批改按鈕）', 580),
    pageBreak()
  );

  // ── 第 5 章：v4.0 新功能 ──
  sections.push(
    h1('第 5 章　v4.0 新功能說明'),
    infoTable(
      ['功能', '說明', '位置'],
      [
        ['快速填入按鈕', '登入頁「👨‍🏫 老師帳號」「🎒 學生帳號」一鍵帶入示範帳密', 'login.html'],
        ['深色模式', '點擊 🌙 切換深色/淺色模式，設定持久化', 'login / exam.html'],
        ['題目書籤', '作答時標記重點題，可過濾僅顯示書籤題', 'exam.html'],
        ['題目隨機排序', '試卷設定 randomize_questions，每次順序不同', 'admin → 試卷設定'],
        ['選項隨機排序', '試卷設定 randomize_options，選項順序每次不同', 'admin → 試卷設定'],
        ['計算題容差', '設定 tolerance 欄位，允許數值誤差範圍', 'admin → 題目編輯'],
        ['伺服器端時間驗證', '超時試卷提交被拒（+2 分鐘寬限），防止規避計時', 'server.js'],
        ['試卷複製', '試卷列表「複製」按鈕，建立草稿副本', 'admin.html'],
        ['批次 AI 批改', '試卷列表「AI批改」按鈕，一次批改所有寫作/口說', 'admin.html'],
        ['PDF 報告匯出', '成績頁「下載 PDF」，含中文字型，支援所有題型', 'result.html'],
        ['口說批改音訊', '批改介面直接播放學生錄音', 'admin.html'],
        ['X-Lookup-Token', 'token 改從 HTTP header 傳送，不記錄於 URL log', 'server.js'],
      ]
    ),
    blank(),
    h2('5.1 成績頁操作畫面'),
    ...screenshot('06_result.png', '圖 5-1 成績結果頁（result.html）', 580),
    pageBreak()
  );

  // ── 第 6 章：資安 ──
  sections.push(
    h1('第 6 章　資安防護'),
    h2('6.1 資安請求處理流程'),
    ...(() => {
      const fp = path.join(SS_DIR, 'flow_security.png');
      if (!fs.existsSync(fp)) return [para('[流程圖：資安處理流程]')];
      const d = fs.readFileSync(fp);
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 20 },
          children: [new ImageRun({ data: d, transformation: { width: 480, height: Math.round(480 * 540 / 600) }, type: 'png' })]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: '圖 6-1 API 資安請求處理流程', italics: true, size: 18, color: '6B7280' })] })
      ];
    })(),
    h2('6.2 資安強化摘要'),
    infoTable(
      ['機制', '說明'],
      [
        ['Token Entropy', 'lookup_token 使用 32 bytes（256 bits）隨機值，防暴力猜測'],
        ['Token 傳輸', 'X-Lookup-Token HTTP header 傳送，不出現於 URL / server log'],
        ['Timing-Safe 比對', '常數時間比對算法，防 timing side-channel 攻擊'],
        ['速率限制', 'API 200次/分；查詢端點 20次/15分；帳號操作 5次/15分'],
        ['Cookie 安全', 'HttpOnly + SameSite=Strict；生產環境加 Secure flag'],
        ['CSP', 'Content-Security-Policy：script/style/font 白名單限制 CDN'],
        ['SQL 安全', '全部使用 Prepared Statement；動態欄位名稱採白名單 ternary'],
      ]
    ),
    blank(),
    infoBox('⚠️ 安全操作規範', [
      '1. 管理帳密不得共用，需定期更換',
      '2. 不可在未授權裝置保存生產 session token',
      '3. 匯出資料須遵循最小必要原則',
      '4. 發現疑似越權或資料外洩，立即升級為 P1 事件',
    ], '#FEF2F2', RED),
    pageBreak()
  );

  // ── 第 7 章：維運 ──
  sections.push(
    h1('第 7 章　維運 SOP'),
    h2('7.1 日常巡檢'),
    infoTable(
      ['項目', '頻率', '內容'],
      [
        ['服務狀態', '每日', '程序存活、首頁可訪問'],
        ['錯誤日誌', '每日', '500/401/403/429 趨勢'],
        ['資料庫容量', '每週', 'exam.db 成長與磁碟空間'],
        ['備份有效性', '每週', '備份檔可讀取與還原測試'],
      ]
    ),
    blank(),
    h2('7.2 備份流程'),
    numbered('停止服務（建議）', 1),
    numbered('備份 exam.db（必要時含 -wal/-shm）', 2),
    numbered('備份 uploads/ 與 doc/', 3),
    numbered('記錄備份時間、操作者、備份位置', 4),
    blank(),
    h2('7.3 發布流程'),
    infoTable(
      ['步驟', '操作'],
      [
        ['1. 備份', '執行完整資料庫與檔案備份'],
        ['2. 套用更新', 'git pull → npm install → node generate-public.js'],
        ['3. Smoke Test', 'node smoke_test.js → 確認 28/28 通過'],
        ['4. 啟動服務', 'npm start → 健康檢查'],
        ['5. 24h 監控', '觀察錯誤率與回應時間'],
      ]
    ),
    pageBreak()
  );

  // ── 第 8 章：FAQ ──
  sections.push(
    h1('第 8 章　常見問題（FAQ）'),
    h3('Q1：登入被限制（429 Too Many Requests）怎麼辦？'),
    para('等待 15 分鐘後重試。確認是否有異常程式重複送出登入請求。'),
    blank(),
    h3('Q2：學生看不到考卷？'),
    para('檢查試卷狀態是否為 active；確認時間窗、存取碼、可作答次數設定正確。'),
    blank(),
    h3('Q3：PDF 下載後中文顯示為方塊？'),
    para('確認伺服器為 Windows 且已安裝 C:\\Windows\\Fonts\\msjh.ttc（Windows 10/11 已內建）。Linux 需執行：apt install fonts-noto-cjk。安裝後重啟伺服器。'),
    blank(),
    h3('Q4：計算題數值很接近但被判錯？'),
    para('至題目編輯介面設定 tolerance 欄位（例如 0.01）。系統判斷條件：|學生答案 - 正確答案| ≤ tolerance。'),
    blank(),
    h3('Q5：批次 AI 批改沒有反應或失敗？'),
    para('確認 .env 中 LLM_PROVIDER（openai/gemini/claude）與對應 API 金鑰已設定且有效額度。若試卷無寫作/口說題，系統回傳「批改 0 筆」屬正常。'),
    blank(),
    h3('Q6：試卷「複製」後如何修改再開放？'),
    para('複製後新試卷狀態為 draft（草稿）。至「編輯試卷」調整後，將狀態改為 active 儲存即可開放。'),
    blank(),
    h3('Q7：還原後分數不一致？'),
    para('確認 DB 與 uploads/ 使用同一時間點備份。檢查是否有 migration 未完整執行（重啟伺服器會自動執行 migration）。'),
  );

  // ─── Build Document ───────────────────────────────────────────────
  const doc = new Document({
    creator: 'FN-EXAM System',
    title: 'FN-EXAM 操作手冊 v4.0',
    description: '升國中數理資優班考題系統操作手冊',
    styles: {
      default: {
        document: {
          run: { font: 'Microsoft JhengHei UI', size: 22, color: GRAY },
          paragraph: { spacing: { line: 360 } }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER } },
            children: [new TextRun({ text: 'FN-EXAM 操作手冊 v4.0', size: 18, color: '9CA3AF' })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: BORDER } },
            children: [
              new TextRun({ text: '© 2026 FN-EXAM Project  |  頁碼 ', size: 18, color: '9CA3AF' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '9CA3AF' }),
              new TextRun({ text: ' / ', size: 18, color: '9CA3AF' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '9CA3AF' }),
            ]
          })]
        })
      },
      children: sections
    }]
  });

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT_FILE, buffer);
  const size = (buffer.length / 1024).toFixed(1);
  console.log(`\n✅ Word 文件產生完成！`);
  console.log(`   路徑：${OUT_FILE}`);
  console.log(`   大小：${size} KB`);
}

main().catch(e => { console.error('錯誤：', e.message); process.exit(1); });
