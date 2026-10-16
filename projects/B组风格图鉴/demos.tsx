// B 组 15 套风格的画面演示。每段一个 draw(g, t)，在 (0,0)–(1920,692) 的演示区里作画，
// 由 Main.tsx 统一 translate(0, DEMO_TOP)。信息条（风格名/编号/字体/提示词）由 Main.tsx 用 DOM 渲染。
// 对应文档：references/风格_20..34_*.md；提示词：references/Opus55提示词库.md
import { F, lerp, clamp, rnd, rr, typed, spring, E, k, seg } from '@kit';

export const DEMO_TOP = 148, DEMO_H = 692;
export const DW = 1920, DH = DEMO_H;

// ---------- 通用小工具 ----------
const rrect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
};
const txt = (g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, fam: string, col: string, w = 400, align: CanvasTextAlign = 'left') => {
  g.font = `${w} ${size}px ${fam}`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y);
};
/** 抖动墨线（手绘感）：主线 + 偏移副线 */
const jline = (g: CanvasRenderingContext2D, pts: number[], col: string, w = 5, seed = 1, jit = 1.6) => {
  if (pts.length < 4) return;
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    g.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      const j = pass === 0 ? 0 : rr(i, seed + pass, -jit, jit);
      const x = pts[i] + j, y = pts[i + 1] + rr(i + 99, seed + pass + 3, -jit, jit);
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.strokeStyle = col; g.globalAlpha = pass === 0 ? 1 : .3; g.lineWidth = pass === 0 ? w : w * .55; g.stroke(); g.globalAlpha = 1;
  }
};
/** 按进度揭示一条折线（0..1），用于"一笔写成" */
const reveal = (pts: number[], p: number) => {
  const n = Math.max(2, Math.floor(pts.length / 2 * clamp(p)));
  return pts.slice(0, n * 2);
};
/** 排线填充：在矩形区域内按角度画等距平行线 */
const hatch = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, angle: number, gap: number, col = '#141210', lw = 1.3) => {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.strokeStyle = col; g.lineWidth = lw;
  const dx = Math.cos(angle), dy = Math.sin(angle), len = Math.hypot(w, h) * 1.5;
  for (let d = -len; d < len; d += gap) {
    g.beginPath(); g.moveTo(x + w / 2 + dx * d - dy * len, y + h / 2 + dy * d + dx * len);
    g.lineTo(x + w / 2 + dx * d + dy * len, y + h / 2 + dy * d - dx * len); g.stroke();
  }
  g.restore();
};
/** 手绘小人（简版）：头 + 身 + 四肢，跑动帧由 t 驱动 */
const person = (g: CanvasRenderingContext2D, x: number, y: number, s: number, run: number, col = '#141414', seed = 7) => {
  const sw = Math.sin(run * Math.PI * 2 * 3) * s * 26;
  jline(g, [x, y - 92 * s, x + sw * .5, y - 52 * s, x + sw * .3, y], col, 6 * s, seed);          // 躯干
  jline(g, [x - 13 * s, y - 74 * s, x - sw * .6, y - 40 * s, x - sw * .9, y - 2], col, 5 * s, seed + 1); // 后腿
  jline(g, [x + 13 * s, y - 74 * s, x + sw * .7, y - 40 * s, x + sw * 1.0, y - 2], col, 5 * s, seed + 2); // 前腿
  jline(g, [x, y - 84 * s, x - sw * .8, y - 62 * s], col, 4 * s, seed + 3);                      // 后臂
  jline(g, [x, y - 84 * s, x + sw * .9, y - 60 * s], col, 4 * s, seed + 4);                      // 前臂
  g.beginPath(); g.arc(x + sw * .1, y - 106 * s, 15 * s, 0, Math.PI * 2);
  g.fillStyle = '#fffdf6'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = col; g.stroke();
};
/** 蜡笔填充：多层半透明 + 边缘不规则 */
const crayon = (g: CanvasRenderingContext2D, path: () => void, col: string, layers = 4, seed = 3) => {
  for (let i = 0; i < layers; i++) {
    g.save(); g.globalAlpha = .26; g.translate(rr(i, seed, -2.5, 2.5), rr(i + 40, seed, -2.5, 2.5)); path(); g.fillStyle = col; g.fill(); g.restore();
  }
};

// ============================================================
// 20 剪辑动画 editor —— 手绘小人住在剪辑软件里
// ============================================================
export const drawEditor: Draw = (g, t) => {
  g.fillStyle = '#1b1b1f'; g.fillRect(0, 0, DW, DH);
  g.fillStyle = '#232327'; g.fillRect(0, 0, DW, 46);                      // 工具栏
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.beginPath(); g.arc(26 + i * 26, 23, 7, 0, 7); g.fillStyle = c; g.fill(); });
  txt(g, '剪映项目 · 改稿_v8.draft', 108, 23, 17, F.mono, '#8a8a92');
  g.fillStyle = '#26262b'; g.fillRect(0, 46, 268, 404);                   // 素材面板
  txt(g, '素材箱', 22, 70, 19, F.mono, '#7a7a82');
  for (let i = 0; i < 6; i++) {                                            // 素材缩略图 = 可搬运的货箱
    const x = 22 + (i % 2) * 124, y = 96 + Math.floor(i / 2) * 118;
    g.fillStyle = ['#3a4a6b', '#6b3a4a', '#4a6b3a', '#6b5a3a', '#3a5a6b', '#5a3a6b'][i];
    rrect(g, x, y, 108, 88, 5); g.fill();
    txt(g, `clip_0${i + 1}`, x + 8, y + 76, 13, F.mono, '#c9c9d2');
  }
  g.fillStyle = '#141417'; g.fillRect(288, 46, 1000, 404);                // 预览监视器
  const glow = .5 + .5 * Math.sin(t * 3);
  g.fillStyle = `rgba(60,110,220,${.1 + glow * .06})`; g.fillRect(288, 46, 1000, 404);
  txt(g, '预览监视器', 304, 70, 17, F.mono, '#6a6a72');
  // 监视器里：蓝色玻璃幕墙（角色要撞碎的那扇"窗"）
  g.save(); g.translate(788, 248);
  for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) {
    g.fillStyle = `rgba(${90 + i * 8},${150 + j * 6},${230},${.16 + (i + j) * .02})`;
    g.fillRect(-340 + i * 98, -160 + j * 66, 92, 60);
  }
  g.restore();
  g.fillStyle = '#26262b'; g.fillRect(1308, 46, 612, 404);                // 检查器
  txt(g, '检查器', 1330, 70, 19, F.mono, '#7a7a82');
  [['不透明度', '100%'], ['混合', '正常'], ['变速', '1.0x'], ['音量', '-6 dB']].forEach(([kk, v], i) => {
    txt(g, kk, 1330, 116 + i * 56, 17, F.mono, '#6a6a72');
    g.fillStyle = '#1b1b1f'; rrect(g, 1460, 100 + i * 56, 240, 32, 4); g.fill();
    txt(g, v, 1476, 116 + i * 56, 16, F.mono, '#c9c9d2');
  });
  // ---------- 时间轴：角色的地面 ----------
  g.fillStyle = '#1e1e22'; g.fillRect(0, 470, DW, 222);
  for (let tr = 0; tr < 4; tr++) {
    g.fillStyle = tr === 1 ? '#242429' : '#202024'; g.fillRect(0, 486 + tr * 50, DW, 44);
    txt(g, ['V2 角色', 'V1 画面', 'A1 对白', 'A2 音乐'][tr], 18, 508 + tr * 50, 15, F.mono, '#5a5a62');
  }
  const clips: [number, number, string][] = [[70, 300, '#3f6fd0'], [390, 240, '#d05f6f'], [650, 330, '#5f9fd0'], [1000, 260, '#d0a05f'], [1290, 300, '#7f5fd0'], [1610, 260, '#5fd0a0']];
  clips.forEach(([x, w, c], i) => {
    g.fillStyle = c; g.globalAlpha = .82; rrect(g, x, 494 + (i % 3) * 8, w, 36, 4); g.fill(); g.globalAlpha = 1;
    for (let s = 0; s < w; s += 22) { g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x + s, 494 + (i % 3) * 8, 11, 36); }
  });
  const ph = (t * .34 % 1) * DW;                                             // 播放头
  g.fillStyle = '#ffc93c'; g.fillRect(ph, 478, 3, 208);
  g.beginPath(); g.moveTo(ph - 7, 478); g.lineTo(ph + 10, 478); g.lineTo(ph + 1.5, 468); g.closePath(); g.fill();
  // ---------- 手绘角色：扛着素材在轨道上跑 ----------
  const px = 120 + ((t * 210) % (DW - 240)), bob = Math.abs(Math.sin(t * 9)) * 5;
  person(g, px, 560 - bob, 1.15, t * 1.4, '#f2ead7', 11);
  g.save(); g.translate(px + 46, 500); g.rotate(-.12);                       // 肩上的素材箱
  g.fillStyle = '#3f6fd0'; rrect(g, 0, 0, 54, 40, 4); g.fill(); g.restore();
  if (t > 2.2) {                                                              // 撞碎屏幕玻璃：碎片飞溅
    const bt = t - 2.2;
    for (let i = 0; i < 11; i++) {
      const a = rr(i, 5, 0, Math.PI * 2), sp = rr(i, 6, 120, 420);
      g.save(); g.translate(788 + Math.cos(a) * sp * bt, 248 + Math.sin(a) * sp * bt + 380 * bt * bt); g.rotate(rr(i, 7, 0, 6));
      g.beginPath(); g.moveTo(0, -7); g.lineTo(9, 5); g.lineTo(-8, 4); g.closePath();
      g.fillStyle = 'rgba(190,225,255,' + clamp(1 - bt * 1.6) + ')'; g.fill(); g.restore();
    }
    txt(g, '第八版了！！', 788, 210, 40, F.fun, '#ffd93c', 700, 'center');
  }
  g.strokeStyle = '#2e2e34'; g.lineWidth = 1; for (let x = 0; x < DW; x += 40) { g.beginPath(); g.moveTo(x, 470); g.lineTo(x, 692); g.stroke(); }
};

