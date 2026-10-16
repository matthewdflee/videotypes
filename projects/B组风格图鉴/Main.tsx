// B 组风格图鉴：一条片子看全 15 套 Opus 5.5 沉淀风格。
// 结构：持久信息条（序号 / 风格名 / ID / 字体 / 提示词）+ 演示区（15 段各 4 秒，硬切 + 擦入）。
// 风格文档：references/风格_20..34_*.md；提示词原文：references/Opus55提示词库.md
import React from 'react';
import { AbsoluteFill, useCurrentFrame, Series } from 'remotion';
import { F, useT, clamp, E, typed } from '@kit';
import { drawEditor, drawMV, drawCrayon, drawLantern, drawLaunch, drawWhiteboard, drawEngraving, drawPixelGame, drawInk, drawMath, drawCyber, drawDataNews, drawCode, drawModeling, drawLineV, Draw, DEMO_TOP, DEMO_H } from './demos';

const SEG = 4;                                    // 每段 4 秒
export const DURATION = 15 * SEG;                 // 60 秒

type Seg = {
  no: string; id: string; name: string; group: string;
  font: string; fontNote: string;                 // 该风格的专用字体
  prompt: string[];                               // 提示词（ condensed from Opus55提示词库.md ）
  src: string;
  draw: Draw; ink: string;                        // ink = 信息条强调色
};

