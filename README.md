# Excel JSON Viewer

一个基于 Vue 3 的 Excel 文件解析和 JSON 数据可视化工具。

## 在线演示

访问 [Excel JSON Viewer](https://zhongs.github.io/excel-reader/) 查看在线演示。

## 功能特点

- 📊 Excel 文件解析（支持 .xlsx, .xls 格式）
- 🔄 多文件管理
- 📝 JSON 数据可视化
- 📋 一键复制 JSON 数据
- 💾 本地存储历史记录
- 🎨 现代化的用户界面
- 📱 响应式设计

## 技术栈

- Vue 3
- Vite
- XLSX.js
- 现代 CSS

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

### 部署

```bash
# 部署到 GitHub Pages
npm run deploy
```

## 使用说明

1. 点击"Upload Excel"按钮选择 Excel 文件
2. 文件会自动解析并显示在右侧 JSON 查看器中
3. 可以点击复制按钮复制 JSON 数据
4. 历史记录会自动保存在本地

## 注意事项

- 支持的文件格式：.xlsx, .xls
- 大文件可能需要较长处理时间
- 建议使用现代浏览器以获得最佳体验

## License

[MIT](LICENSE)

## 作者

[zhongs](https://github.com/zhongs)
