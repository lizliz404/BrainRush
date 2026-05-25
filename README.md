# Brain Rush（头脑冲刺）

> 一个面向小学生的网页训练小游戏，当前包含数学与英语单词两种模式。  
> 可以把它理解为 **"飞机大战 / 躲避接物 × 小学算术训练"**：题目显示在上方，多个答案方块从空中落下，玩家控制底部角色左右移动，接住正确答案、避开错误答案。

## 项目简介

Brain Rush 的目标不是把练习册简单搬到屏幕上，而是把基础口算训练包装成一个反馈快速、节奏明确、容易上手的小游戏。

适合的使用场景包括：

- 寒假 / 暑假期间的轻量练习。
- 家长陪练时的短时互动。
- 课堂外的加减乘除反应训练。

当前版本支持：

- 中英文界面切换。
- 多档难度选择：Easy / Normal / Hard / Devil。
- 血量机制：答错或漏题会扣除 1 点血量，不同难度拥有不同初始血量。
- 菜单内同屏题目调节：可指定题型倾向、数值范围、是否允许余数、是否允许负数。
- 题目调节面板内置快捷模板，减少逐项配置步骤。
- 60 秒计时模式（固定普通题目 + 无限命 + 困难档下落速度），适合短局刷分。
- **Word Speedrun（单词极速跑）** 分支：中英互选 + 句子填空，并支持方向与是否出现填空的调节。
- 角色外观自定义与分数解锁（像素角色系统，见下方）。
- 本地保存分学科最高分、错题本、60 秒历史成绩和角色外观。

## 核心玩法

1. 进入主菜单后选择难度。
2. 开始游戏后，顶部会显示一道算术题。
3. 屏幕上方会掉落多个写有答案的方块。
4. 玩家通过键盘方向键、A / D，或鼠标 / 手指拖动控制角色左右移动。
5. 接到正确答案会加分并进入下一题。
6. 接错答案或漏掉题目会扣除 1 点血量；血量归零后游戏结束。

## 难度设计

| 难度 | 初始血量 | 设计特点 |
| --- | --- | --- |
| Easy | 4 | 方块速度较慢，题目范围更基础，适合入门体验 |
| Normal | 3 | 默认模式，兼顾反应与口算 |
| Hard | 2 | 方块更快、选项更多、题目更复杂 |
| Devil | 1 | 地狱模式，容错极低，速度和题目复杂度最高 |

## 题目调节

除了常规难度外，菜单中还支持"同屏调节"题目生成参数，无需像更衣室一样切换到全屏页面：

- **题型倾向**：随机混合 / 偏向加减 / 偏向乘除
- **数值范围**：随机范围 / 十以内 / 二十以内 / 五十以上
- **额外开关**：是否允许余数 / 是否允许负数
- **快捷模板**：均衡模式 / 20 内加减 / 乘除专项 / 余数除法 / 负数挑战

这使得 Brain Rush 不再只是"随分数升难"，而是可以更主动地贴近某一轮练习目标。

## Word Speedrun 玩法说明

Word Speedrun 复用同一套"题面 + 下落选项 + 接正确答案"的核心机制，把数学题替换为英语学习题：

- 英文单词 → 选择正确中文
- 中文释义 → 选择正确英文
- 句子挖空 → 选择合适单词补全

当前版本支持在菜单中调节：

- 是否出现句子填空
- 出题方向：双向混合 / 英译中 / 中译英

Word 模式当前也会响应难度选择，但侧重点与数学不同：

- Easy / Normal / Hard / Devil 会影响可抽取的词汇池层级。
- 难度越高，候选项更多，完形填空出现频率也更高。
- 完形题优先使用题目自带干扰项；若数量不足，会从全局词库补齐最低选项数，避免题面退化。

### 词库与句库的数据策略

为了成本可控、离线可用、避免依赖外部 API，当前采用**本地文件词库**方案：

- 词条与句子在仓库内维护（`data/vocab.ts` + `data/cloze.ts`），可审查、可迭代。
- 不消耗 AI token，不引入在线服务不稳定风险。
- 后续可按教材版本/年级拆分为多个 JSON 文件，按需加载。

## 像素角色系统

Brain Rush 使用纯 Canvas 2D 绘制的像素风格角色，支持 8 种外观，通过游戏分数逐步解锁。

### 角色列表

