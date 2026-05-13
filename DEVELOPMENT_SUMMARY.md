# MovieBlog 豆瓣电影博客小程序 — 开发总结

## 项目概述

基于 **uni-app (Vue 3 + Vite + Pinia)** 的跨端电影浏览应用，支持 **H5 网页** 和 **微信小程序** 双平台运行。数据源为 [TMDB API](https://www.themoviedb.org/)，提供热映、待映、Top250 电影浏览、搜索、详情查看、个人片单管理等功能。

---

## 功能实现

### 1. 首页 — 电影发现

**实现方式：**

- **Hero Banner**：使用 uni-app `<swiper>` 组件，读取 `store.popular` 前 6 部电影作为轮播素材。自定义指示器（金色短线），配合 `@change` 事件同步当前索引
- **分类 Tab**：热映 / 待映 / Top250 三个切换，通过 `activeTab` ref 控制条件渲染。切换时按需触发数据请求，避免无效调用
- **横向滚动海报列**：`<scroll-view scroll-x>` 包裹 `<MovieCard>` 组件，`white-space: nowrap` + `inline-flex` 实现，隐藏滚动条
- **Top250 排行榜**：竖向列表，前 3 名使用金色渐变排名标识，4-10 名银色，其余灰色
- **分页加载**：Top250 支持"加载更多"，`store.loadMoreTopRated()` 累加 `page` 参数并将结果 `push` 到数组

**关键代码路径：**
```
src/pages/index/index.vue → src/stores/movie.ts → src/api/tmdb.ts → TMDB API
```

### 2. 电影详情

**实现方式：**

- **背景大图**：460rpx 高度 backdrop + 底部渐变遮罩过渡到纯黑背景
- **海报浮层**：`margin-top: -140rpx` 使海报卡片与背景重叠，大圆角 + 强阴影制造层次感
- **评分展示**：72rpx 大号评分数字（Georgia 衬线字体）+ StarRating 星级组件
- **剧情简介**：默认 4 行截断，超过 120 字显示"展开全文"按钮
- **剧照画廊**：<SwiperImages> 水平滚动，支持点击预览
- **演职员表**：水平滚动圆形头像列表
- **相似推荐**：底部横向滚动电影卡片

### 3. 搜索功能

**实现方式：**

- 搜索框支持 `@confirm` 触发搜索和 `@input` 实时检测清空
- 搜索历史通过 `utils/cache.ts` 持久化到本地存储（`uni.setStorageSync`）
- 热门搜索关键词硬编码为快捷标签
- 结果列表包含海报、标题、评分、年份、简介摘要

### 4. 个人中心

**实现方式：**

- **微信登录**：`uni.login()` 获取临时 code → `uni.getUserInfo()` 获取昵称头像 → 存入 Pinia + 本地存储
- **片单管理**："看过"/"想看"两个 Tab 切换，支持标记、取消、切换状态
- **统计数据**：看过数量、想看数量、平均评分、总观影时长
- 片单数据本地优先存储，云端同步为后台容错

### 5. 状态管理 (Pinia)

**movie 模块** (`stores/movie.ts`)：管理热映/热门/待映/Top250 列表、电影详情、搜索结果，封装 loading/error 状态

**user 模块** (`stores/user.ts`)：用户登录信息、片单 CRUD、观影统计，本地存储 + 云端同步双写策略

### 6. 数据层

**请求封装** (`api/tmdb.ts`)：
- `Request` 类：封装 `uni.request`，支持请求拦截（注入 token）、响应拦截（401 处理）、超时重试、防重复请求
- `tmdbApi`：TMDB 全部端点封装（电影列表、详情、演职员、剧照、搜索）
- `cloudApi`：云函数接口（用户片单同步）

**图片工具** (`utils/helpers.ts`)：封装 `getPosterUrl` / `getBackdropUrl` / `getProfileUrl`，统一处理 TMDB 图片 CDN 地址拼接和占位图兜底

---

## 遇到的问题与解决方案

### 问题 1：页面无法打开 — 缺少 index.html

**现象**：`npm run dev:h5` 后浏览器访问返回 404

**原因**：uni-app 3.x 使用 Vite 作为构建工具，H5 模式需要项目根目录下的 `index.html` 作为入口。项目源码中缺失此文件。

**解决**：创建 `/index.html`，包含 `<div id="app">` 挂载点和 `<script type="module" src="/src/main.ts">` 入口引用。uni-app Vite 插件会自动注入框架运行时和 HMR 客户端。

---

### 问题 2：Module Export Error — computed/ref 导入错误

**现象**：浏览器控制台报错 `The requested module '@dcloudio/uni-app' does not provide an export named 'computed'`

**原因**：`pages/index/index.vue` 和 `pages/movie-detail/index.vue` 中 `ref`、`computed` 从 `@dcloudio/uni-app` 导入。**H5 模式下**，`@dcloudio/uni-app` 不重新导出 Vue 的响应式 API，只有 `onLoad` 等生命周期钩子。

**解决**：将 `ref`、`computed` 改为从 `vue` 导入，`onLoad` 保留从 `@dcloudio/uni-app` 导入：
```ts
// ❌ 错误
import { ref, computed, onLoad } from '@dcloudio/uni-app'

// ✅ 正确
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
```

---

### 问题 3：TMDB API 请求超时

**现象**：H5 页面数据加载失败，Network 面板显示请求超时

**原因**：TMDB 主域名 `api.themoviedb.org` 在国内被 DNS 污染，无法直接访问

**解决过程**：
1. 测试发现 `api.tmdb.org`（不带 `the`）可以正常访问（HTTP 200，1s 响应）
2. 测试 `images.tmdb.org`（图片 CDN）也可访问，但 `image.tmdb.org`（单数）不行
3. 将 `.env` 中 `VITE_TMDB_BASE_URL` 改为 `https://api.tmdb.org/3`，`VITE_TMDB_IMAGE_BASE_URL` 改为 `https://images.tmdb.org/t/p`

**经验**：对于面向国内用户的应用，需要预先验证所有外部 API 域名在国内的可访问性，避免直接使用默认域名。

---

### 问题 4：微信小程序模拟数据模式

**现象**：微信开发者工具中请求超时或无数据

**原因**：微信小程序有严格的**服务器域名白名单**机制。即使设置了可访问的 `api.tmdb.org`，也需要在微信公众平台后台将其加入 **request 合法域名**列表。且开发阶段需要在开发者工具中勾选"不校验合法域名"。

**解决**：提供 Mock 数据切换机制。在 `.env` 中设置 `VITE_USE_MOCK=true` 启用内置 Mock 数据（5 部示例电影），开发阶段可完全不依赖网络。

编译时通过 `import.meta.env.VITE_USE_MOCK` 判断：
```ts
if (useMock) {
  return import('./mock').then((m) => m.getMockData(endpoint))
}
// 否则发起真实 API 请求
```

真实数据部署步骤：
1. 在微信公众平台 → 开发管理 → 服务器域名 → 添加 `api.tmdb.org` 到 request 合法域名
2. 添加 `images.tmdb.org` 到 downloadFile 合法域名
3. 设置 `VITE_USE_MOCK=false` 后重新编译

---

### 问题 5：Tab 页面分包错误

**现象**：`app.json: ["tabBar"]["list"][1]["pagePath"]: "pages/profile/index" need in ["pages"]`

**原因**：微信小程序规定 **tabBar 页面必须在主包 `pages` 数组中**，不能放在 `subPackages` 分包里。原始配置将 `pages/profile/index` 放在了 subPackages 中。

**解决**：将 `pages/profile/index` 从 `subPackages` 移至主 `pages` 数组：
```json
{
  "pages": [
    "pages/index/index",
    "pages/profile/index"   // ← 移到主包
  ],
  "subPackages": [
    { "root": "pages/movie-detail", "pages": ["index"] },
    { "root": "pages/search", "pages": ["index"] }
  ]
}
```

---

### 问题 6：Tab 图标缺失

**现象**：`["tabBar"]["list"][0]["iconPath"]: "static/images/tab-home.png" 未找到`

**原因**：`pages.json` 中配置的 4 个 tabBar 图标文件在 `src/static/images/` 下不存在，且编译时未被复制到 `dist/build/mp-weixin/`。

**解决**：使用 Python 生成 40x40px 圆形 PNG 图标（灰色未选中态 / 金色选中态），放置在 `src/static/images/` 并在每次编译后同步到 `dist/build/mp-weixin/static/images/`。

---

### 问题 7：Banner 图片拉伸与画质差

**现象**：首页 Banner 图片横向拉伸严重，画面模糊

**原因**：
- 图片尺寸使用了 `w780`（780px 宽），在 Retina 屏幕上偏小
- `mode="aspectFill"` 裁剪模式导致图片被放大填充
- swiper 容器高度 340rpx 过矮，与电影 backdrop（16:9）比例不匹配
- `?format=webp` 参数在 `images.tmdb.org` CDN 上可能降低质量

**解决**：
- 图片尺寸改为 `original`（原图）
- 模式改为 `aspectFit`（完整显示不裁剪）
- 容器高度增至 420rpx（接近 16:9）
- 移除 `?format=webp` 参数
- 深色背景填充图片两侧空白

---

### 问题 8：登录报错 `login is not a function`

**现象**：点击登录按钮报错 `TypeError: a.login is not a function`

**原因**：`stores/user.ts` 中定义了 `setUserInfo` 和 `logout`，但没有实现 `login()` 方法。Profile 页面的 `handleLogin()` 直接调用了一个不存在的方法。

**解决**：在 `useUserStore` 中添加完整的 `login` 函数：
1. `uni.login()` 获取微信临时 code
2. `uni.getUserInfo()` 获取用户昵称和头像
3. 构建 `UserInfo` 对象并写入 Pinia state + 本地 Storage
4. 失败时使用默认值兜底，保证不阻断用户流程

---

### 问题 9：fetch API 在微信小程序中不可用

**现象**：小程序环境报错 `fetch is not defined`

**原因**：H5 模式下引入的 `fetch` + `AbortController` 超时控制方案在微信小程序 JS 运行时不受支持。小程序仅支持 `wx.request`（即 uni-app 的 `uni.request`）。

**解决**：TMDB 请求统一使用 `uni.request`，它是 uni-app 的跨端 HTTP API，在 H5 端映射为 `XMLHttpRequest`，在小程序端映射为 `wx.request`：
```ts
return new Promise<T>((resolve, reject) => {
  uni.request({
    url,
    method: 'GET',
    timeout: 20000,
    success: (res) => res.statusCode === 200 ? resolve(res.data) : reject(...),
    fail: (err) => reject(new Error(err.errMsg || '请求超时')),
  })
})
```

---

## UI/UX 设计 — Cinematic Luxe

### 设计系统

| 要素 | 决策 |
|------|------|
| 主色调 | 深黑 `#0a0a0c` + 暖金 `#d4a853` 强调 |
| 字体 | 评分/标题使用 Georgia 衬线体，正文使用系统无衬线体 |
| 圆角体系 | 4rpx(标签) ~ 9999rpx(胶囊按钮)，大面积用 14-20rpx |
| 阴影层级 | 卡片投影 → 海报强阴影 → 金色辉光 |
| 质感 | 玻璃态透明层 (`rgba + backdrop-filter`)、光泽反射叠加 (`::after`) |
| 动画 | 淡入上移 (`fadeIn`)、shimmer 骨架屏、胶囊按钮弹性缩放 |

### 关键视觉细节

- **Hero Banner**：大标题 + "FEATURED" 标签 + 评分/年份元信息，底部渐变过渡到黑色
- **Tab 导航**：胶囊选中态（金色背景 + 黑色文字 + 辉光阴影）
- **Top250 排名**：前三名金色渐变圆形标识，4-10 名银色
- **海报卡片**：光泽反射层 (`card-shine`)、玻璃态评分徽章、hover 缩放反馈
- **详情页**：背景海报 + 多层渐变遮罩、浮动海报卡片 (`-140rpx` 偏移)、大号衬线评分
- **骨架屏**：shimmer 流动动画，复用海报尺寸

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | uni-app 3.0 (Vue 3 + Composition API) |
| 构建 | Vite 5 + @dcloudio/vite-plugin-uni |
| 状态管理 | Pinia 2 |
| 样式 | SCSS + CSS Variables + rpx 响应式单位 |
| 类型 | TypeScript 5 |
| HTTP | uni.request (跨端统一 API) |
| 数据源 | TMDB API (api.tmdb.org) |
| 目标平台 | H5 网页 / 微信小程序 (mp-weixin) |

---

## 项目结构

```
movie-blog/
├── index.html              # Vite H5 入口
├── vite.config.ts          # Vite 配置 + SCSS 全局注入
├── tsconfig.json
├── .env                    # 环境变量 (API key / URL / mock 开关)
├── package.json
├── cloudfunctions/         # 微信云函数
│   ├── tmdbProxy/          # TMDB API 代理
│   └── getUserMovies/      # 用户片单
└── src/
    ├── main.ts             # 应用入口
    ├── App.vue             # 根组件
    ├── pages.json          # 路由 + TabBar + 全局样式
    ├── manifest.json       # 平台配置
    ├── api/
    │   ├── tmdb.ts         # TMDB API 封装 + 请求类
    │   └── mock.ts         # Mock 数据
    ├── stores/
    │   ├── movie.ts        # 电影状态管理
    │   └── user.ts         # 用户状态管理
    ├── pages/
    │   ├── index/          # 首页
    │   ├── movie-detail/   # 电影详情
    │   ├── search/         # 搜索
    │   └── profile/        # 个人中心
    ├── components/         # 可复用组件
    ├── composables/        # 组合式函数
    ├── styles/             # 全局样式 + 设计令牌
    ├── types/              # TypeScript 类型定义
    └── utils/              # 工具函数 + 缓存
```

---

## 开发命令

```bash
# H5 网页开发
npm run dev:h5          # 启动开发服务器 (默认 localhost:5173)

# 微信小程序开发
npm run dev:mp-weixin   # 持续编译到 dist/dev/mp-weixin
npm run build:mp-weixin # 生产构建到 dist/build/mp-weixin

# 代码检查
npm run lint            # ESLint
npm run format          # Prettier
```

**微信小程序运行步骤：**
1. `npm run build:mp-weixin`（或 `dev:mp-weixin` 持续编译）
2. 微信开发者工具 → 导入 → 选择 `dist/build/mp-weixin` 目录
3. 开发阶段勾选「不校验合法域名」
4. 生产部署需在微信后台添加 API 域名白名单
