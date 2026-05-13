# 光影博客 · LightShadow-Blog

基于 TMDB API 的跨端电影发现与记录小程序，支持 **H5 网页** 和 **微信小程序**。

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite" />
  <img src="https://img.shields.io/badge/uni--app-3.0-2B9939" />
  <img src="https://img.shields.io/badge/Pinia-2.1-F7D336" />
</p>

---

## 功能

### 电影发现
- **Hero Banner** — 精选热门电影轮播，圆角卡片 + 渐变信息叠加
- **热映 / 待映 / Top 250** — Tab 切换浏览，横向滚动海报卡片
- **分类排行** — 12 种电影类型 + 情色分类，每种按评分降序排列的独立排行榜
- **搜索** — 实时搜素 TMDB 电影库，搜索历史本地持久化

### 电影详情
- **背景大图** + 海报浮层，渐变遮罩过渡
- **TMDB 评分** 大号数字展示 + 星级可视化
- **剧情简介** 可展开/收起，剧照画廊，演职员表横向滚动
- **想看 / 看过** 状态标记，本地持久化 + 云端同步

### 个人中心
- **微信一键登录**，获取头像昵称
- **片单管理** — 看过 / 想看双列表，支持标记切换
- **观影报告** — Canvas 可视化图表（片长分布、评分分布、月度统计、高分 TOP 10）
- **统计摘要** — 已看部数 / 平均评分 / 总观影时长

### 设计
- **浅色清新风格** — 白色卡片 + 轻微阴影，粉色系强调色 (#FF6B6B)
- **左图右文卡片布局** — 电影海报 + 评分 + 类型 + 操作按钮
- **Canvas 图表** — 评分分布柱状图、月度观影趋势、片长占比图

---

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | uni-app 3.0 (Vue 3 Composition API) |
| 构建 | Vite 5 + @dcloudio/vite-plugin-uni |
| 状态管理 | Pinia 2 |
| 样式 | SCSS + rpx 响应式单位 |
| 类型 | TypeScript 5 |
| HTTP | uni.request (跨端统一) |
| 图表 | Canvas 2D API |
| 数据源 | [TMDB API](https://developer.themoviedb.org/) |
| 目标平台 | H5 网页 · 微信小程序 |

---

## 项目结构

```
movie-blog/
├── index.html                 # Vite H5 入口
├── vite.config.ts             # Vite + SCSS 全局注入
├── .env                       # API Key / Mock 开关 / CDN 域名
├── package.json
├── cloudfunctions/            # 微信云函数
│   ├── tmdbProxy/             # TMDB API 代理
│   └── getUserMovies/         # 用户片单同步
└── src/
    ├── main.ts                # 应用入口
    ├── App.vue                # 根组件
    ├── pages.json             # 路由 · TabBar · 全局样式
    ├── manifest.json          # 平台配置
    ├── api/
    │   ├── tmdb.ts            # TMDB API 封装 + 请求类
    │   └── mock.ts            # Mock 数据 (5部示例)
    ├── stores/
    │   ├── movie.ts           # 电影状态 (列表/详情/搜索/分类)
    │   └── user.ts            # 用户状态 (登录/片单/统计)
    ├── pages/
    │   ├── index/             # 首页 (5区布局)
    │   ├── movie-detail/      # 电影详情
    │   ├── search/            # 搜索页
    │   ├── profile/           # 个人中心
    │   └── report/            # 观影报告 (Canvas 图表)
    ├── components/            # MovieCard / StarRating / Skeleton / SwiperImages
    ├── styles/                # 设计令牌 + 全局样式
    ├── types/                 # TypeScript 类型
    └── utils/                 # 图片工具 / 缓存 / Canvas 工具
```

---

## 快速开始

### 环境要求
- Node.js ≥ 18
- 微信开发者工具（小程序调试用）

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/somnium-123/LightShoadw-Blog.git
cd movie-blog

# 安装依赖
npm install

# H5 网页开发
npm run dev:h5          # → http://localhost:5173

# 微信小程序开发
npm run dev:mp-weixin   # 持续编译到 dist/dev/mp-weixin
# 微信开发者工具 → 导入 → 选择 dist/dev/mp-weixin 目录
# 开发阶段勾选「不校验合法域名」
```

### 配置 TMDB API

在 `.env` 文件中设置：

```env
VITE_TMDB_API_KEY=你的TMDB_API_Key
VITE_TMDB_BASE_URL=https://api.tmdb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://images.tmdb.org/t/p
VITE_USE_MOCK=false
```

> **国内用户注意**：使用 `api.tmdb.org` 和 `images.tmdb.org` 替代 `api.themoviedb.org`。

---

## 页面布局

首页采用 5 区单列滚动布局：

```
┌─────────────────────────────┐
│  Nav Bar (深色渐变 + 标题)    │
├─────────────────────────────┤
│  Banner Swiper (圆角轮播)    │
├─────────────────────────────┤
│  Service Grid (2×2 入口)    │
│  ┌──────────┬──────────┐    │
│  │ 我的想看  │ 我的看过  │    │
│  ├──────────┼──────────┤    │
│  │ 观影报告  │ 影评专区  │    │
│  └──────────┴──────────┘    │
├─────────────────────────────┤
│  Filter Bar (Tab + 搜索)    │
├─────────────────────────────┤
│  Movie List (左图右文卡片)   │
├─────────────────────────────┤
│  TabBar (首页 / 我的)        │
└─────────────────────────────┘
```

---

## 开发笔记

- **跨端 HTTP**：统一使用 `uni.request`，避免 `fetch` 在小程序中不可用
- **Mock 数据**：`.env` 中 `VITE_USE_MOCK=true` 启用内置 mock，无需 API Key
- **Vue API 导入**：`ref` / `computed` 从 `vue` 导入，生命周期从 `@dcloudio/uni-app` 导入
- **TabBar 页面**：微信小程序规定必须在主包 `pages` 数组中，不能放 `subPackages`
- **Canvas 2D**：小程序端使用 `type="2d"` 通过 `uni.createSelectorQuery()` 获取节点
- **图片 CDN**：国内使用 `images.tmdb.org`（复数形式）替代 `image.tmdb.org`

---

## License

MIT