| 分数 | 角色 | 头部 | 身体 | 腿部 |
| --- | --- | --- | --- | --- |
| 0 | Runner（冲刺） | 😄 | 🎽 | 👟 |
| 8 | Ninja（忍者） | 🥷 | 🥋 | 🥾 |
| 16 | Skater（滑板） | 😎 | 🧥 | 🛹 |
| 24 | Robot（机器人） | 🤖 | 🔋 | 🦿 |
| 32 | Astronaut（宇航员） | 👩‍🚀 | 🛰️ | 🥾 |
| 40 | Scientist（科学家） | 🧠 | 🥼 | 🧪 |
| 50 | Hero（英雄） | 🦸 | ⚡ | 🥾 |
| 65 | Boss | 😈 | 🛡️ | 🔥 |

### 绘制合约

角色绘制由 `components/pixelPlayer.ts` 实现，核心接口：

```typescript
drawPixelPlayer(ctx: CanvasRenderingContext2D, {
  x: number,        // 角色中心 X
  y: number,        // 角色中心 Y
  size: number,     // 角色整体尺寸
  avatar: AvatarConfig,  // { head: string, body: string, legs: string }
  mood?: 'idle' | 'happy' | 'hurt' | 'miss',
  timeMs?: number,  // 用于开心时动画弹跳
}): void
```

绘制在 17×20 左右的网格上，每个格子大小 = `size / 18`。角色的不同部位（头、身体、腿、披风、面部表情）通过 `gridRect()` 按坐标硬编码绘制，配色由 emoji 驱动的调色板系统决定。

详细的设计合约、坐标系统说明、以及如何让另一个 AI 绘制更好像素角色的指南，见 `docs/pixel-character-spec.md`。

## 技术栈

- **前端框架**：React 19
- **语言**：TypeScript
- **构建工具**：Vite 6
- **界面样式**：Tailwind CSS（CDN）
- **图标**：lucide-react + @heroicons/react
- **游戏渲染**：HTML5 Canvas
- **动画**：animejs（粒子特效）
- **音效**：Web Audio API
- **数据存储**：浏览器 `localStorage`
- **部署**：Cloudflare Pages

## 项目结构

