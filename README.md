# Excel JSON Viewer

一个基于 Vue 3 的 Excel 文件解析和 JSON 数据可视化工具。支持移动端和深色模式。

## 在线演示

访问以下任一链接体验：

- GitHub Pages: [Excel JSON Viewer](https://zhongs.github.io/excel-reader/)
- Vercel: [Excel JSON Viewer on Vercel](https://excel-json-viewer.vercel.app)
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
- 📤 数据导出
  - PDF 导出（自动分页）
  - CSV 导出（UTF-8 编码）
  - JSON 复制
  - 自定义序号列
  - 智能列宽调整
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
- **状态管理**: Pinia
- **构建工具**: Vite 4
- **数据处理**: 
  - XLSX.js (Excel)
  - jsPDF (PDF 导出)
  - PapaParse (CSV 导出)
  - html2canvas (PDF 渲染)
- **UI 设计**: 
  - Flexbox & Grid
  - CSS 变量
  - Media Queries
- **开发工具**: 
  - TypeScript
  - ESLint

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/zhongs/excel-reader.git

# 进入项目目录
cd excel-reader

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📖 使用说明

1. **文件上传**
   - 点击上传按钮或拖拽文件到指定区域
   - 支持多文件同时上传
   - 自动保存上传历史

2. **数据查看**
   - JSON 格式化显示
   - 支持折叠/展开节点
   - 自动语法高亮

3. **数据导出**
   - PDF 导出：生成美观的表格 PDF，支持自动分页和页码
   - CSV 导出：导出为 UTF-8 编码的 CSV 文件，支持特殊字符
   - JSON 复制：一键复制格式化后的 JSON 数据

4. **主题切换**
   - 点击右上角主题按钮切换
   - 自动跟随系统主题
   - 支持自定义主题色

## 📝 更新日志

### v1.2.0 (最新)
- ✨ 新增 PDF 导出功能
  - 支持自动分页
  - 添加页码显示
  - 优化表格布局
- 🔄 改进 CSV 导出
  - 添加 UTF-8 BOM 标记
  - 优化特殊字符处理
- 🎨 UI 优化
  - 更新按钮样式
  - 优化移动端布局

### v1.1.0
- 🚀 添加文件历史记录
- 💄 深色模式支持
- 🔧 性能优化

### v1.0.0
- 🎉 首次发布
- 📊 基础 Excel 解析
- 📝 JSON 查看器

## 📄 许可证

[MIT](LICENSE)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 👥 贡献者

感谢所有贡献者的付出！

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- Issue: [GitHub Issues](https://github.com/zhongs/excel-reader/issues)
- Email: your.email@example.com
