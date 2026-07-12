# Redesign V1

目标：在不破坏现有球员数据库、比较逻辑、每日挑战、好友挑战和统计能力的前提下，重构大厅、竞技页与结算页，使产品更适合移动端，降低横向表格和多层信息造成的复杂感。

## 第一阶段范围

1. LobbyScreen：单屏聚焦“开始今日挑战”，其他模式降级为弱入口。
2. GameArena：纵向单屏结构，保留搜索、猜测、提示、认输与历史记录。
3. LatestGuessCard：最新猜测结果作为主视觉，基础属性常驻，硬核属性折叠。
4. GuessHistory：历史猜测改为折叠列表，避免移动端横向表格。
5. ResultSheet：轻量结算、分享、再来一局。
6. Theme/System：保留深浅色与声音设置，并统一视觉变量。

## 组件计划

- `src/components/redesign/AppShell.tsx`
- `src/components/redesign/LobbyScreen.tsx`
- `src/components/redesign/GameArena.tsx`
- `src/components/redesign/PlayerSearch.tsx`
- `src/components/redesign/LatestGuessCard.tsx`
- `src/components/redesign/GuessHistory.tsx`
- `src/components/redesign/AttributeGrid.tsx`
- `src/components/redesign/ResultSheet.tsx`
- `src/components/redesign/SettingsMenu.tsx`

## 设计原则

- 手机一屏优先，核心操作不依赖横向滚动。
- 最新一次猜测优先，历史信息折叠。
- 基础属性与专业装备属性分层。
- 正确、偏高、偏低、错误同时使用颜色、图形和方向表达。
- 动效只服务状态变化，避免霓虹、呼吸、弹跳同时叠加。
- 保留乒乓球的节奏感：击球声、球路和落点，不堆体育装饰。

## 不在第一阶段修改

- 球员数据库
- 每日球员算法
- 好友挑战编码
- 属性比较逻辑
- 本地统计结构
- 后端与部署方式
