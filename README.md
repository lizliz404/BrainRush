# Brain Rush（头脑冲刺）

> 60 秒口算训练 + 英语单词反应小游戏。接对答案，躲开错误，冲高分。

![Brain Rush 截图](screenshot.png)

**[brainrush.run](https://brainrush.run)** — 免费，纯前端，数据只存本地浏览器。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 生产构建
```

## 怎么玩

题目显示在顶部，答案方块从空中掉下来。控制底部角色左右移动——接住正确答案得分，碰到错误答案扣血。

- 键盘 ← → 或 A / D，移动端拖拽
- 四种难度：Easy / Normal / Hard / Devil（1-4 条命）
- 60 秒计时模式：无限命 + 更快节奏，适合短局刷分

## 模式

**数学冲刺** — 加减乘除，可调节题型倾向、数值范围、是否允许余数/负数。

**单词冲刺** — 英译中 / 中译英 / 句子填空，可调节方向与完形填空开关。词库本地维护（`data/vocab.ts` + `data/cloze.ts`），不依赖外部 API。

## 角色

8 种像素角色，纯 Canvas 2D 手绘，通过分数逐步解锁：Runner → Ninja → Skater → Robot → Astronaut → Scientist → Hero → Boss。

详见：[像素角色绘制合约](docs/pixel-character-spec.md)

## 数据

所有数据存储在浏览器 `localStorage`：最高分、错题本、60 秒成绩记录、角色外观、题目偏好。不登录，不上传。

## 技术栈

React 19 · TypeScript · Vite · Tailwind CSS · Canvas 2D · animejs · Web Audio API

## 部署

Cloudflare Pages，GitHub 仓库 push 即部署。

---

**[反馈 / 建议](https://brainrush.run)** · [开发日志](docs/progress.md)
