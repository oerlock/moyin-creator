# Web 化可行性分析（moyin-creator）

## 结论（TL;DR）
- **可行，但不是“直接打包成 Web”级别**，需要分阶段重构。
- 当前项目是 **Electron + React** 架构，前端 UI/业务逻辑复用率高，但与桌面耦合的文件系统、本地协议和 IPC 能力需要后端服务替代。
- 建议按 **3 阶段**推进：
  1. 抽象平台能力层（DesktopAdapter / WebAdapter）；
  2. 落地 Web BFF（文件、导入导出、上传代理、任务编排）；
  3. 多租户与部署优化（对象存储、鉴权、配额、队列）。

## 当前架构与 Web 化影响

### 1) 渲染层本身具备 Web 基础
- 渲染端基于 React + TypeScript + Vite，具备在浏览器运行的基础条件。
- 但目前构建入口和运行方式默认是 Electron（`electron-vite dev` / `electron-vite preview`）。

### 2) 关键阻塞点：Electron 专属能力
以下能力当前依赖 Electron main/preload，Web 侧不能直接使用：
- IPC 桥接（`window.ipcRenderer`、`window.fileStorage`、`window.imageStorage`、`window.storageManager`、`window.appUpdater` 等）。
- 本地文件系统读写（项目数据 JSON、媒体文件、缓存清理）。
- 自定义协议（`local-image://`）与本地路径解析。
- 原生对话框（保存文件、选择目录）。

这些能力都需要改造成“浏览器 + 后端 API”模型。

## 模块级可迁移性评估

### A. 高可迁移（改动小）
- 大部分 UI 组件、面板交互、状态流转逻辑。
- 与 AI 接口交互的纯前端逻辑（在不依赖本地协议时）。

### B. 中可迁移（需要抽象）
- `fileStorage`/`indexed-db-storage` 相关：已有浏览器存储思想，但当前优先 Electron 文件存储，需要改为 Web 持久化策略（IndexedDB + Server Sync）。
- `cors-fetch`：开发期通过 Vite 中间件代理，生产 Web 需要正式网关/后端代理。

### C. 低可迁移（需重做后端）
- `local-image://` 全链路（保存、读取、base64 转换、绝对路径）。
- 数据目录迁移、导入导出、缓存管理、更新检查等桌面能力。

## 主要技术风险

1. **媒体资产体量大**
- 现桌面方案将图片/视频落本地目录；Web 需转对象存储（S3/R2/OSS）+ CDN。

2. **长任务与批量任务可靠性**
- 当前在本地环境执行与重试；Web 需队列系统（Redis + BullMQ/Cloud Tasks）及任务状态持久化。

3. **多用户隔离与安全**
- Desktop 默认单机单用户；Web 必须做用户/项目隔离、鉴权（JWT/Session）、配额与审计。

4. **CORS 与第三方 API Key 暴露**
- Web 端不可直接暴露供应商密钥；应改为服务端托管 key + 代理调用。

## 建议目标架构（Web）

- 前端：保留 React 代码主体，新增 `platform adapter`。
- 后端（BFF）：Node.js（Fastify/Nest/Express）提供：
  - 项目 CRUD、版本化存储
  - 媒体上传/签名 URL
  - 任务创建、查询、取消、重试
  - 第三方模型 API 代理
- 存储：
  - 元数据：PostgreSQL
  - 媒体：S3 兼容对象存储
  - 队列：Redis

## 迁移实施路线

### 阶段 0（1~2 周）：可运行最小 Web POC
- 新增 `web` 启动脚本与纯浏览器入口。
- 引入 `PlatformService` 接口，先做 `WebMockAdapter`。
- 目标：页面可打开、项目可在浏览器本地创建与编辑。

### 阶段 1（2~4 周）：能力抽象与替换
- 替换 `window.*` 直连调用为统一适配层。
- 将 `local-image://` 改为 `https://cdn/...` 或 `blob:` 过渡。
- 将导入导出改为浏览器下载/上传流程。

### 阶段 2（4~8 周）：后端化与生产可用
- 落地 BFF + 对象存储 + 队列。
- 接入鉴权、项目隔离、限流、日志与监控。
- 做增量迁移工具：导入现有 desktop 数据目录到云端。

## 粗略工作量评估
- **可用内测版（单用户/弱并发）**：6~10 周。
- **生产版（多用户/稳定队列/完整安全）**：10~16 周。

## 是否建议做
- 如果目标是“团队协作、跨设备访问、云端批量生产”，**强烈建议 Web 化**。
- 如果目标是“离线高性能、单人创作”，可继续保持桌面优先，并做“桌面 + 云同步”折中方案。

## 快速决策建议
- 先做 **2 周 Web POC** 验证三件事：
  1. 去 Electron 后核心流程是否通畅；
  2. 媒体上传/读取链路性能；
  3. 任务编排后端是否满足批量场景。
- 若验证通过，再进入完整迁移。

## 有没有“简单改造”？——有：走 Next.js 渐进式改造（推荐）

> 目标不是一次性把 Electron 全抹掉，而是先把“能在浏览器跑的部分”跑起来。

### 最简单可落地方案（MVP）
1. **保留现有 `src/` 业务与组件**，新建 `apps/web`（Next.js 15+）壳工程。
2. 增加 `platform` 抽象层：
   - `DesktopPlatform`：继续调用 `window.fileStorage / imageStorage`（旧逻辑）。
   - `WebPlatform`：改走 Next.js API Route（`/api/storage/*`、`/api/media/*`、`/api/tasks/*`）。
3. **先不做多租户**，先做单用户 token 或本地 session，快速验证核心流程。
4. `local-image://` 先用两步过渡：
   - 开发期：用 `blob:` + IndexedDB 临时存；
   - 联调期：改为对象存储 URL（S3/R2/OSS）。
5. 第三方模型调用统一改到 Next.js Server Route，避免前端泄露 API Key。

### 为什么 Next.js 是“简单路线”
- 你现在已经是 React + TS，UI 代码可复用。
- Next.js 同时给你前端页面和后端 API（BFF）能力，减少拆分仓库和跨域配置成本。
- 后续从单体 Next.js 可平滑拆到独立后端，不会浪费。

### 预计改造成本（仅 Next.js MVP）
- **2~4 周**：
  - 让“剧本 → 角色/场景 → 分镜”主链路在浏览器可跑通；
  - 能上传/查看媒体；
  - 能发起并查看基础任务状态。
- **不包含**：企业级权限、复杂队列容灾、完整计费配额。

### 最小任务清单（按优先级）
- P0：平台抽象层 + 去 `window.*` 直连。
- P0：`local-image://` 替换为 `http(s)`/`blob` 可显示资源。
- P0：Next.js API 代理第三方模型请求（服务端保管 key）。
- P1：项目数据从 Electron 文件存储迁到 Postgres/SQLite + 对象存储。
- P1：任务状态轮询统一走 `/api/tasks/:id`。

### 什么时候不建议直接 Next.js？
- 如果你短期必须保留大量本地离线能力（无网可完整生产）。
- 如果你强依赖本地 FFmpeg/系统级硬件能力且不准备上云转码。

> 实操建议：先做一个 `next-mvp` 分支，2 周内只验证主流程，不做大而全。