// ============================================================
// 21 音乐MV mv —— 歌词即剧本
// ============================================================
export const drawMV: Draw = (g, t) => {
  const sky = g.createLinearGradient(0, 0, 0, DH);
  sky.addColorStop(0, '#101828'); sky.addColorStop(.55, '#23344f'); sky.addColorStop(1, '#4a3a44');
  g.fillStyle = sky; g.fillRect(0, 0, DW, DH);
  for (let i = 0; i < 60; i++) {                                              // 雨丝
    const x = rr(i, 1, 0, DW), y = (rr(i, 2, 0, DH) + t * 900) % DH;
    g.strokeStyle = 'rgba(200,220,255,.22)'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 26); g.stroke();
  }
  // 火车站的窗：窗外是夜色，窗内是暖光
  g.fillStyle = 'rgba(255,214,150,.14)'; g.fillRect(0, 0, DW, DH);
  g.save(); g.translate(1180, 300);
  g.fillStyle = '#f3d9a8'; g.globalAlpha = .5 + .12 * Math.sin(t * 2);       // 窗里的灯
  rrect(g, -330, -210, 660, 430, 10); g.fill(); g.globalAlpha = 1;
  g.strokeStyle = '#1a1420'; g.lineWidth = 16; rrect(g, -330, -210, 660, 430, 10); g.stroke();
  g.lineWidth = 10; g.beginPath(); g.moveTo(0, -210); g.lineTo(0, 220); g.stroke();
  g.beginPath(); g.moveTo(-330, 5); g.lineTo(330, 5); g.stroke();
  // 剪影：一个人贴在玻璃上
  g.save(); g.translate(-150, 120); g.scale(1.5, 1.5);
  g.fillStyle = '#0d0a12';
  g.beginPath(); g.arc(0, -104, 34, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-46, 100); g.quadraticCurveTo(-40, -70, 0, -72);
  g.quadraticCurveTo(40, -70, 46, 100); g.closePath(); g.fill();
  g.restore(); g.restore();
  // 远处的站台灯
  for (let i = 0; i < 5; i++) {
    const x = 120 + i * 150, a = .18 + .1 * Math.sin(t * 1.6 + i);
    g.fillStyle = `rgba(255,200,130,${a})`; g.beginPath(); g.arc(x, 250, 8, 0, 7); g.fill();
    g.fillStyle = `rgba(255,200,130,${a * .3})`; g.beginPath(); g.arc(x, 250, 34, 0, 7); g.fill();
  }
  // 歌词：逐行浮现（宋体，电影字幕位）
  const lines = ['还记得一年前', '站在火车站', '透过玻璃窗', '看见你的泪满面'];
  lines.forEach((l, i) => {
    const st = (t - .3 - i * .75) * 1.6, p = clamp(st);
    if (p <= 0) return;
    g.globalAlpha = Math.min(1, p * 2.2);
    txt(g, l, DW / 2, 520 + i * 46, 34, F.serif, '#f2ead7', 500, 'center');
    g.globalAlpha = 1;
  });
  // 宽银幕黑边
  g.fillStyle = '#000'; g.fillRect(0, 0, DW, 40); g.fillRect(0, DH - 40, DW, 40);
};

