# Excel JSON Viewer

一个基于 Vue 3 的 Excel 文件解析和 JSON 数据可视化工具。支持移动端和深色模式。

## 在线演示

- GitHub Pages: [Excel JSON Viewer](https://zhongs.github.io/excel-reader/)
- Vercel: [Excel JSON Viewer on Vercel](https://excel-reader.vercel.app)
- Netlify: [Excel JSON Viewer on Netlify](https://excel-reader.netlify.app)

## 功能特点

- 📊 Excel 文件解析（支持 .xlsx, .xls 格式）
- 🔄 多文件管理
- 📝 JSON 数据可视化
- 📋 一键复制 JSON 数据
- 💾 本地存储历史记录
- 🎨 现代化的用户界面
- 📱 完整的移动端支持
- 🌓 深色模式支持
- 🔍 自适应布局
- 📲 PWA 支持
- 🚀 多平台部署支持

## 技术栈

- Vue 3 - 渐进式 JavaScript 框架
- Vite - 下一代前端构建工具
- XLSX.js - Excel 文件处理库
- 现代 CSS - Flexbox & Grid
- 响应式设计 - 移动优先
- PWA - 渐进式 Web 应用

## 本地开发

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装

```bash
# 克隆项目
git clone https://github.com/zhongs/excel-reader.git

# 进入项目目录
cd excel-reader

# 安装依赖
npm install
```

### 开发

```bash
# 启动开发服务器
npm run dev
```

### 构建

```bash
# 构建生产版本
npm run build
```

## 部署

### GitHub Pages

```bash
# 部署到 GitHub Pages
npm run deploy
```

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzhongs%2Fexcel-reader)

1. 点击上方按钮
2. 使用 GitHub 账号登录
3. 按照提示完成部署

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/zhongs/excel-reader)

1. 点击上方按钮
2. 使用 GitHub 账号登录
3. 按照提示完成部署

### Cloudflare Pages

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com)
2. 连接你的 GitHub 账号
3. 选择 excel-reader 仓库
4. 开始部署

## 使用说明

1. 点击"Upload Excel"按钮选择 Excel 文件
2. 文件会自动解析并显示在右侧 JSON 查看器中
3. 可以点击复制按钮复制 JSON 数据
4. 历史记录会自动保存在本地

### 移动端使用

- 支持触摸操作和手势
- 自适应屏幕大小
- 横屏模式优化
- 支持添加到主屏幕

### 深色模式

- 自动跟随系统主题
- 优化的深色配色方案
- 降低夜间使用时的眼疲劳

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge
- 移动端浏览器

## 注意事项

- 支持的文件格式：.xlsx, .xls
- 大文件可能需要较长处理时间
- 建议使用现代浏览器以获得最佳体验
- 移动端建议使用 WiFi 网络上传大文件

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (git checkout -b feature/AmazingFeature)
3. 提交你的改动 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 打开一个 Pull Request

## License

[MIT](LICENSE)

## 作者

[zhongs](https://github.com/zhongs)