const SEGS: Seg[] = [
  { no: '20', id: 'editor', name: '剪辑动画', group: '职场与商业', font: F.fun, fontNote: '得意黑（手写，与角色同源）',
    prompt: ['手绘小人住在剪辑软件界面里：时间轴是地面，素材箱是仓库。', '开场扛着素材在轨道上奔跑 → 撞碎屏幕玻璃，透视放大扑向镜头 →', '探出手机画面，朝观众挥手。'],
    src: '提示词第 1 条 · 据视频字幕语义整理', draw: drawEditor, ink: '#ffc93c' },
  { no: '21', id: 'mv', name: '音乐MV', group: '职场与商业', font: F.serif, fontNote: '思源宋体（电影字幕）',
    prompt: ['还记得一年前站在火车站，透过玻璃窗看见你的泪满面。', '歌词即剧本：唱到什么画面就出现什么，', '节拍即剪辑点，字幕居中无底条。'],
    src: '提示词第 2 条 · 原文', draw: drawMV, ink: '#f3d9a8' },
  { no: '22', id: 'crayon', name: '蜡笔绘本', group: '手作与国风', font: F.fun, fontNote: '得意黑（手写片名）',
    prompt: ['蜡笔绘本风格：蜡笔画出房子和月亮，手写片名。', '月亮睁大眼数绵羊，天上写下一二三；', '小女孩顺画出的梯子爬上屋顶唱歌，群青水彩横扫夜空，白蜡笔星星浮现。'],
    src: '提示词第 3 条 · 原文', draw: drawCrayon, ink: '#e8734a' },
  { no: '23', id: 'lantern', name: '纸灯影', group: '手作与国风', font: F.serif, fontNote: '思源宋体（竖排题字）',
    prompt: ['夜里木桌上一只纸灯箱，旁有月饼和青花茶具。', '先只亮起月亮，背光随后点亮：祥云、淡蓝山、徽派村落窗灯、', '金色桂花、红灯笼依次亮起，镜头推进灯箱，底部细体旁白讲月相。'],
    src: '提示词第 4 条 · 原文', draw: drawLantern, ink: '#ffc93c' },
  { no: '24', id: 'launch', name: '产品发布', group: '职场与商业', font: F.en, fontNote: 'Space Grotesk（几何无衬线）',
    prompt: ['7 秒中文产品发布片，虚构「灵犀」游戏手柄。', '微距扫光开场「你的手柄，还能更好玩。」→ 3D 英雄镜头切四种配色', '→ 扳机力度、光绘两张功能卡 →「玩。」字砸屏 → 结尾卡和网址按钮。'],
    src: '提示词第 5 条 · 原文', draw: drawLaunch, ink: '#2b3bdb' },
  { no: '25', id: 'whiteboard', name: '手绘白板', group: '知识与教育', font: F.fun, fontNote: '得意黑（板写手写体）',
    prompt: ['白板上陆续冒出「先做哪个？」「全都要做？」，', '荧光笔划重点，最后写下「先做最重要的那件」。', '逐笔书写，不整字淡入。'],
    src: '提示词第 6 条 · 原文', draw: drawWhiteboard, ink: '#2b4a8f' },
  { no: '26', id: 'engraving', name: '黑白版画线刻贴纸', group: '手作与国风', font: F.serif, fontNote: '思源宋体（19 世纪出版物衬线）',
    prompt: ['黑白版画线刻贴纸，白色模切描边 + 柔和投影。', '三个镜头：威尼斯帆船启航、丝绸之路驼队、元大都宫殿与线装游记；', '标题贴撕边纸卡上加胶带，元素 12 帧定格弹入，构图简洁。'],
    src: '提示词第 7 条 · 原文', draw: drawEngraving, ink: '#141210' },
  { no: '27', id: 'pixelgame', name: '像素游戏', group: '游戏与社交', font: F.pixel, fontNote: 'Fusion Pixel 12px（须 12 的整数倍字号）',
    prompt: ['我们带着木剑出发了。', '冷吗？给，一起围着。', '8bit 掌机感：对话框即字幕，色板 ≤24，12fps 逻辑帧，整像素对齐。'],
    src: '提示词第 8 条 · 原文', draw: drawPixelGame, ink: '#ff6b35' },
  { no: '28', id: 'ink', name: '水墨国风', group: '手作与国风', font: F.serif, fontNote: '思源宋体（楷/宋，竖排）',
    prompt: ['转玻璃塔、电视塔和水边小亭，柳丝垂落。', '最后一笔升上夜空画出圆月，月亮画完泛起柔和暖光，', '天空晕开淡青暮色，窗灯渐亮。'],
    src: '提示词第 9 条 · 据视频字幕语义整理', draw: drawInk, ink: '#3a3330' },
  { no: '29', id: 'math', name: '数学讲解', group: '知识与教育', font: F.serif, fontNote: '思源宋体（衬线数学体感）',
    prompt: ['公式从上到下一行行长出来，每步落定该行高亮、旧行压暗，左侧步骤序号。', '右侧图表同步长出：曲线按路径画、柱体从底向上生长，', '讲到的数据点后出标注，结论行强调色写出。'],
    src: '提示词第 10 条 · 据核心逻辑补全', draw: drawMath, ink: '#4ea8ff' },
  { no: '30', id: 'cyber', name: '赛博数字', group: '数据与科技', font: F.en, fontNote: 'Space Grotesk + IBM Plex Mono',
    prompt: ['霓虹数据流自上而下流动，全息投影线框缓慢旋转并叠扫描线。', '粒子网络按距离连线，文字带轻微外发光，HUD 用等宽小字，', '转场用故障抖动（RGB 错位 + 横向撕裂带）。'],
    src: '提示词第 11 条 · 据核心逻辑补全', draw: drawCyber, ink: '#00f0ff' },
  { no: '31', id: 'datanews', name: '数据新闻', group: '数据与科技', font: F.cn, fontNote: '思源黑体 800（新闻标题）',
    prompt: ['顶部栏目标签 + 新闻标题 + 来源小字；中部图表动态生成。', '柱体生长、折线揭示，关键数字大号字砸入；', '底部时间轴节点随讲解高亮，图表间淡入、新闻点间硬切。'],
    src: '提示词第 12 条 · 据核心逻辑补全', draw: drawDataNews, ink: '#d92b2b' },
  { no: '32', id: 'code', name: '编程教程', group: '知识与教育', font: F.mono, fontNote: 'IBM Plex Mono（等宽编辑器）',
    prompt: ['拟真深色编辑器：文件树 + 标签页 + 行号。', '当前讲解行整行高亮、左侧实心竖条；光标闪烁跟随，', '被修改的行逐字输入、删除逐字退格；终端逐行输出运行结果。'],
    src: '提示词第 13 条 · 据核心逻辑补全', draw: drawCode, ink: '#61afef' },
  { no: '33', id: 'modeling', name: '3D建模', group: '数据与科技', font: F.mono, fontNote: 'IBM Plex Mono（标注等宽小字）',
    prompt: ['深色背景建模流程演示：物体先以发光线框呈现并自转', '→ 表面从底部向上长出实体 → 材质过渡并出现高光', '→ 部件沿轴外移拆解，每个部件配引出线和名称标签。'],
    src: '提示词第 14 条 · 据核心逻辑补全', draw: drawModeling, ink: '#00f0ff' },
  { no: '34', id: 'linev', name: '线条竖屏', group: '游戏与社交', font: F.cn, fontNote: '思源黑体 800（竖屏标题）',
    prompt: ['9:16 竖屏，1080×1920，上下各留 12%、左右各留 8% 安全区。', '顶部序号 + 主标题，底部字幕；每 1.5–3 秒一个信息点，', '图形先入场、文字点后出，硬切转场，关键词强调色 + 缩放脉冲。'],
    src: '提示词第 15 条 · 据核心逻辑补全', draw: drawLineV, ink: '#ff2d95' },
];