// ============================================================
// 22 蜡笔绘本 crayon —— 蜡笔颗粒 + 水彩天空 + 手写片名
// ============================================================
export const drawCrayon: Draw = (g, t) => {
  g.fillStyle = '#f7ead7'; g.fillRect(0, 0, DW, DH);
  // 水彩天空：大半径低透明色团
  const blobs: [number, number, number, string][] = [[300, 150, 200, '#8db4d8'], [900, 110, 240, '#9b8fd4'], [1500, 170, 210, '#f4a58c'], [620, 240, 180, '#8fb996'], [1300, 250, 200, '#8db4d8']];
  blobs.forEach(([x, y, r, c], i) => {
    for (let j = 0; j < 3; j++) {
      g.beginPath(); g.arc(x + rr(j, i, -18, 18), y + rr(j + 9, i, -14, 14), r * (1 - j * .12), 0, 7);
      g.fillStyle = c; g.globalAlpha = .1; g.fill(); g.globalAlpha = 1;
    }
  });
  // 蜡笔房子：多层半透明偏移填充
  const house = () => { rrect(g, 240, 330, 420, 300, 8); };
  crayon(g, house, '#e8734a', 5, 2);
  g.strokeStyle = '#c4532f'; g.lineWidth = 7; g.globalAlpha = .8; house(); g.stroke(); g.globalAlpha = 1;
  const roof = () => { g.beginPath(); g.moveTo(200, 340); g.lineTo(450, 180); g.lineTo(700, 340); g.closePath(); };
  crayon(g, roof, '#8fb996', 5, 8);
  g.strokeStyle = '#5f8a6a'; g.lineWidth = 7; g.globalAlpha = .8; roof(); g.stroke(); g.globalAlpha = 1;
  g.fillStyle = '#8b5a2b'; rrect(g, 420, 500, 70, 130, 6); g.fill();      // 门
  g.beginPath(); g.arc(478, 566, 6, 0, 7); g.fillStyle = '#f7ead7'; g.fill();
  g.fillStyle = '#ffd93c'; rrect(g, 280, 380, 84, 84, 6); g.fill();        // 窗
  g.strokeStyle = '#c4532f'; g.lineWidth = 6; rrect(g, 280, 380, 84, 84, 6); g.stroke();
  g.beginPath(); g.moveTo(322, 380); g.lineTo(322, 464); g.moveTo(280, 422); g.lineTo(364, 422); g.stroke();
  // 梯子：小女孩要爬的那架
  for (let i = 0; i < 7; i++) { const y = 400 + i * 34; jline(g, [700, y, 770, y], '#8b5a2b', 6, 20 + i); }
  jline(g, [706, 400, 706, 604], '#8b5a2b', 6, 40); jline(g, [764, 400, 764, 604], '#8b5a2b', 6, 41);
  // 月亮：睁着的眼，数绵羊
  const mg = 1 + .04 * Math.sin(t * 4);
  g.save(); g.translate(1520, 220); g.scale(mg, mg);
  g.beginPath(); g.arc(0, 0, 108, 0, 7); g.fillStyle = '#ffe9a8'; g.fill();
  g.strokeStyle = '#d9a94e'; g.lineWidth = 7; g.stroke();
  g.fillStyle = '#5c4a2a';
  const eye = Math.sin(t * 3) > -.85 ? 1 : .12;
  g.beginPath(); g.ellipse(-34, -16, 11, 13 * eye, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(34, -16, 11, 13 * eye, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(0, 22, 26, .15, Math.PI - .15); g.lineWidth = 6; g.strokeStyle = '#5c4a2a'; g.stroke();
  g.restore();
  // 白蜡笔星星：纸色小点 + 十字
  for (let i = 0; i < 22; i++) {
    const x = rr(i, 3, 60, DW - 60), y = rr(i, 4, 50, 330), s = rr(i, 5, 3, 6);
    const a = clamp((t - 1.2 - i * .05) * 2);
    if (a <= 0) continue;
    g.globalAlpha = a * .9; g.fillStyle = '#fffdf6';
    g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
    g.fillRect(x - s * 2.4, y - .8, s * 4.8, 1.6); g.fillRect(x - .8, y - s * 2.4, 1.6, s * 4.8);
    g.globalAlpha = 1;
  }
  // 天上的"一二三"
  const nums = ['一', '二', '三'];
  nums.forEach((n, i) => {
    const p = clamp((t - .8 - i * .3) * 3); if (p <= 0) return;
    g.globalAlpha = p; txt(g, n, 980 + i * 96, 180 - i * 26, 44, F.fun, '#7a6a9a', 500, 'center'); g.globalAlpha = 1;
  });
  // 手写片名
  const tp = clamp((t - 1.6) * 1.8);
  if (tp > 0) { g.globalAlpha = tp; txt(g, '月亮睡不着', 240, 660, 62, F.fun, '#5c4a6a', 600); g.globalAlpha = 1; }
};

// ============================================================
// 23 纸灯影 lantern —— 灯箱背光层叠亮起
// ============================================================
export const drawLantern: Draw = (g, t) => {
  g.fillStyle = '#141018'; g.fillRect(0, 0, DW, DH);
  // 木桌
  g.fillStyle = '#3a2a20'; g.fillRect(0, 590, DW, 102);
  for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(0,0,0,${.1 + rnd(i, 2) * .16})`; g.lineWidth = rr(i, 3, 1, 3); g.beginPath(); g.moveTo(0, 596 + i * 4); g.lineTo(DW, 594 + i * 4); g.stroke(); }
  // 灯箱本体
  const bx = 380, by = 120, bw = 760, bh = 470;
  const c = g.createRadialGradient(bx + bw / 2, by + bh / 2, 40, bx + bw / 2, by + bh / 2, bw * .7);
  c.addColorStop(0, '#fff8e7'); c.addColorStop(1, '#e8c98f');
  g.fillStyle = c; rrect(g, bx, by, bw, bh, 14); g.fill();
  g.strokeStyle = '#4a3728'; g.lineWidth = 22; rrect(g, bx, by, bw, bh, 14); g.stroke();
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(bx - 16, by + bh + 6, bw + 32, 18);   // 桌面接触阴影
  // 背光四层，按叙事顺序点亮：月亮 → 祥云 → 山 → 村落窗灯 → 桂花 → 红灯笼
  const L = (i: number, d: number, dur = 1.1) => clamp((t - d) / dur);
  g.save(); rrect(g, bx + 14, by + 14, bw - 28, bh - 28, 10); g.clip();
  const layer = (idx: number, d: number, col: string, a: number, paint: () => void) => {
    const p = L(idx, d); if (p <= 0) return;
    g.globalAlpha = a * p; paint(); g.globalAlpha = 1;
  };
  layer(0, .15, '#ffe9a8', .95, () => { g.beginPath(); g.arc(bx + 210, by + 130, 58, 0, 7); g.fillStyle = '#ffe9a8'; g.fill(); });                       // 月亮
  layer(1, .7, '#d8c9a8', .55, () => { for (let i = 0; i < 4; i++) { const x = bx + 120 + i * 180, y = by + 90 + i * 26; g.beginPath(); g.arc(x, y, 46, Math.PI, 0); g.arc(x + 46, y, 46, 0, Math.PI); g.fillStyle = '#d8c9a8'; g.fill(); } }); // 祥云
  layer(2, 1.2, '#8aa8c8', .5, () => { g.beginPath(); g.moveTo(bx + 20, by + 300); g.lineTo(bx + 200, by + 170); g.lineTo(bx + 360, by + 300); g.lineTo(bx + 520, by + 150); g.lineTo(bx + 720, by + 300); g.closePath(); g.fillStyle = '#8aa8c8'; g.fill(); }); // 山
  layer(3, 1.7, '#ffc93c', .85, () => { for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) { const x = bx + 240 + r * 240 + i * 32, y = by + 300 + r * 40; g.fillStyle = '#ffc93c'; g.fillRect(x, y, 15, 15); } });            // 村落窗灯
  layer(4, 2.2, '#e8a83c', .8, () => { for (let i = 0; i < 16; i++) { const x = bx + 90 + (i % 8) * 82, y = by + 200 + Math.floor(i / 8) * 60; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fillStyle = '#e8a83c'; g.fill(); } });                        // 金色桂花
  layer(5, 2.7, '#ff7a4e', .9, () => { [bx + 120, bx + 620].forEach(x => { g.beginPath(); g.ellipse(x, by + 250, 34, 44, 0, 0, 7); g.fillStyle = '#ff7a4e'; g.fill(); g.fillRect(x - 3, by + 294, 6, 40); }); });                                          // 红灯笼
  g.restore();
  // 前景静物：月饼 + 青花茶具（暗部，只被灯箱照亮边缘）
  g.fillStyle = '#c9a86a'; g.beginPath(); g.arc(250, 620, 46, 0, 7); g.fill();
  g.strokeStyle = '#8a6a3a'; g.lineWidth = 5; g.beginPath(); g.arc(250, 620, 30, 0, 7); g.stroke();
  g.fillStyle = '#eef2f6'; rrect(g, 1560, 596, 96, 66, 8); g.fill();
  g.strokeStyle = '#3f6fa8'; g.lineWidth = 4; rrect(g, 1560, 596, 96, 66, 8); g.stroke();
  g.beginPath(); g.arc(1608, 596, 22, Math.PI, 0); g.stroke();
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(1576 + i * 26, 620, 7, 0, 7); g.strokeStyle = '#3f6fa8'; g.lineWidth = 3; g.stroke(); }
  // 竖排题字（宋体）
  const title = '月有圆缺';
  title.split('').forEach((ch, i) => {
    const p = clamp((t - 3.2 - i * .12) * 2.5); if (p <= 0) return;
    g.globalAlpha = p; txt(g, ch, 1210, 250 + i * 62, 46, F.serif, '#e8dcc0', 500); g.globalAlpha = 1;
  });
  // 月相条：满月亏成残月
  const mp = clamp((t - 3.4) / .8);
  if (mp > 0) {
    const cx0 = 820;
    for (let i = 0; i <= 7; i++) {
      const x = cx0 - 130 + i * 37, r = 15, ph = i / 7;
      g.strokeStyle = 'rgba(232,220,192,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(x, 662, r, 0, 7); g.stroke();
      g.fillStyle = 'rgba(255,233,168,.85)';
      g.beginPath(); g.arc(x, 662, r, -Math.PI / 2, Math.PI / 2, ph > .5); g.arc(x, 662, r * Math.abs(1 - ph * 2), Math.PI / 2, -Math.PI / 2, ph > .5); g.fill();
    }
    txt(g, '月相', 660, 662, 17, F.serif, 'rgba(232,220,192,.6)', 400);
  }
};

// ============================================================
// 24 产品发布 launch —— 微距扫光 + 配色切换 + 字砸屏
// ============================================================
export const drawLaunch: Draw = (g, t) => {
  g.fillStyle = '#08080b'; g.fillRect(0, 0, DW, DH);
  const bg = g.createRadialGradient(960, 300, 60, 960, 300, 900);
  bg.addColorStop(0, '#16161c'); bg.addColorStop(1, '#08080b');
  g.fillStyle = bg; g.fillRect(0, 0, DW, DH);
  // 产品：原创造型"灵犀"手柄
  const COLORS = ['#2b3bdb', '#ff5a4e', '#ffc93c', '#8fb996'];
  const sweepX = lerp(-320, DW + 320, E.inOut(clamp(t / 3.2)));
  const ci = Math.min(3, Math.max(0, Math.floor(lerp(-.05, 1.05, clamp((sweepX + 160) / DW)) * 4)));
  const col = COLORS[ci];
  g.save(); g.translate(960, 330);
  g.rotate(-.06 + .02 * Math.sin(t * 1.2));
  g.fillStyle = '#1c1c22'; g.shadowColor = col; g.shadowBlur = 60;
  rrect(g, -240, -150, 480, 300, 96); g.fill(); g.shadowBlur = 0;
  g.fillStyle = col; rrect(g, -240, -150, 480, 300, 96); g.globalAlpha = .22; g.fill(); g.globalAlpha = 1;
  g.fillStyle = '#26262e'; rrect(g, -150, -96, 300, 150, 20); g.fill();     // 面板
  g.fillStyle = col; g.beginPath(); g.arc(60, -20, 26, 0, 7); g.fill();     // 摇杆
  g.fillStyle = '#3a3a44'; g.beginPath(); g.arc(-80, -30, 22, 0, 7); g.fill();
  [-1, 1].forEach(s => { g.fillStyle = '#2e2e38'; rrect(g, s * 210 - 34, -108, 68, 216, 30); g.fill(); });  // 握把
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 3; rrect(g, -240, -150, 480, 300, 96); g.stroke();
  // 扫光：斜向窄高光带
  g.save(); g.rotate(-.5); g.translate(sweepX, 0);
  const lg = g.createLinearGradient(-70, 0, 70, 0);
  lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,.55)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = lg; g.fillRect(-70, -320, 140, 640); g.restore();
  g.restore();
  // 接触阴影
  g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(960, 500, 300, 34, 0, 0, 7); g.fill();
  // 配色 chips
  COLORS.forEach((c, i) => {
    const on = i <= ci, x = 700 + i * 120;
    g.globalAlpha = on ? 1 : .3;
    g.fillStyle = c; g.beginPath(); g.arc(x, 570, on ? 30 : 22, 0, 7); g.fill();
    g.globalAlpha = 1;
  });
  // 副标题 → 大字砸屏
  const s1 = clamp((t - .2) * 2.2);
  if (s1 > 0) { g.globalAlpha = s1; txt(g, '你的手柄，还能更好玩。', 960, 160, 34, F.en, '#c9c9d2', 400, 'center'); g.globalAlpha = 1; }
  const s2 = clamp((t - 2.6) * 2.6);
  if (s2 > 0) {
    const sc = 1.5 - .5 * E.snap(s2);
    g.save(); g.translate(960, 250); g.scale(sc, sc);
    txt(g, '玩。', 0, 0, 132, F.en, '#ffffff', 800, 'center'); g.restore();
  }
  txt(g, '灵犀 LINGXI · 概念手柄', 960, 636, 22, F.en, '#6a6a72', 400, 'center');
};

// ============================================================
// 25 手绘白板 whiteboard —— 逐笔书写 + 荧光笔划重点
// ============================================================
export const drawWhiteboard: Draw = (g, t) => {
  g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, DW, DH);
  g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 1;                          // 板材纹理
  for (let i = 0; i < 40; i++) { const y = i * 18; g.beginPath(); g.moveTo(0, y); g.lineTo(DW, y); g.stroke(); }
  g.fillStyle = 'rgba(180,190,200,.35)';                                       // 擦不净的旧痕
  g.beginPath(); g.moveTo(1600, 420); g.quadraticCurveTo(1660, 380, 1720, 430); g.lineWidth = 26; g.stroke();
  // 三行手写，逐字"长"出来
  const rows: [string, string, number][] = [
    ['先做哪个？', '#2b4a8f', .3],
    ['全都要做？', '#2b4a8f', 1.15],
    ['先做最重要的那件', '#1a1a1a', 2.35],
  ];
  rows.forEach(([s, col, d], i) => {
    const p = clamp((t - d) * 1.9); if (p <= 0) return;
    const y = 190 + i * 108;
    txt(g, typed(s, p), 150, y, 58, F.fun, col, 500);
    if (p >= 1 && i === 0) {                                                     // 荧光笔：画在字下面
      const hp = clamp((t - 1.9) * 1.6);
      if (hp > 0) {
        g.save(); g.globalAlpha = .55; g.fillStyle = '#ffd93c';
        rrect(g, 140, y + 22, 250 * hp, 44, 4); g.fill(); g.restore();
      }
    }
  });
  // 结论落定的一次快推
  if (t > 3.1) { const z = 1 + .05 * Math.max(0, 1 - (t - 3.1) * 3); g.save(); g.translate(960, 346); g.scale(z, z); g.translate(-960, -346); g.restore(); }
  // 一支笔（前景）
  g.save(); g.translate(1560, 520); g.rotate(-.5 + .06 * Math.sin(t * 2));
  g.fillStyle = '#2b4a8f'; rrect(g, -14, -90, 28, 150, 8); g.fill();
  g.fillStyle = '#c9a86a'; g.beginPath(); g.moveTo(-14, 60); g.lineTo(14, 60); g.lineTo(0, 108); g.closePath(); g.fill();
  g.restore();
  txt(g, '「先做最重要的那件」', 150, 560, 26, F.fun, '#8a8a82', 400);
};

// ============================================================
// 26 黑白版画线刻贴纸 engraving —— 排线即明暗 + 模切描边
// ============================================================
export const drawEngraving: Draw = (g, t) => {
  g.fillStyle = '#efe9dc'; g.fillRect(0, 0, DW, DH);
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(20,18,16,${rnd(i, 1) * .05})`; g.fillRect(rnd(i, 2) * DW, rnd(i, 3) * DH, 2, 2); }
  // 贴纸：威尼斯帆船（12 帧定格弹入）
  const pop = clamp((t - .2) * 3.4), sc = pop < 1 ? 1.08 - .08 * pop : 1;
  g.save(); g.translate(700, 380); g.scale(sc, sc); g.rotate(-.02);
  // 船体剪影 + 排线明暗
  const hull = () => { g.beginPath(); g.moveTo(-230, 60); g.quadraticCurveTo(0, 118, 230, 60); g.lineTo(190, 100); g.quadraticCurveTo(0, 150, -190, 100); g.closePath(); };
  g.save(); hull(); g.clip(); hatch(g, -240, 50, 480, 110, Math.PI / 4, 6); g.restore();
  g.strokeStyle = '#141210'; g.lineWidth = 4; hull(); g.stroke();
  // 桅杆与帆
  g.strokeStyle = '#141210'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-30, 55); g.lineTo(-30, -250); g.stroke();
  const sail = () => { g.beginPath(); g.moveTo(-24, -240); g.quadraticCurveTo(150, -110, -24, -20); g.closePath(); };
  g.save(); sail(); g.clip(); hatch(g, -30, -250, 200, 240, -Math.PI / 6, 7); g.restore();
  g.lineWidth = 4; sail(); g.stroke();
  const sail2 = () => { g.beginPath(); g.moveTo(-36, -230); g.quadraticCurveTo(-190, -110, -36, -20); g.closePath(); };
  g.save(); sail2(); g.clip(); hatch(g, -200, -250, 180, 240, Math.PI / 5, 9); g.restore();
  g.lineWidth = 4; sail2(); g.stroke();
  // 水面：长横线
  for (let i = 0; i < 9; i++) { const y = 120 + i * 15, w = 300 - i * 14; g.beginPath(); g.moveTo(-w / 2, y); g.lineTo(w / 2, y); g.lineWidth = 2; g.stroke(); }
  // 白色模切描边：先画一圈纸白，再画内容（这里反序补一层外扩描边）
  g.save(); g.globalCompositeOperation = 'destination-over';
  g.lineWidth = 14; g.strokeStyle = '#efe9dc'; g.lineJoin = 'round';
  [hull, sail, sail2].forEach(p => { p(); g.stroke(); });
  g.restore(); g.restore();
  // 柔和投影
  g.save(); g.globalAlpha = .18; g.fillStyle = '#141210';
  g.filter = 'blur(3px)'; g.beginPath(); g.ellipse(710, 500, 300, 26, 0, 0, 7); g.fill(); g.restore();
  // 标题：撕边纸卡 + 四角胶带
  g.save(); g.translate(380, 170);
  g.beginPath(); g.moveTo(-190, -54);
  for (let x = -190; x <= 190; x += 20) g.lineTo(x, -54 + Math.sin(x * .07) * 5);
  g.lineTo(190, 54);
  for (let x = 190; x >= -190; x -= 20) g.lineTo(x, 54 + Math.cos(x * .06) * 5);
  g.closePath(); g.fillStyle = '#e8dfc9'; g.fill();
  g.strokeStyle = 'rgba(20,18,16,.2)'; g.lineWidth = 2; g.stroke();
  [[-150, -40], [150, -40], [-150, 40], [150, 40]].forEach(([x, y], i) => {
    g.save(); g.translate(x, y); g.rotate(rr(i, 9, -.16, .16));
    g.fillStyle = 'rgba(212,201,168,.6)'; rrect(g, -38, -16, 76, 32, 3); g.fill();
    g.strokeStyle = 'rgba(20,18,16,.12)'; g.lineWidth = 1;
    for (let l = -30; l <= 30; l += 6) { g.beginPath(); g.moveTo(l, -16); g.lineTo(l, 16); g.stroke(); }
    g.restore();
  });
  txt(g, '海上丝路', 0, 2, 52, F.serif, '#141210', 600, 'center');
  g.restore();
  txt(g, 'VENICE · 帆船启航', 700, 600, 22, F.serif, 'rgba(20,18,16,.55)', 400, 'center');
};

