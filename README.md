# Brain Rush（头脑冲刺）

> 60 秒口算训练 + 英语单词反应小游戏。答案从天上掉下来——接对得分，躲开错误，冲高分。

![Brain Rush 截图](screenshot.png)

**[brainrush.run](https://brainrush.run)** · 免费，纯前端，数据只存本地浏览器 · *[English](README.en.md)*

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 生产构建（含类型检查 + 测试）
```

## 怎么玩

题目显示在顶部，多个答案方块从空中掉落。控制底部角色左右移动，接住正确答案得分，碰到错误答案扣血。

- **操作**：键盘 ← → 或 A / D，移动端拖拽
- **结束条件**：血量归零（漏题或答错均扣 1 点）
- **60 秒计时模式**：无限命 + 更快节奏，适合短局刷分

| 难度 | 血量 | 特点 |
| --- | --- | --- |
| Easy | 4 | 速度慢、题目基础，适合入门 |
| Normal | 3 | 默认模式，兼顾反应与口算 |
| Hard | 2 | 更快、选项更多、题目更难 |
| Devil | 1 | 一次失误即结束 |

## 两种模式

### 数学冲刺

加减乘除。菜单内可同屏调节：

- **题型倾向**：随机混合 / 偏向加减 / 偏向乘除
- **数值范围**：随机 / 十以内 / 二十以内 / 五十以上
- **开关**：是否允许余数、是否允许负数
- **快捷模板**：均衡 · 20 内加减 · 乘除专项 · 余数除法 · 负数挑战

### 单词冲刺

英译中、中译英、句子填空。菜单内可调节出题方向和是否出现完形填空。

词库本地维护（`data/vocab.ts` + `data/cloze.ts`），离线可用，不依赖外部 API。难度分层控制取词池，高难度出现更多候选和完形题。

## 像素角色

8 种纯 Canvas 2D 手绘的像素角色，通过游戏分数逐步解锁：

| 分数 | 角色 | 头部 | 身体 | 腿部 |
| --- | --- | --- | --- | --- |
| 0 | Runner 冲刺 | 😄 | 🎽 | 👟 |
| 8 | Ninja 忍者 | 🥷 | 🥋 | 🥾 |
| 16 | Skater 滑板 | 😎 | 🧥 | 🛹 |
| 24 | Robot 机器人 | 🤖 | 🔋 | 🦿 |
| 32 | Astronaut 宇航员 | 👩‍🚀 | 🛰️ | 🥾 |
| 40 | Scientist 科学家 | 🧠 | 🥼 | 🧪 |
| 50 | Hero 英雄 | 🦸 | ⚡ | 🥾 |
| 65 | Boss | 😈 | 🛡️ | 🔥 |

> 角色绘制合约 → [pixel-character-spec.md](docs/pixel-character-spec.md)

## 数据

所有数据存储在浏览器 `localStorage`：分学科最高分、错题本、60 秒成绩记录、角色外观、题目偏好。不登录，不上传，可导出。

## 技术栈

React 19 · TypeScript · Vite · Tailwind CSS · Canvas 2D · animejs · Web Audio API

部署在 Cloudflare Pages，GitHub push 即上线。

---

文档 · [像素角色 spec](docs/pixel-character-spec.md) · [开发日志](docs/progress.md)
