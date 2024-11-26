<template>
  <div class="data-view">
    <div class="toolbar">
      <button @click="copyJSON">复制 JSON</button>
      <button @click="exportCSV">导出 CSV</button>
      <button @click="exportPDF">导出 PDF</button>
    </div>
    <div class="json-viewer">
      <pre>{{ fileStore.selectedFile?.content }}</pre>
    </div>
  </div>
</template>

<script>
import { useFileStore } from '../stores/fileStore';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';

export default {
  name: 'DataView',
  setup() {
    const fileStore = useFileStore();

    const copyJSON = async () => {
      if (!fileStore.selectedFile?.content) return;
      
      try {
        await navigator.clipboard.writeText(fileStore.selectedFile.content);
        alert('JSON 已复制到剪贴板');
      } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请重试');
      }
    };

    const exportCSV = () => {
      if (!fileStore.selectedFile?.rawData) {
        alert('没有可导出的数据');
        return;
      }

      try {
        // 尝试解析数据
        let data = fileStore.selectedFile.rawData;
        
        // 如果数据是字符串，尝试解析它
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            console.error('数据解析失败:', e);
            alert('数据格式错误，无法导出');
            return;
          }
        }

        // 确保数据是数组
        if (!Array.isArray(data)) {
          data = [data];
        }

        // 使用 Papa Parse 转换为 CSV，添加配置以处理特殊字符
        const csv = Papa.unparse(data, {
          quotes: true,      // 给所有字段加引号
          header: true,      // 包含表头
          encoding: "utf-8", // 使用 UTF-8 编码
          skipEmptyLines: true // 跳过空行
        });

        // 添加 BOM 标记以支持中文
        const csvContent = "\ufeff" + csv;
        
        // 创建 Blob 对象
        const blob = new Blob([csvContent], { 
          type: 'text/csv;charset=utf-8;' 
        });

        // 生成文件名
        const fileName = fileStore.selectedFile.name.replace(/\.[^/.]+$/, "") + '.csv';
        
        // 保存文件
        saveAs(blob, fileName);
      } catch (error) {
        console.error('导出 CSV 失败:', error);
        alert('导出 CSV 失败: ' + (error.message || '请重试'));
      }
    };

    const exportPDF = () => {
      if (!fileStore.selectedFile?.content) {
        alert('没有可导出的数据');
        return;
      }

      try {
        const doc = new jsPDF();
        
        // 设置中文字体
        doc.setFont('courier', 'normal');
        
        // 获取格式化的 JSON 字符串
        let content = fileStore.selectedFile.content;
        if (typeof content !== 'string') {
          content = JSON.stringify(content, null, 2);
        }
        
        // 分行处理
        const lines = content.split('\n');
        let y = 10;
        const fontSize = 10;
        doc.setFontSize(fontSize);
        
        lines.forEach(line => {
          if (y > 280) { // 如果接近页面底部，添加新页
            doc.addPage();
            y = 10;
          }
          doc.text(line, 10, y);
          y += fontSize * 0.5;
        });
        
        // 生成文件名
        const fileName = fileStore.selectedFile.name.replace(/\.[^/.]+$/, "") + '.pdf';
        doc.save(fileName);
      } catch (error) {
        console.error('导出 PDF 失败:', error);
        alert('导出 PDF 失败: ' + (error.message || '请重试'));
      }
    };

    return {
      fileStore,
      copyJSON,
      exportCSV,
      exportPDF
    };
  }
};
</script>

<style scoped>
.data-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.toolbar button {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toolbar button:hover {
  background: #45a049;
}

.json-viewer {
  flex: 1;
  overflow: auto;
  background: white;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.json-viewer pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