// ============================================================
// 27 像素游戏 pixelgame —— 8bit 实况，对话框即字幕
// ============================================================
const SPR = {
  idle: ['................', '................', '.....2222.......', '....211112......', '....2111112.....', '....2111112.....', '.....23332......', '......33........', '.....4444.......', '....444444......', '....4.444.4.....', '....4...4.4.....', '....44..44......', '................', '................', '................'],
  run: ['................', '................', '.....2222.......', '....211112......', '....2111112.....', '....2111112.....', '.....23332......', '......33........', '.....4444.......', '....444444......', '...44..444......', '..44....444.....', '.44......44.....', '................', '................', '................'],
};
const PAL: Record<string, string> = { '1': '#f4d8b0', '2': '#3a2a1a', '3': '#2b4a8f', '4': '#1a2a4a' };
export const drawPixelGame: Draw = (g, t) => {
  const S = 26, ox = 300, oy = 210;
  // 雪地
  const sky = g.createLinearGradient(0, 0, 0, DH);
  sky.addColorStop(0, '#7a9cc0'); sky.addColorStop(1, '#e8f0f8');
  g.fillStyle = sky; g.fillRect(0, 0, DW, DH);
  g.fillStyle = '#c8d8e8';
  for (let i = 0; i < 26; i++) { const x = i * 76 + (i % 3) * 20, y = 40 + rnd(i, 5) * 120; g.beginPath(); g.arc(x, y, 4 + rnd(i, 6) * 8, 0, 7); g.fill(); }   // 飘雪
  g.fillStyle = '#90a8c0'; g.fillRect(0, 520, DW, 172);                          // 地面
  g.fillStyle = '#c8d8e8'; g.fillRect(0, 520, DW, 14);
  for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(Math.round(rnd(i, 8) * DW / 26) * 26, 540 + Math.round(rnd(i, 9) * 5) * 26, 26, 26); }
  // 远处树（像素块）
  for (let i = 0; i < 4; i++) {
    const x = 100 + i * 480, y = 430;
    g.fillStyle = '#5a7a5a'; g.fillRect(x, y, 26 * 3, 26 * 2); g.fillRect(x + 26, y - 26, 26, 26);
    g.fillStyle = '#6b4423'; g.fillRect(x + 26, y + 52, 26, 26);
  }
  // 角色：16×16 精灵，走/站
  const frame = Math.floor(t * 12);
  const spr: string[] = t < 1.4 ? SPR.idle : SPR.run;
  const px = ox + (t < 1.4 ? 0 : (t - 1.4) * 130), bob = Math.floor(frame / 6) % 2 === 0 ? 0 : -26;
  spr.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || !PAL[ch]) return;
    g.fillStyle = PAL[ch]; g.fillRect(px + x * S, oy + y * S + bob, S, S);
  }));
  // HUD：体力条
  g.fillStyle = 'rgba(20,18,16,.6)'; rrect(g, 40, 40, 300, 56, 6); g.fill();
  txt(g, 'HP', 60, 68, 22, F.pixel, '#f8f8f0');
  for (let i = 0; i < 6; i++) { g.fillStyle = i < 4 ? '#ff6b35' : '#4a4a52'; g.fillRect(120 + i * 34, 52, 26, 32); }
  // 对话框（即字幕）
  const lines = ['我们带着木剑出发了。', '冷吗？给，一起围着。'];
  const li = t < 1.6 ? 0 : 1, d = li === 0 ? .3 : 1.9;
  const p = clamp((t - d) * 4.2);
  g.fillStyle = '#f8f8f0'; rrect(g, 120, 560, DW - 240, 130, 0); g.fill();
  g.strokeStyle = '#141210'; g.lineWidth = 6; rrect(g, 120, 560, DW - 240, 130, 0); g.stroke();
  [[120, 560], [DW - 120, 560], [120, 690], [DW - 120, 690]].forEach(([x, y]) => { g.fillStyle = '#141210'; g.fillRect(x - 8, y - 8, 16, 16); });
  if (p > 0) txt(g, typed(lines[li], p), 170, 620, 48, F.pixel, '#141210');
  if (p >= 1 && Math.floor(t * 4) % 2 === 0) { g.fillStyle = '#141210'; g.fillRect(DW - 220, 630, 26, 26); }
  // 火堆（第二句时出现，逐帧长出）
  if (t > 2.0) {
    const fx = 1480, fy = 470, f = Math.floor(t * 8);
    const fr: number[] = [[0, 1, 0], [1, 0, 1], [2, 0, 0], [1, 1, 1]][f % 4];
    const flames: [number, number, string, number][] = [[0, 0, '#ff3b20', 26], [1, 0, '#ff6b35', 26], [2, 0, '#ffc93c', 26]];
    flames.forEach(([x, y, c, s], i) => {
      if (fr[i]) { g.fillStyle = c; g.fillRect(fx + x * s, fy + y * s, s, s); }
    });
    g.fillStyle = '#6b4423'; g.fillRect(fx - 26, fy + 78, 130, 20);
  }
};

