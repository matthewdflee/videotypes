# 溯源与授权说明

本仓库是**派生物**。发布到 GitHub 前请先读这份文件——它记录了每一部分内容的来源和授权状态。

## 一、A 组内容：来自上游仓库

**来源**：`https://github.com/guminghao-avi/innovation-styles`

包含：`src/`、`scripts/`、`fonts/`、`tests/`、`references/风格_01..19_*.md`、`references/工具选择.md`、`references/制作与验收.md`、`references/参考视频学习.md`、`references/叙事_历史接力.md`、`references/风格总览.png`、`projects/示例_*/`、`projects/参考_*/`、`package.json` / `package-lock.json` / `tsconfig.json` / `remotion.config.ts`、README 中的运行与验证记录。

**授权状态：上游仓库没有 LICENSE 文件。** 按 GitHub 的默认规则，这意味着"保留所有权利"——他人可以看到代码，但未被授予复制、修改或再分发的许可。

**因此，直接公开发布这个派生物存在法律风险。** 发布前需要三选一：

1. **取得上游作者授权**（最稳妥）。给 `guminghao-avi` 发 issue 或邮件，说明派生关系和发布意图，拿到书面同意后再推。
2. **只发布 B 组自有内容**。把 `references/风格_20..34_*.md`、`references/Opus55提示词库.md`、`references/工程规范.md`、`projects/B组风格图鉴/` 抽出来单独建仓，README 里写"依赖上游 innovation-styles 的 Remotion 工程，请另行克隆"。这样不复制上游代码，风险最低。
3. **在 GitHub 上 Fork**。Fork 是 GitHub 平台功能，不等于获得许可证；上游随时可以要求下架。适合个人备份，不适合当作"自己的开源项目"运营。

## 二、B 组内容：本仓库自有

以下为本仓库新增，作者为 `videotypes` 维护者：

- `references/风格_20..34_*.md`（15 套风格的视觉规格、技术方案、坑）
- `references/Opus55提示词库.md`（15 条提示词的整理与补全）
- `references/工程规范.md`（工程底座/视觉系统/音频/叙事/多模型兼容/交付）
- `projects/B组风格图鉴/`（`Main.tsx`、`demos.tsx`，60 秒 15 段风格演示）
- `SKILL.md` / `README.md` / `references/风格库.md` 中关于 B 组的增补

**其中提示词的原始出处不是本仓库**，见下。

## 三、提示词的原始出处

B 组 15 条提示词整理自抖音视频《Opus 5.5 热门视频制作风格大盘点（附提示词）》，作者 `@q.Rx`，链接 `https://v.douyin.com/4124GjC9ahY/`。

- 第 1、9 条的视频字幕存在 OCR 噪声，已按语义整理，字句可能与原提示词有出入。
- 第 10–15 条原视频只给出品类定义与核心逻辑，未附完整提示词；仓库里的版本是据核心逻辑补全的，不是原作者原文。
- 视频中的示例作品（《月亮睡不着》、popwise「One Dot」等）版权归原作者，**未随本仓库提供**，也不应被复制。

引用这些提示词做个人学习和内部使用没有问题；若要公开发布，建议在 README 里保留来源链接与作者署名。

## 四、字体

`fonts/` 下的字体均附带开源许可证，见 `fonts/LICENSES.md` 与 `fonts/licenses/`：

- Noto Sans SC / Noto Serif SC：SIL Open Font License 1.1
- EB Garamond：SIL OFL 1.1
- IBM Plex Mono：SIL OFL 1.1
- Smiley Sans（得意黑）：SIL OFL 1.1
- Space Grotesk：SIL OFL 1.1
- Fusion Pixel 12（缝合像素字体）：SIL OFL 1.1

OFL 允许随作品再分发，保留许可证与声明即可。`references/风格总览.png` 是实渲产物，其内容涉及 A 组各风格的画面，随 A 组一同受上游权利约束。

## 五、HUD 地图数据

`src/styles/hud/` 的地图组件使用 Natural Earth 1:110m 数据（公共领域），使用条款见 <https://www.naturalearthdata.com/about/terms-of-use/>。

## 六、发布前检查清单

- [ ] 确认上游授权方式（第一节三选一）
- [ ] 若选方案 2，删除所有上游文件并验证 `npm run check` 仍能对自有项目通过
- [ ] README 的安装段落改为与授权方式一致
- [ ] 补一个本仓库的 LICENSE（B 组自有内容用什么许可证，由维护者决定）
- [ ] 配置 git 身份：`git config user.name` / `git config user.email`
- [ ] 确认不含 `node_modules/`、`.venv/`、`.tmp/`、`projects/*/stills/`、`projects/*/chunks/`、`*.mp4`（`.gitignore` 已排除，推送前再确认一次）
