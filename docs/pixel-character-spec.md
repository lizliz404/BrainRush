# Pixel Character Spec — Brain Rush

> 把这份文档发给另一个 AI，它就能理解并画出更好的像素小人。

## 1. 你的任务

替换或改进 `components/pixelPlayer.ts` 中的像素角色绘制逻辑，让角色**更好看、更生动、更有辨识度**。

你可以自由改变：
- 绘制风格（更多细节、更大网格、不同像素密度）
- 配色方案
- 动画效果（行走、跳跃、受伤等）
- 每个角色的独特造型

你必须遵守的约束（见第 2 节）：
- 保持相同的函数签名和接口
- 只画在传入的 Canvas 2D 上下文上
- 不引入新的运行时依赖（除非已在 `package.json` 中）

## 2. 绘制合约（不可变）

### 核心函数

```typescript
export const drawPixelPlayer = (
  ctx: CanvasRenderingContext2D,
  options: DrawPixelPlayerOptions,
) => void
```

### 参数类型

```typescript
interface DrawPixelPlayerOptions {
  x: number;        // 角色中心 X 坐标（Canvas 像素坐标）
  y: number;        // 角色中心 Y 坐标（Canvas 像素坐标）
  size: number;     // 角色整体尺寸（像素），用于缩放
  avatar: AvatarConfig;  // 角色外观配置
  mood?: PlayerMood;     // 心情 / 状态（默认 'idle'）
  timeMs?: number;       // 当前时间戳（毫秒），用于动画
}

interface AvatarConfig {
  head: string;  // emoji 字符，如 '😄' '🤖' '🥷'
  body: string;  // emoji 字符，如 '🎽' '🔋' '🛡️'
  legs: string;  // emoji 字符，如 '👟' '🛹' '🔥'
}

type PlayerMood = 'idle' | 'happy' | 'hurt' | 'miss';
```

### 调用方行为（你不改的部分）

`GameEngine.tsx` 在每帧调用：

```typescript
// 游戏中实时绘制
drawPixelPlayer(ctx, {
  x: playerCenterX,
  y: playerCenterY,
  size: playerSize,
  avatar: currentAvatar,
  mood: currentMood,      // 答对时 'happy'，受伤时 'hurt'，漏题时 'miss'
  timeMs: performance.now()
});
```

`PixelPlayerPreview.tsx` 在更衣室预览中调用：

```typescript
// 静态预览（固定 'happy' 表情）
drawPixelPlayer(ctx, {
  x: size / 2,
  y: size * 0.58,
  size: size * 0.72,
  avatar,
  mood: 'happy',
  timeMs: performance.now()
});
```

### 重要提示

- `ctx` 已经被设置了 `imageSmoothingEnabled = false`（像素风格），坐标系已经过 DPR 缩放。
- 绘制前 `ctx` 处于干净状态；绘制后不需要 restore —— 调用方会处理。
- 角色中心 `(x, y)` 是参考点，你可以自由选择绘制的偏移量。
- `size` 用于等比缩放。当前实现用 `unit = max(2, round(size / 18))` 来定义单个像素格子的尺寸。
- `timeMs` 用于开心时的弹跳动画。参数名已经说明了含义。
- **不要修改 `AvatarConfig` 和 `PlayerMood` 的类型定义**（它们在 `types.ts` 中，被多个文件引用）。

## 3. 当前实现说明（供参考）

### 绘制逻辑

当前实现在一个 **17×20 左右的虚拟网格**上绘制，每个格子的像素大小 = `size / 18`（最小 2px）。

角色包含以下部分（按绘制顺序，后者覆盖前者）：
1. 地面阴影（椭圆）
2. 披风（如果配色有 cape 色）
3. 腿 + 鞋
4. 身体（含领口高光、英雄徽章等）
5. 脖子 + 头 + 头发
6. 特殊造型（忍者面罩、机器人天线、宇航员头盔、Boss 角）
7. 面部表情（根据 mood 变化）

### 配色系统

配色由 emoji 驱动的调色板系统决定：

```typescript
type PlayerPalette = {
  suit: string;   // 身体主色
  trim: string;   // 身体边框 / 裤子色
  skin: string;   // 肤色
  hair: string;   // 发色
  shoe: string;   // 鞋子色
  accent: string; // 强调色（领口、特效）
  cape?: string;  // 可选披风色
};
```

默认配色（Runner 角色）：
- suit: `#22d3ee`（青色）
- trim: `#0f172a`（深蓝黑）
- skin: `#f8c8a4`（肤色）
- hair: `#1f2937`（深灰）
- shoe: `#e2e8f0`（浅灰）
- accent: `#facc15`（金色）