// ============================================================
// 28 水墨国风 ink —— 五级墨色 + 一笔成形
// ============================================================
export const drawInk: Draw = (g, t) => {
  g.fillStyle = '#f2ead8'; g.fillRect(0, 0, DW, DH);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(120,100,70,${rnd(i, 1) * .04})`; g.fillRect(rnd(i, 2) * DW, rnd(i, 3) * DH, 2, 40); }  // 纸纤维
  // 塔：三层檐口的塔，一笔写成（起笔重、行笔稳）
  const curve = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, n = 14) => {
    const p: number[] = [];
    for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; p.push(v * v * x1 + 2 * v * u * cx + u * u * x2, v * v * y1 + 2 * v * u * cy + u * u * y2); }
    return p;
  };
  const tower: number[][] = [
    [520, 132, 520, 178],                                              // 塔尖
    curve(398, 186, 520, 142, 642, 186),                            // 一檐
    [452, 190, 452, 252], [588, 190, 588, 252],                        // 塔身
    curve(414, 258, 520, 218, 626, 258),                            // 二檐
    [468, 262, 468, 330], [572, 262, 572, 330],
    curve(382, 336, 520, 298, 658, 336),                            // 三檐
    [486, 340, 486, 424], [554, 340, 554, 424],
    curve(412, 430, 520, 404, 628, 430),                            // 台基檐
    [486, 434, 486, 470], [554, 434, 554, 470],
    [418, 474, 622, 474],                                              // 台基
  ];
  const tp = clamp((t - .1) / 1.6);
  tower.forEach((seg, i) => {
    const p = clamp(tp * tower.length - i);
    if (p <= 0) return;
    jline(g, reveal(seg, p), i < 2 ? '#1a1614' : '#3a3330', i < 2 ? 9 : 6 - i * .1, 30 + i, .8);
  });
  // 水边小亭
  const pav = [[1180, 520, 1180, 360], [1100, 360, 1260, 360], [1180, 360, 1180, 300], [1060, 520, 1300, 520]];
  const pp = clamp((t - .8) / 1.2);
  pav.forEach((seg, i) => { const p = clamp(pp * pav.length - i); jline(g, reveal(seg, p), '#3a3330', 6, 50 + i, .8); });
  // 柳丝：多笔依次
  const lp = clamp((t - 1.5) / 1.4);
  for (let i = 0; i < 7; i++) {
    const x = 1420 + i * 14, p = clamp(lp * 7 - i);
    if (p <= 0) continue;
    const pts: number[] = [];
    for (let j = 0; j <= 24; j++) { const u = j / 24; pts.push(x + Math.sin(u * 2.4 + i) * 26 * u, 320 + u * 200); }
    jline(g, reveal(pts, p), '#5c5250', 3, 70 + i, 1);
  }
  // 玻璃塔/电视塔（右侧剪影，淡墨）
  if (t > 2.2) { g.globalAlpha = clamp((t - 2.2) * 1.5); jline(g, [1620, 560, 1620, 240, 1660, 300, 1580, 300, 1620, 240], '#8a7f7c', 5, 90, 1); g.globalAlpha = 1; }
  // 最后一笔画月：升上夜空
  const mp = clamp((t - 2.6) / 1.1);
  if (mp > 0) {
    const r = 108 * clamp(mp * 1.4), y = lerp(560, 190, E.inOut(mp));
    g.save(); g.globalAlpha = .5 * mp; g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(430, y, r * 1.5, 0, 7); g.fill(); g.restore();
    g.beginPath(); g.arc(430, y, r, 0, Math.PI * 2 * clamp(mp * 1.3));
    g.strokeStyle = '#1a1614'; g.lineWidth = 9; g.lineCap = 'round'; g.stroke();
  }
  // 结尾：淡青暮色 + 窗灯
  const ep = clamp((t - 3.3) / .8);
  if (ep > 0) {
    g.fillStyle = '#a8c0c8'; g.globalAlpha = .3 * ep; g.fillRect(0, 0, DW, DH); g.globalAlpha = 1;
    for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(255,201,60,${.5 * ep})`; g.fillRect(1080 + i * 46, 420 + (i % 2) * 30, 14, 16); }
  }
  txt(g, '夜塔望月', 150, 640, 44, F.serif, '#3a3330', 500);
};

