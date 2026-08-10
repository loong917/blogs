# loong博客

基于 Astro Content Collections 构建的中文个人博客。项目以静态生成、长文阅读体验和低运行时开销为核心，提供文章归档、标签聚合、自定义 Markdown 排版与 Astro View Transitions 页面过渡。

## 技术栈

- Astro 4：静态页面生成与文件路由
- Astro Content Collections：文章数据校验与 Markdown 内容管理
- Rehype：构建阶段增强 Markdown 语义结构
- TypeScript：严格类型检查
- View Transitions：站内导航与共享元素过渡

## 项目结构

```text
src/
├─ components/       页面组件、文章卡片、分页、页头与页尾
├─ content/
│  ├─ blogs/         Markdown 文章
│  └─ config.ts      Content Collections 数据模型
├─ layouts/          全局文档结构、SEO 与基础样式
├─ pages/            首页、归档、文章详情与标签路由
├─ plugins/          Markdown Rehype 增强插件
├─ utils/            日期、摘要与文章数据工具
└─ middleware.ts     静态构建中间件
public/               图标、favicon 与 robots.txt
astro.config.mjs      Astro 与 Markdown 构建配置
```

## 本地开发

需要 Node.js 18.17 或更高版本。

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:4321`。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run check` | 执行 Astro 与 TypeScript 类型检查 |
| `npm run build` | 检查项目并生成生产文件 |
| `npm run preview` | 本地预览 `dist/` 生产产物 |

## 发布文章

在 `src/content/blogs/` 新建 Markdown 文件。文件名建议与文章 `id` 保持一致，例如 `2026081001.md`。

```yaml
---
id: 2026081001
title: 文章标题
date: 2026年8月10日
image: code.svg
tags:
  - Astro
  - 前端
summary: 可选摘要，用于列表和页面 SEO 描述
---
```

字段说明：

- `id`：必填且唯一，用于生成 `/blog/{id}` 地址
- `title`：文章标题
- `date`：中文日期文本
- `image`：位于 `public/` 的分类图标文件名
- `tags`：标签数组，用于生成标签聚合页
- `summary`：可选；未填写时从正文自动生成摘要

## Markdown 渲染

`src/plugins/rehype-journal.mjs` 在构建阶段处理 Markdown HTML，不向浏览器注入额外运行时代码。当前正文样式覆盖：

- 多级标题与段落层级
- 有序列表、无序列表和任务列表
- 行内代码与代码块
- 引用、提示块和分隔线
- 响应式表格与图片
- 自动识别并增强“参考”章节
- 链接、键盘按键与文本标记

调整 Markdown 结构识别时修改 Rehype 插件；调整视觉表现时修改 `src/pages/blog/[...slug].astro` 中的 `.journal-prose` 样式。

## 页面过渡

全局路由器由 `src/layouts/Layout.astro` 中的 `<ViewTransitions />` 启用：

- 页面根节点使用轻量淡入与位移动画
- 站点品牌通过 `site-brand` 在页面间连续过渡
- 文章卡片标题和图标使用文章 `id` 生成唯一过渡名称
- 从列表进入详情时，标题与图标平滑衔接到文章头部
- 浏览器不支持 View Transitions 时使用 Astro 的动画回退
- 系统开启“减少动态效果”时自动将动画缩短至接近即时完成

新增共享元素时，确保同一页面中的 `transition:name` 唯一，并在来源页面和目标页面使用相同名称。

## 响应式布局

项目采用移动优先的流式布局，不依赖设备型号，并覆盖常见的手机、平板与桌面视口：

- 全局间距使用 `clamp()` 和 `--page-gutter` 随视口连续缩放
- 主阅读区域限制为 `48.75rem`，宽屏下保持舒适行长
- `48rem` 以下收紧文章头部、卡片和正文间距
- `40rem` 以下调整页头、分页及文章列表布局
- `30rem` 以下优化长标题、正文行距、列表和触控区域
- `24rem` 以下为极窄手机重排参考文献、页尾和卡片日期，`22rem` 以下重排页头
- 使用 `env(safe-area-inset-*)` 兼容刘海屏与圆角屏安全区域
- 代码块和表格允许独立横向滚动，不造成整页溢出
- 字号、标题和间距使用流式尺寸适配平板横竖屏与高分辨率桌面

响应式断点集中定义在组件自身样式和 `src/layouts/Layout.astro` 中。新增组件时应优先使用弹性布局、网格布局和流式尺寸，避免按具体设备型号添加断点。

## SEO 与可访问性

- 每个页面输出独立标题、描述和 canonical URL
- 提供 Open Graph、Twitter Card、robots 和 favicon
- 页面包含跳转正文链接与明确的主内容锚点
- 导航使用 `aria-current` 标记当前栏目
- 保留键盘焦点样式并支持减少动态效果偏好

站点正式域名配置在 `astro.config.mjs` 和 `src/layouts/Layout.astro`。更换域名时需要同步修改两处。

## 构建与部署

```bash
npm run build
```

构建结果输出到 `dist/`，可直接部署到 Vercel、Netlify、Cloudflare Pages、GitHub Pages 或任意静态文件服务器。推荐部署流程仅执行：

```bash
npm ci
npm run build
```

发布前应确认：

1. `npm run check` 无错误和警告。
2. 所有文章 Frontmatter 通过 Content Collections 校验。
3. `public/` 中存在文章引用的图标。
4. Canonical 域名与实际生产域名一致。
5. 使用 `npm run preview` 检查桌面端、移动端和页面过渡效果。
