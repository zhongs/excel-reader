# Excel JSON Viewer

一个基于 Vue 3 的 Excel 文件解析和 JSON 数据可视化工具。支持移动端和深色模式。

## 在线演示

访问以下任一链接体验：

- GitHub Pages: [Excel JSON Viewer](https://zhongs.github.io/excel-reader/)
- Vercel: [Excel JSON Viewer on Vercel](https://excel-reader-junjweqqr-191492580-qqcoms-projects.vercel.app/)
- Netlify: [Excel JSON Viewer on Netlify](https://excel-reader.netlify.app)

## ✨ 功能特点

- 📊 Excel 文件解析
  - 支持 .xlsx, .xls 格式
  - 自动检测文件编码
  - 智能表头识别
- 🔄 文件管理
  - 多文件批量上传
  - 文件预览
  - 历史记录
- 📝 数据可视化
  - JSON 格式化展示
  - 树形结构展示
  - 表格视图
- 📱 移动端优化
  - 响应式设计
  - 触摸友好界面
  - 自适应布局
- 🎨 主题定制
  - 深色模式支持
  - 自动跟随系统
  - 主题色定制
- 🚀 性能优化
  - 懒加载
  - 虚拟滚动
  - 代码分割

## 🛠️ 技术栈

- **前端框架**: Vue 3
- **构建工具**: Vite 4
- **Excel 处理**: XLSX.js
- **UI 设计**: 
  - Flexbox & Grid
  - CSS 变量
  - Media Queries
- **开发工具**: 
  - TypeScript
  - ESLint
  - Prettier

## 🚀 快速开始

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

# 预览构建结果
npm run preview
```

## 📦 部署

### GitHub Pages

```bash
# 部署到 GitHub Pages
npm run deploy
```

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzhongs%2Fexcel-reader)

1. Fork 本仓库
2. 访问 [Vercel](https://vercel.com)
3. 导入你的仓库
4. 等待自动部署

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/zhongs/excel-reader)

1. Fork 本仓库
2. 访问 [Netlify](https://netlify.com)
3. 导入你的仓库
4. 等待自动部署

### Cloudflare Pages

1. Fork 本仓库
2. 访问 [Cloudflare Pages](https://pages.cloudflare.com)
3. 导入你的仓库
4. 配置构建命令：`npm run build`
5. 配置构建输出目录：`dist`

## 📱 移动端使用

1. 文件上传
   - 点击上传按钮或拖放文件
   - 支持相机拍照Excel文件
   - 支持从其他应用分享

2. 数据查看
   - 左右滑动切换文件
   - 双指缩放调整视图
   - 长按复制内容

3. 深色模式
   - 在系统设置中切换
   - 或使用应用内的主题开关

## 🔧 配置说明

### vite.config.js

```js
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

### vercel.json

```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

## 📝 更新日志

### v1.0.0

- ✨ 初始版本发布
- 🎉 基础功能实现

### v1.1.0

- 🌟 添加移动端支持
- 🎨 添加深色模式
- 🚀 性能优化

### v1.2.0

- 📱 移动端体验优化
- 🔧 多平台部署支持
- 🎯 代码重构

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支
3. 提交你的更改
4. 推送到分支
5. 创建 Pull Request

## 📄 开源协议

[MIT](LICENSE)

## 🙏 鸣谢

- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [XLSX.js](https://sheetjs.com/)