// ============================================================
// 29 数学讲解 math —— 公式逐步推演 + 图表同步生长
// ============================================================
export const drawMath: Draw = (g, t) => {
  g.fillStyle = '#0d1420'; g.fillRect(0, 0, DW, DH);
  const steps: [string, string][] = [
    ['01', '已知 f(x) = x² 在 [0, 2] 上连续'],
    ['02', '取分割 xᵢ = 2i/n，Δx = 2/n'],
    ['03', 'Σ f(xᵢ)Δx = Σ (2i/n)² · 2/n'],
    ['04', '= 8/n³ · Σ i² = 8/n³ · n(n+1)(2n+1)/6'],
    ['05', 'n → ∞ 时极限为 8/3'],
  ];
  steps.forEach(([no, s], i) => {
    const p = clamp((t - .05 - i * .5) * 2.4);
    if (p <= 0) return;
    const cur = t - (.05 + i * .5) < .5 && t > .05 + i * .5;
    const y = 70 + i * 78;
    if (cur) { g.fillStyle = 'rgba(240,240,245,.10)'; g.fillRect(90, y - 34, 1080, 68); g.fillStyle = '#4ea8ff'; g.fillRect(90, y - 34, 4, 68); }
    g.globalAlpha = cur ? 1 : .55;
    g.fillStyle = '#4ea8ff'; g.beginPath(); g.arc(126, y, 22, 0, 7); g.fill();
    txt(g, no, 126, y + 1, 20, F.mono, '#0d1420', 700, 'center');
    txt(g, typed(s, p), 180, y, 36, F.serif, cur ? '#f0f0f5' : '#c9cdd8');
    g.globalAlpha = 1;
  });
  // 右侧图表：曲线按路径长出 + 标注点
  g.strokeStyle = '#3a4458'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(1300, 80); g.lineTo(1300, 470); g.lineTo(1850, 470); g.stroke();
  const cp = clamp((t - 1.6) / 1.6);
  if (cp > 0) {
    g.beginPath();
    for (let i = 0; i <= 60; i++) {
      const u = i / 60, x = 1320 + u * 500, y = 450 - Math.pow(u, 2) * 330;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.strokeStyle = '#4ea8ff'; g.lineWidth = 4; g.lineWidth = 4; g.stroke();
    // 柱体（黎曼和）：从底向上生长
    for (let i = 0; i < 8; i++) {
      const u = (i + .5) / 8, h = Math.pow(u, 2) * 330 * clamp((cp - i * .08) * 4);
      if (h <= 0) continue;
      g.fillStyle = 'rgba(78,168,255,.28)'; g.fillRect(1320 + u * 500 - 14, 450 - h, 28, h);
    }
    // 最大值标注
    if (cp > .7) {
      const x = 1320 + 500, y = 450 - 330;
      g.fillStyle = '#ffc93c'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
      g.strokeStyle = '#ffc93c'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 90, y - 60); g.stroke();
      txt(g, '最大值 4', x - 96, y - 66, 22, F.mono, '#ffc93c');
    }
  }
  // 结论
  const ep = clamp((t - 3.4) / .5);
  if (ep > 0) { g.globalAlpha = ep; txt(g, '∫₀² x² dx = 8/3', 620, 480, 52, F.serif, '#ffc93c', 700, 'center'); g.globalAlpha = 1; }
  txt(g, '定积分的定义', 130, 620, 26, F.mono, '#5a6478');
};

// ============================================================
// 30 赛博数字 cyber —— 数据流 + 全息线框 + 故障
// ============================================================
export const drawCyber: Draw = (g, t) => {
  g.fillStyle = '#050810'; g.fillRect(0, 0, DW, DH);
  const halo = g.createRadialGradient(700, 260, 40, 700, 260, 700);
  halo.addColorStop(0, 'rgba(0,240,255,.10)'); halo.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = halo; g.fillRect(0, 0, DW, DH);
  // 数据流：竖向数字串，自上而下
  for (let i = 0; i < 26; i++) {
    const x = 40 + i * 74, sp = 120 + rnd(i, 1) * 260;
    for (let j = 0; j < 12; j++) {
      const y = ((j * 56 + t * sp + rnd(i, 2) * 400) % (DH + 120)) - 60;
      g.globalAlpha = (1 - j / 12) * .55;
      txt(g, String(Math.floor(rnd(i * 12 + j, 3) * 10)), x, y, 22, F.mono, '#00f0ff', 400, 'center');
    }
  }
  g.globalAlpha = 1;
  // 全息线框：等轴立方体 + 扫描线
  g.save(); g.translate(960, 330);
  const rz = t * .7, rx = .5 + .12 * Math.sin(t * .8);
  const P3 = (x: number, y: number, z: number): [number, number] => {
    const c = Math.cos(rz), s = Math.sin(rz);
    const X = x * c - z * s, Z = x * s + z * c;
    return [X, y * Math.cos(rx) - Z * Math.sin(rx) * .6];
  };
  const V: [number, number, number][] = [[-110, -110, -110], [110, -110, -110], [110, 110, -110], [-110, 110, -110], [-110, -110, 110], [110, -110, 110], [110, 110, 110], [-110, 110, 110]];
  const EDG: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  g.strokeStyle = '#00f0ff'; g.lineWidth = 2.4; g.globalAlpha = .85;
  EDG.forEach(([a, b]) => { const [x1, y1] = P3(...V[a]), [x2, y2] = P3(...V[b]); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); });
  // 内部点云
  for (let i = 0; i < 14; i++) {
    const [x, y] = P3(rr(i, 4, -100, 100), rr(i, 5, -100, 100), rr(i, 6, -100, 100));
    g.fillStyle = '#ff2d95'; g.globalAlpha = .5 + .4 * Math.sin(t * 4 + i); g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
  }
  g.globalAlpha = 1; g.restore();
  // 扫描线：自上而下循环
  const sy = (t * 240) % DH;
  g.fillStyle = 'rgba(0,240,255,.16)'; g.fillRect(0, sy, DW, 3);
  const sg = g.createLinearGradient(0, sy - 40, 0, sy + 40);
  sg.addColorStop(0, 'rgba(0,240,255,0)'); sg.addColorStop(.5, 'rgba(0,240,255,.10)'); sg.addColorStop(1, 'rgba(0,240,255,0)');
  g.fillStyle = sg; g.fillRect(0, sy - 40, DW, 80);
  // 故障：每 3 秒触发一次，持续 6 帧
  if (Math.floor(t) % 3 === 2 && (t % 1) < .2) {
    for (let i = 0; i < 3; i++) {
      const y = rr(i, 20, 0, DH), h = rr(i, 21, 3, 9), dx = rr(i, 22, -14, 14);
      g.fillStyle = i === 0 ? 'rgba(255,45,149,.5)' : i === 1 ? 'rgba(0,240,255,.5)' : 'rgba(57,255,136,.4)';
      g.fillRect(dx, y, DW, h);
    }
  }
  // HUD
  txt(g, 'DATA STREAM · LIVE', 60, 56, 20, F.mono, 'rgba(0,240,255,.8)');
  txt(g, '0x7F3A · 128 nodes', 1820, 56, 20, F.mono, 'rgba(0,240,255,.8)', 400, 'right');
  txt(g, '全息投影', 960, 560, 30, F.en, 'rgba(240,245,255,.75)', 500, 'center');
  txt(g, 'SYS · OK', 60, 640, 18, F.mono, 'rgba(57,255,136,.7)');
};