```text
BrainRush/
├── .github/workflows/build.yml       # CI workflow
├── components/
│   ├── BrainRushLogoIcon.tsx          # Brain Rush 图标组件
│   ├── GameEngine.tsx                 # Canvas 游戏循环、碰撞检测、输入处理
│   ├── PepWordsLogoIcon.tsx           # PEP Words 跨产品链接图标
│   ├── PixelPlayerPreview.tsx         # 更衣室角色预览
│   └── pixelPlayer.ts                # 像素角色 Canvas 绘制引擎
├── data/
│   ├── cloze.ts                       # 句子填空题库
│   ├── vocab.ts                       # 英语词库（EN ↔ ZH）
│   └── vocabMeta.ts                   # 词汇元数据 / 难度分层
├── docs/
│   ├── pixel-character-spec.md        # 像素角色绘制合约 spec
│   └── progress.md                    # 开发日志
├── functions/api/feedback.ts          # Cloudflare Pages Function（反馈提交 API）
├── public/                            # 静态资源（直接 serve 到 /）
│   ├── brain-rush-icon.svg
│   ├── brain-rush-social.png
│   ├── brain-rush-social.svg
│   ├── brand-assets/
│   │   ├── brain-rush-icon-v1.svg
│   │   ├── brain-rush-icon-v2.svg
│   │   └── brain-rush-icon-v3.svg
│   ├── pep-words-logo.svg
│   ├── robots.txt
│   ├── sitemap.xml
│   └── wechat-qr.png
├── scripts/
│   ├── test-math-service.ts
│   └── test-word-service.ts
├── services/
│   ├── audioService.ts                # Web Audio API 音效
│   ├── mathService.ts                 # 数学题生成
│   └── wordService.ts                 # Word Speedrun 题目生成
├── utils/random.ts                    # Fisher-Yates 洗牌、随机抽取
├── App.tsx                            # 主应用：菜单、HUD、换装、语言切换、持久化
├── index.tsx                          # React 入口
├── index.html                         # HTML 模板 + Tailwind CDN 配置
├── types.ts                           # TypeScript 类型与枚举定义
├── metadata.json                      # Cloudflare Pages 项目元数据
├── cloudflare-pages.d.ts              # CF Pages 类型声明
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 架构说明

### `App.tsx`

负责管理整个应用的界面状态，包括：主菜单、游戏中 HUD、Game Over 界面、换装界面、语言切换、最高分与外观数据持久化、粒子特效（confetti）、反馈弹窗、故事弹窗。

### `components/GameEngine.tsx`

游戏核心：

- 使用 Canvas 绘制角色、方块和特效。
- 使用 `requestAnimationFrame` 驱动游戏循环。
- 处理键盘、鼠标、触摸输入。
- 负责碰撞检测、分数更新、血量扣减、题目切换和结束判定。
- 调用 `pixelPlayer.ts` 的 `drawPixelPlayer()` 绘制玩家角色。

### `components/pixelPlayer.ts`

像素角色绘制引擎（详见 `docs/pixel-character-spec.md`）：

- 纯 Canvas 2D 函数，不依赖 React。
- 支持 8 种角色外观（由 emoji 驱动的调色板 + 特殊造型）。
- 支持 4 种心情状态（idle / happy / hurt / miss）。
- 通过指定角色中心坐标和尺寸即可原地绘制。

### `services/mathService.ts`

负责按照当前分数和难度生成题目，包括：加法、减法、乘法、更高难度下的整除题。同时控制选项数量与干扰项范围。

### `services/wordService.ts`

负责 Word Speedrun 题目生成，包括：英译中、中译英、句子填空三种题型。按难度分层筛选词库，选项不足时从全局词库兜底补齐。

### `services/audioService.ts`

通过 Web Audio API 生成简单即时音效：答对时的正反馈音、答错或失误时的错误提示音。主菜单 BGM 已关闭。

## 状态流与页面切换

- `App.tsx` 统一管理 `MENU / PLAYING / GAME_OVER / CUSTOMIZE` 状态，避免多处状态源冲突。
- 游戏层始终挂载，菜单与结算作为覆盖层（overlay）显示，切换更顺滑。
- 数学和单词模式分别记录最高分；角色外观与题目调节参数通过 `localStorage` 持久化。

## 游戏循环与性能

- 使用 `requestAnimationFrame` 驱动主循环，`deltaTime` 限幅，减少切后台后瞬时跳帧问题。
- 输入层兼容键盘、鼠标拖动、触摸移动，移动逻辑统一为百分比坐标，适配不同分辨率。
- Canvas 绘制时按设备像素比（DPR）处理，兼顾清晰度与性能。

## 题目系统

- `mathService.ts` 根据难度和实时调节参数生成题目。
- 干扰项与正确答案同屏生成，保证"可玩性"优先。
- `wordService.ts` 采用 `filter + shuffle + slice` 的稳定出题策略，完形题使用题目专属同类干扰项。
- 随机工具统一使用 Fisher-Yates 洗牌（`utils/random.ts`）。

## 音频策略

- 游戏内保留即时音效（成功/失败），反馈短促，避免干扰思考。
- 主菜单 BGM 已禁用，避免在训练前就造成噪音负担。

## 数据持久化

当前版本使用 `localStorage` 保存以下内容：

- `brainRushHighScore_MATH` / `brainRushHighScore_WORD`：分学科最高分
- `brainRushAvatar`：当前角色外观配置
- `brainRushTuning`：数学模式的题目调节参数
- `brainRushWordTuning`：单词模式调节参数
- `brainRushMistakes_MATH` / `brainRushMistakes_WORD`：分学科错题本
- `brainRushTimedRuns_MATH` / `brainRushTimedRuns_WORD`：分学科 60 秒本地历史成绩

## 本地开发

### 环境要求

- Node.js 18+
- npm

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认启动后可在 `http://localhost:3000` 访问 Vite 开发服务器。

### 运行测试

```bash
npm test
```

### 类型检查

```bash
npm run check
```

### 生产构建

```bash
npm run build
```

构建输出到 `dist/`，可直接部署到 Cloudflare Pages。

## 后续可扩展方向

- 增加按年级 / 知识点划分的题库。
- 增加家长 / 老师视角的数据面板。
- 增加连续登录、任务制、关卡制等长期激励机制。
- 增加更丰富的角色、特效与音效反馈。

## Status

Usable prototype. Maintained.

## License

No license specified yet.