// ---------- 演示区：擦入转场 ----------
const Demo: React.FC<{ seg: Seg }> = ({ seg }) => {
  const t = useT();
  const wipe = clamp(t / .28);                        // 每段开头 0.28 秒从左擦入（t 为 Sequence 内局部秒）
  return (
    <AbsoluteFill style={{ top: DEMO_TOP, height: DEMO_H, overflow: 'hidden' }}>
      <AbsoluteFill style={{ clipPath: `inset(0 ${(1 - E.inOut(wipe)) * 100}% 0 0)` }}>
        <Canvas draw={seg.draw} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
const Canvas: React.FC<{ draw: Draw }> = ({ draw }) => {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  React.useLayoutEffect(() => {
    const g = ref.current!.getContext('2d')!;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1920, 1080);
    g.save(); g.translate(0, DEMO_TOP);
    draw(g, f / 30, 1920, DEMO_H);
    g.restore();
  });
  return <canvas ref={ref} width={1920} height={1080} style={{ position: 'absolute', left: 0, top: -DEMO_TOP, width: 1920, height: 1080 }} />;
};

// ---------- 信息条：序号 / 风格名 / ID / 字体 / 提示词 ----------
const Bar: React.FC<{ seg: Seg; local: number; i: number }> = ({ seg, local, i }) => {
  const inA = clamp(local / .3), outA = 1 - clamp((local - SEG + .3) / .3);
  const op = Math.min(inA, outA);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* 顶部条 */}
      <AbsoluteFill style={{ height: DEMO_TOP, background: '#0e0e14', borderBottom: '2px solid rgba(255,255,255,.10)' }}>
        <div style={{ position: 'absolute', left: 56, top: 0, height: DEMO_TOP, display: 'flex', alignItems: 'center', gap: 26 }}>
          <div style={{ width: 92, height: 92, borderRadius: 12, background: seg.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: op }}>
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: '#0e0e14' }}>{seg.no}</span>
          </div>
          <div style={{ opacity: op, transform: `translateY(${(1 - E.out(inA)) * 14}px)` }}>
            <div style={{ fontFamily: seg.font, fontWeight: 800, fontSize: 62, color: '#f5f5f5', lineHeight: 1.05, letterSpacing: 1 }}>{seg.name}</div>
            <div style={{ fontFamily: F.cn, fontWeight: 400, fontSize: 21, color: 'rgba(255,255,255,.5)', marginTop: 8 }}>{seg.group} · {seg.fontNote}</div>
          </div>
          <div style={{ marginLeft: 10, padding: '8px 18px', border: `2px solid ${seg.ink}`, borderRadius: 999, opacity: op }}>
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: seg.ink }}>{seg.id}</span>
          </div>
        </div>
        <div style={{ position: 'absolute', right: 56, top: 0, height: DEMO_TOP, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', opacity: op }}>
          <span style={{ fontFamily: F.cn, fontWeight: 700, fontSize: 26, color: 'rgba(255,255,255,.72)' }}>B 组风格图鉴</span>
          <span style={{ fontFamily: F.mono, fontSize: 22, color: 'rgba(255,255,255,.42)', marginTop: 8 }}>{String(i + 1).padStart(2, '0')} / 15</span>
        </div>
      </AbsoluteFill>
      {/* 底部提示词条 */}
      <AbsoluteFill style={{ top: DEMO_TOP + DEMO_H, bottom: 0, background: '#0e0e14', borderTop: '2px solid rgba(255,255,255,.10)' }}>
        <div style={{ position: 'absolute', left: 56, top: 26, display: 'flex', alignItems: 'center', gap: 14, opacity: op }}>
          <div style={{ width: 6, height: 26, background: seg.ink, borderRadius: 3 }} />
          <span style={{ fontFamily: F.cn, fontWeight: 700, fontSize: 24, color: seg.ink, letterSpacing: 4 }}>提示词</span>
          <span style={{ fontFamily: F.mono, fontSize: 19, color: 'rgba(255,255,255,.38)' }}>{seg.src}</span>
        </div>
        <div style={{ position: 'absolute', left: 56, top: 72, right: 56, opacity: op }}>
          {seg.prompt.map((l, li) => {
            const p = clamp((local - .35 - li * .55) * 2.4);
            if (p <= 0) return null;
            return (
              <div key={li} style={{ fontFamily: F.cn, fontWeight: 400, fontSize: 27, color: li === 0 ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.62)', lineHeight: 1.62, opacity: Math.min(1, p * 1.6), transform: `translateX(${(1 - E.out(p)) * -18}px)` }}>
                {typed(l, p)}
              </div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, background: 'rgba(255,255,255,.08)' }}>
          <div style={{ height: 5, background: seg.ink, width: `${((i * SEG + local) / DURATION) * 100}%` }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = Math.min(SEGS.length - 1, Math.floor(frame / (SEG * 30)));
  const local = frame / 30 - idx * SEG;
  const seg = SEGS[idx];
  return (
    <AbsoluteFill style={{ background: '#0e0e14' }}>
      <Series>
        {SEGS.map((s, i) => (
          <Series.Sequence key={s.id} durationInFrames={SEG * 30}>
            <Demo seg={s} />
          </Series.Sequence>
        ))}
      </Series>
      <Bar seg={seg} local={local} i={idx} />
    </AbsoluteFill>
  );
};