// ============================================================
// 31 数据新闻 datanews —— 图表动态生成 + 标题式排版
// ============================================================
export const drawDataNews: Draw = (g, t) => {
  g.fillStyle = '#f5f5f2'; g.fillRect(0, 0, DW, DH);
  // 栏目标签 + 标题 + 来源
  const hp = clamp(t * 2);
  g.fillStyle = '#d92b2b'; rrect(g, 80, 44, 150, 40, 4); g.fill();
  txt(g, '数据看板', 155, 65, 22, F.cn, '#ffffff', 700, 'center');
  txt(g, '国产 AI 芯片自给率三年变化', 80, 130, 46, F.cn, '#141414', 800);
  txt(g, '来源：行业协会年度报告 · 2023–2025', 80, 176, 20, F.cn, '#8a8a92', 400);
  // 柱状图
  const data: [string, number, string][] = [['2023', .34, '#b8bcc4'], ['2024', .52, '#b8bcc4'], ['2025', .78, '#d92b2b']];
  const cx0 = 140, cw = 150, base = 560;
  data.forEach(([yr, v, c], i) => {
    const p = clamp((t - .5 - i * .35) * 1.8);
    const h = 340 * v * p, x = cx0 + i * (cw + 90);
    g.fillStyle = c; g.fillRect(x, base - h, cw, h);
    txt(g, yr, x + cw / 2, base + 34, 24, F.mono, '#5a5a62', 700, 'center');
    if (p > .9) txt(g, `${Math.round(v * 100)}%`, x + cw / 2, base - h - 30, 34, F.cn, i === 2 ? '#d92b2b' : '#5a5a62', 800, 'center');
  });
  g.strokeStyle = '#c8ccd4'; g.lineWidth = 2; g.beginPath(); g.moveTo(110, base); g.lineTo(700, base); g.stroke();
  // 大数字砸入
  const np = clamp((t - 1.9) * 2.2);
  if (np > 0) {
    const sc = 1.4 - .4 * E.snap(np);
    g.save(); g.translate(1080, 330); g.scale(sc, sc);
    txt(g, '+44', 0, 0, 150, F.cn, '#d92b2b', 900, 'center');
    g.restore();
    txt(g, '个百分点', 1080, 440, 30, F.cn, '#5a5a62', 500, 'center');
    txt(g, '2023 → 2025', 1080, 500, 24, F.mono, '#8a8a92', 400, 'center');
  }
  // 折线小图（右侧）
  const lp = clamp((t - 2.4) / 1.2);
  if (lp > 0) {
    g.strokeStyle = '#1f5fd0'; g.lineWidth = 4;
    g.beginPath();
    [[1400, 420], [1520, 380], [1640, 300], [1760, 210]].forEach(([x, y], i) => i === 0 ? g.moveTo(x, y) : g.lineTo(x, y));
    g.stroke();
    [[1400, 420], [1520, 380], [1640, 300], [1760, 210]].forEach(([x, y]) => { g.fillStyle = '#1f5fd0'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); });
    txt(g, '自给率趋势', 1580, 160, 22, F.cn, '#5a5a62', 500, 'center');
  }
  // 时间轴
  g.strokeStyle = '#c8ccd4'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(1400, 600); g.lineTo(1860, 600); g.stroke();
  ['2023', '2024', '2025'].forEach((yr, i) => {
    const x = 1400 + i * 230, on = t > 1.4 + i * .5;
    g.fillStyle = on ? '#1f5fd0' : '#f5f5f2'; g.beginPath(); g.arc(x, 600, on ? 14 : 10, 0, 7); g.fill();
    g.strokeStyle = '#1f5fd0'; g.lineWidth = 3; g.stroke();
    txt(g, yr, x, 636, 20, F.mono, on ? '#1f5fd0' : '#8a8a92', on ? 700 : 400, 'center');
  });
};

// ============================================================
// 32 编程教程 code —— 编辑器 + 逐字输入 + 终端
// ============================================================
const CODE: [string, string][] = [
  ['', '// 把"稍后做"换成"现在做"'],
  ['', 'function now(task) {'],
  ['k', '  if (!task.important) return;'],
  ['s', '  return task.start();'],
  ['', '}'],
];
export const drawCode: Draw = (g, t) => {
  g.fillStyle = '#1e1e2e'; g.fillRect(0, 0, DW, DH);
  g.fillStyle = '#181825'; g.fillRect(0, 0, 250, DH);                            // 文件树
  txt(g, 'EXPLORER', 24, 40, 16, F.mono, '#6a6a78');
  ['index.ts', 'now.ts', 'tasks.json', 'README.md'].forEach((f, i) => {
    const on = i === 1;
    if (on) { g.fillStyle = '#313244'; g.fillRect(0, 62 + i * 44, 250, 44); }
    txt(g, f, 24, 84 + i * 44, 18, F.mono, on ? '#cdd6f4' : '#7a7a88');
  });
  g.fillStyle = '#313244'; g.fillRect(250, 0, DW - 250, 46);                     // 标签页
  txt(g, 'now.ts', 280, 23, 18, F.mono, '#cdd6f4');
  g.fillStyle = '#89b4fa'; g.fillRect(250, 44, DW - 250, 3);
  // 代码行：逐字输入 / 退格
  const SYM: Record<string, string> = { k: '#c678dd', s: '#98c379', f: '#61afef', n: '#d19a66', c: '#5c6370', p: '#abb2bf' };
  const colorize = (s: string) => {
    if (s.trim().startsWith('//')) return '#5c6370';
    return s.replace(/\b(function|if|return|const)\b/g, '\u0001$1\u0001').replace(/\b(\d+)\b/g, '\u0002$1\u0002').replace(/'([^']*)'/g, "\u0003'$1'\u0003");
  };
  const paint = (s: string, x: number, y: number) => {
    const parts = colorize(s).split(/([\u0001\u0002\u0003])/);
    let cx = x, inTag = false, tag = '';
    parts.forEach(p => {
      if (p === '\u0001' || p === '\u0002' || p === '\u0003') { inTag = !inTag; tag = inTag ? p : ''; return; }
      g.font = `400 26px ${F.mono}`; g.fillStyle = inTag ? (tag === '\u0001' ? '#c678dd' : tag === '\u0002' ? '#d19a66' : '#98c379') : '#abb2bf';
      g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(p, cx, y);
      cx += g.measureText(p).width;
    });
  };
  const cur = 2;                                                                  // 当前讲解行
  CODE.forEach(([kind, s], i) => {
    const y = 100 + i * 62;
    if (i === cur) { g.fillStyle = 'rgba(97,175,239,.14)'; g.fillRect(250, y - 32, DW - 250, 62); g.fillStyle = '#61afef'; g.fillRect(250, y - 32, 4, 62); }
    txt(g, String(i + 1), 300, y, 20, F.mono, '#4a4a58', 400, 'right');
    let shown = s;
    if (i === cur) shown = typed(s, clamp((t - .3) * 3.2));
    if (i === cur + 1) { const dp = clamp((t - 1.6) * 2.4); shown = dp > 0 ? typed(s, dp) : s.slice(0, Math.max(0, s.length - Math.floor((t - 1.6) * 8))); }
    paint(shown, 330, y);
  });
  // 光标
  if (Math.floor(t * 2) % 2 === 0) {
    const y = 100 + cur * 62, s = typed(CODE[cur][1], clamp((t - .3) * 3.2));
    g.font = `400 26px ${F.mono}`;
    g.fillStyle = '#f5e0ac'; g.fillRect(330 + g.measureText(s).width + 2, y - 18, 3, 36);
  }
  // 终端
  g.fillStyle = '#11111b'; g.fillRect(250, 430, DW - 250, 130);
  txt(g, 'TERMINAL', 280, 456, 16, F.mono, '#6a6a78');
  const out = ['$ node now.ts', '> task.start()', '✓ done in 0.42s'];
  out.forEach((l, i) => {
    const p = clamp((t - 1.2 - i * .4) * 3); if (p <= 0) return;
    txt(g, typed(l, p), 280, 494 + i * 30, 20, F.mono, i === 2 ? '#a6e3a1' : '#cdd6f4');
  });
  txt(g, 'now.ts · 逐行讲解', 280, 600, 22, F.mono, '#5a5a68');
};

