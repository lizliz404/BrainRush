# Progress Log

## 2026-03-26

- 完成时间：2026-03-26 (UTC)
- 实现了哪些功能：
  - 在主菜单新增“Math Rush / Word Speedrun”学科切换入口，Word 模式可直接开玩。
  - 新增 `wordService.ts`，实现三类题型随机：英文选中文、中文选英文、句子填空。
  - `GameEngine` 接入学科模式，按模式切换题目生成器而不改核心下落碰撞逻辑。
  - README 增加 Word Speedrun 玩法与本地词库数据策略说明。
- 遇到了哪些问题：
  - 原引擎直接耦合数学题生成函数，无法无痛扩展新题型。
  - 菜单存在“调参页仅数学有效”的交互差异，需避免 Word 模式出现无效参数入口。
- 如何解决的：
  - 给 `GameEngine` 增加 `subjectMode`，内部按模式调用 `mathService` 或 `wordService`。
  - 在菜单中仅对数学模式展示调参模块；Word 模式展示玩法说明卡片，避免误导。

## 2026-03-26（Word Speedrun 纠偏）

- 完成时间：2026-03-26 (UTC)
- 实现了哪些功能：
  - 将 Word 数据与逻辑解耦：新增 `data/vocab.ts`、`data/cloze.ts`、`utils/random.ts`。
  - 重写 `services/wordService.ts` 的出题逻辑，改为 `filter + shuffle + slice`，杜绝原 `while` 补选项的死循环风险。
  - 为完形填空增加“题目专属同类干扰项”，不再从全局词库随机抽离谱选项。
  - 统一改为 Fisher-Yates 洗牌，替换 `sort(() => Math.random() - 0.5)`。
- 遇到了哪些问题：
  - 原实现把完形干扰项和词汇干扰项混用，导致题目质量不稳定。
  - 词库不足时原补选项逻辑会出现无限循环隐患。
- 如何解决的：
  - 在 `types.ts` 增加 `ClozeItem.distractors` 类型约束，保证完形题天然可控。
  - 在 `wordService` 中对候选池先过滤再截断，池子不够时按现有数量返回，不再阻塞循环。