每个角色的 emoji 组合会覆盖部分颜色。例如：
- 🥷 忍者：skin → `#111827`（黑色面罩）
- 🤖 机器人：skin → `#cbd5e1`（金属灰），有天线特效
- 👩‍🚀 宇航员：hair → `#7c2d12`（棕色），有白色头盔框
- ⚡ 英雄：有金色披风 + 胸口徽章

### 心情状态

- `idle`：正常表情，小圆眼 + 横线嘴
- `happy`：正常眼 + 弧线笑嘴 + 弹跳动画 + 头顶金色星星
- `hurt`：X 眼（红色）+ 向下弧线嘴 + 下蹲
- `miss`：大圆眼 + 大张嘴巴 + 蓝色泪滴

### 文件结构

```
components/pixelPlayer.ts    ← 你要改的文件（当前 202 行）
types.ts                     ← AvatarConfig / PlayerMood 类型定义（不要改）
components/GameEngine.tsx    ← 游戏中使用 drawPixelPlayer
components/PixelPlayerPreview.tsx ← 更衣室预览中使用
```

## 4. 全量角色配置（8 种）

| 分数 | 名称 | head | body | legs | 当前特殊造型 |
| --- | --- | --- | --- | --- | --- |
| 0 | Runner | 😄 | 🎽 | 👟 | 无（默认） |
| 8 | Ninja | 🥷 | 🥋 | 👟→🥾 | 黑色面罩覆盖脸和头发 |
| 16 | Skater | 😎 | 🧥 | 👟→🛹 | 墨镜效果（通过配色） |
| 24 | Robot | 🤖 | 🔋 | 👟→🦿 | 金属灰肤色、天线、胸口电量指示 |
| 32 | Astronaut | 👩‍🚀 | 🛰️ | 👟→🥾 | 白色头盔框 |
| 40 | Scientist | 🧠 | 🥼 | 👟→🧪 | 白大褂边框 |
| 50 | Hero | 🦸 | ⚡ | 👟→🥾 | 红色披风 + 胸口闪电徽章 |
| 65 | Boss | 😈 | 🛡️ | 👟→🔥 | 紫色肤色 + 红色恶魔角 |

> 注意：Runner 是默认角色，其他 7 种通过分数解锁。`App.tsx` 中 `UNLOCKABLE_SETS` 定义了解锁规则。

## 5. 改进方向建议

当前角色的已知弱点（你可以针对性改进）：

1. **网格分辨率太低** — 17×20 的网格让角色非常像素化、缺乏细节。可以考虑提升到 32×32 或更高。
2. **角色间差异不够明显** — 特殊造型改动太小（几条线、换个色），除了机器人和宇航员，其他角色远看几乎一样。
3. **动画太简陋** — 只有一个弹跳效果。可以加：行走帧、跳跃帧、受伤闪烁、变身动画。
4. **面部表情太抽象** — 基于 1px 格子的表情难以辨认。高分辨率网格可以解决。
5. **配色对比度不够** — 部分角色在深色游戏背景上不够突出。
6. **没有粒子 / 特效** — 答对时角色周围的 confetti 在 `App.tsx` 里，角色本身不产生特效。

你可以做的改进：

- 提升网格分辨率（如 32×40 或更高），保持像素风格但细节更多。
- 为每个角色设计完全不同的造型（不只是换色 + 几条线）。
- 增加行走 / 跳跃 / 受伤的逐帧动画。
- 利用 `timeMs` 实现更丰富的动画（呼吸、眨眼、Idle 动画）。
- 输出多种表情：胜利、惊讶、思考、蓄力等。
- 加入角色自身的粒子特效（火花、残影、拖尾）。

## 6. 如何交付

1. 阅读当前 `components/pixelPlayer.ts` 了解完整实现。
2. 重写该文件，保持相同的导出接口。
3. 运行 `npm run check` 确保类型正确。
4. 运行 `npm run build` 确保构建通过。
5. 如果改了 `types.ts`，需要在 PR 中明确说明原因。

## 7. 约束和边界

**可以做：**
- 重写 `pixelPlayer.ts` 的任意内部实现
- 增加新的内部类型和辅助函数
- 修改配色方案
- 增加更多 mood 状态（需同步更新 `PlayerMood` 类型）
- 更密集的网格、更多绘制细节

**不要做：**
- 引入新的 npm 依赖（除非在 PR 中说明必要性）
- 修改 `App.tsx`、`GameEngine.tsx`、`PixelPlayerPreview.tsx`
- 修改 `types.ts` 中的 `AvatarConfig` 字段（head/body/legs）
- 引入图片、spritesheet 等外部资源文件
- 破坏现有的角色解锁机制（分数对应的 emoji 组合不能改）