// ============================================================
// 33 3D建模 modeling —— 线框 → 实体 → 材质 → 拆解
// ============================================================
export const drawModeling: Draw = (g, t) => {
  g.fillStyle = '#0a0a12'; g.fillRect(0, 0, DW, DH);
  const bg = g.createRadialGradient(960, 300, 40, 960, 300, 800);
  bg.addColorStop(0, '#15151f'); bg.addColorStop(1, '#0a0a12');
  g.fillStyle = bg; g.fillRect(0, 0, DW, DH);
  g.strokeStyle = 'rgba(40,40,60,.5)'; g.lineWidth = 1;                            // 网格地面
  for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(960 - 700 + i * 130, 560); g.lineTo(960 + 700, 560 - i * 0); g.stroke(); }
  const rz = t * .5;
  const P3 = (x: number, y: number, z: number): [number, number] => {
    const c = Math.cos(rz), s = Math.sin(rz);
    return [960 + (x * c - z * s) * .62, 300 + (y - (x * s + z * c) * .3) * .62];
  };
  // 四阶段
  const stage = t < 1.0 ? 0 : t < 2.0 ? 1 : t < 2.9 ? 2 : 3;
  const sp = clamp((t - [0, 1.0, 2.0, 2.9][stage]) / .5);
  const expl = stage === 3 ? clamp((t - 2.9) / .6) : 0;
  const parts: [number, number, number, number, string][] = [
    [-70, -70, -70, 1, '主体'], [70, -70, -70, -1, '顶盖'],
    [-70, 70, -70, -1, '底座'], [70, 70, -70, 1, '侧板'],
  ];
  parts.forEach(([x, y, z, dir, name], i) => {
    const ex = expl * dir * 46;
    const pts = [[x + ex, y, z], [x + ex + 130, y, z], [x + ex + 130, y + 130, z], [x + ex, y + 130, z]].map(([a, b, c]) => P3(a, b, c)) as [number, number][];
    // 线框（全程保留，实体阶段变淡）
    const wf = stage === 0 ? 1 : stage === 1 ? .55 : .25;
    g.globalAlpha = wf * clamp(sp * 3);
    g.strokeStyle = '#00f0ff'; g.lineWidth = 2.2;
    g.beginPath(); pts.forEach(([px, py], j) => j === 0 ? g.moveTo(px, py) : g.lineTo(px, py)); g.closePath(); g.stroke();
    g.globalAlpha = 1;
    // 实体面
    if (stage >= 1) {
      const fp = stage === 1 ? sp : 1;
      g.globalAlpha = fp * (stage === 1 ? .85 : .95);
      const shade = stage >= 2 ? 1 : .55;
      g.fillStyle = i % 2 ? `rgba(90,120,190,${shade})` : `rgba(70,95,160,${shade})`;
      g.beginPath(); pts.forEach(([px, py], j) => j === 0 ? g.moveTo(px, py) : g.lineTo(px, py)); g.closePath(); g.fill();
      if (stage >= 2) { g.globalAlpha = .35 * fp; g.fillStyle = '#cfe4ff'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.lineTo(960 + (x + ex + 130) * .62, 300 + (y + 130 - (x + ex) * .3) * .62); g.lineTo(pts[3][0], pts[3][1]); g.closePath(); g.fill(); }
      g.globalAlpha = 1;
    }
    // 拆解标注
    if (stage === 3 && sp > .8) {
      const [lx, ly] = pts[1];
      g.strokeStyle = '#ffd93c'; g.lineWidth = 1.6; g.globalAlpha = sp;
      g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 60, ly - 44); g.lineTo(lx + 150, ly - 44); g.stroke();
      g.fillStyle = 'rgba(20,20,30,.85)'; rrect(g, lx + 150, ly - 66, 130, 44, 4); g.fill();
      txt(g, name, lx + 215, ly - 44, 20, F.mono, '#ffd93c', 500, 'center');
      g.globalAlpha = 1;
    }
  });
  // 阶段标签
  const stages = ['01 线框', '02 实体', '03 材质', '04 拆解'];
  stages.forEach((s, i) => {
    const on = i <= stage;
    txt(g, s, 120 + i * 150, 640, 22, F.mono, on ? '#00f0ff' : '#3a4458', on ? 700 : 400);
  });
  txt(g, '线框 → 实体 → 材质 → 拆解', 960, 60, 28, F.cn, 'rgba(230,240,255,.8)', 500, 'center');
};

// ============================================================
// 34 线条竖屏 linev —— 9:16 极简线条 + 快节奏
// ============================================================
export const drawLineV: Draw = (g, t) => {
  g.fillStyle = '#101018'; g.fillRect(0, 0, DW, DH);
  // 竖画面板（9:16），居中
  const pw = 384, ph = 682, px = (DW - pw) / 2, py = (DH - ph) / 2;
  g.fillStyle = '#0c0c14'; rrect(g, px - 14, py - 14, pw + 28, ph + 28, 26); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; rrect(g, px - 14, py - 14, pw + 28, ph + 28, 26); g.stroke();
  g.save(); rrect(g, px, py, pw, ph, 14); g.clip();
  g.fillStyle = '#0c0c14'; g.fillRect(px, py, pw, ph);
  const cx = px + pw / 2;
  const glow = (col: string) => { g.shadowColor = col; g.shadowBlur = 16; };
  // 顶部：序号 + 主标题
  txt(g, '01 / 05', px + 28, py + 40, 20, F.cn, 'rgba(255,255,255,.45)', 500);
  txt(g, '先做最重要的那件', px + 28, py + 86, 30, F.cn, '#f5f5f5', 800);
  // 信息点：每 0.75 秒一个，硬切
  const pts: [string, string][] = [
    ['列清单', '把所有事写下来'],
    ['排优先级', '只留最重要的一件'],
    ['立刻开始', '25 分钟内动手'],
    ['做完再下一件', '不并行、不囤积'],
  ];
  const idx = Math.min(3, Math.floor(t / .75));
  const lt = (t - idx * .75) % .75;
  const [title, body] = pts[idx];
  const ap = clamp(lt * 5);
  g.save(); g.translate(cx, py + 300); g.scale(lerp(.82, 1, E.back(ap)), lerp(.82, 1, E.back(ap)));
  // 极简线条图形：一个圆 + 一条折线，随 idx 变形
  g.strokeStyle = idx % 2 ? '#ff2d95' : '#0f6bff'; g.lineWidth = 5; glow(idx % 2 ? '#ff2d95' : '#0f6bff');
  if (idx === 0) { g.beginPath(); g.arc(0, -40, 62, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-40, 50); g.lineTo(40, 50); g.stroke(); }
  if (idx === 1) { for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-60, -30 + i * 40); g.lineTo(20 - i * 12, -30 + i * 40); g.lineWidth = 6 - i; g.stroke(); } }
  if (idx === 2) { g.beginPath(); g.moveTo(-50, 60); g.lineTo(-10, 0); g.lineTo(30, 30); g.lineTo(70, -50); g.stroke(); g.fillStyle = idx % 2 ? '#ff2d95' : '#0f6bff'; g.beginPath(); g.arc(70, -50, 8, 0, 7); g.fill(); }
  if (idx === 3) { g.beginPath(); g.arc(0, 0, 58, 0, 7); g.stroke(); g.beginPath(); g.moveTo(0, -58); g.lineTo(0, 58); g.stroke(); }
  g.restore(); g.shadowBlur = 0;
  txt(g, title, cx, py + 430, 40, F.cn, '#f5f5f5', 800, 'center');
  txt(g, body, cx, py + 486, 24, F.cn, 'rgba(255,255,255,.6)', 400, 'center');
  // 底部：字幕 + 进度
  txt(g, '一条一条来，别急着全做', cx, py + ph - 96, 22, F.cn, 'rgba(255,255,255,.75)', 500, 'center');
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(px + 28, py + ph - 56, pw - 56, 5);
  g.fillStyle = '#ff2d95'; g.fillRect(px + 28, py + ph - 56, (pw - 56) * clamp(t / 3), 5);
  g.restore();
  // 面板外的说明
  txt(g, '9:16 · 1080×1920', DW - 60, py - 40, 20, F.cn, 'rgba(255,255,255,.4)', 400, 'right');
};

export type Draw = (g: CanvasRenderingContext2D, t: number, w?: number, h?: number) => void;
