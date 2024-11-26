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
import html2canvas from 'html2canvas';
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

    const exportPDF = async () => {
      if (!fileStore.selectedFile?.rawData) {
        alert('没有可导出的数据');
        return;
      }

      try {
        // 创建临时表格元素
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '1500px'; // 设置更大的宽度
        tempDiv.style.background = 'white';
        tempDiv.style.padding = '20px';
        document.body.appendChild(tempDiv);

        // 获取数据
        let data = fileStore.selectedFile.rawData;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (!Array.isArray(data)) {
          data = [data];
        }

        // 创建表格HTML
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontFamily = 'Arial, sans-serif';
        table.style.fontSize = '12px';

        // 添加标题
        const titleRow = document.createElement('div');
        titleRow.style.fontSize = '18px';
        titleRow.style.fontWeight = 'bold';
        titleRow.style.marginBottom = '15px';
        titleRow.textContent = fileStore.selectedFile.name;
        tempDiv.appendChild(titleRow);

        // 添加表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // 添加序号列头
        const indexTh = document.createElement('th');
        indexTh.textContent = '序号';
        indexTh.style.backgroundColor = '#4CAF50';
        indexTh.style.color = 'white';
        indexTh.style.padding = '8px';
        indexTh.style.border = '1px solid #ddd';
        indexTh.style.textAlign = 'center';
        indexTh.style.width = '60px';
        headerRow.appendChild(indexTh);

        // 添加其他列头
        Object.keys(data[0]).forEach(key => {
          const th = document.createElement('th');
          th.textContent = key;
          th.style.backgroundColor = '#4CAF50';
          th.style.color = 'white';
          th.style.padding = '8px';
          th.style.border = '1px solid #ddd';
          th.style.textAlign = 'left';
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // 添加数据行
        const tbody = document.createElement('tbody');
        data.forEach((row, index) => {
          const tr = document.createElement('tr');
          tr.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : 'white';
          
          // 添加序号列
          const indexTd = document.createElement('td');
          indexTd.textContent = (index + 1).toString();
          indexTd.style.padding = '8px';
          indexTd.style.border = '1px solid #ddd';
          indexTd.style.textAlign = 'center';
          tr.appendChild(indexTd);

          // 添加数据列
          Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value === null || value === undefined ? '' : String(value);
            td.style.padding = '8px';
            td.style.border = '1px solid #ddd';
            td.style.maxWidth = '200px'; // 限制单元格最大宽度
            td.style.whiteSpace = 'normal'; // 允许文本换行
            td.style.wordBreak = 'break-word'; // 长单词换行
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tempDiv.appendChild(table);

        // 使用html2canvas捕获表格
        const canvas = await html2canvas(tempDiv, {
          scale: 1, // 降低缩放比例以适应更多内容
          backgroundColor: 'white',
          logging: false,
          width: 1500, // 设置与div相同的宽度
          height: tempDiv.offsetHeight,
          windowWidth: 1500,
          onclone: function(clonedDoc) {
            const clonedDiv = clonedDoc.querySelector('div');
            if (clonedDiv) {
              clonedDiv.style.position = 'relative';
              clonedDiv.style.left = '0';
            }
          }
        });

        // 移除临时元素
        document.body.removeChild(tempDiv);

        // 转换为PDF
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        // 计算PDF尺寸，确保整个表格可见
        const pdfWidth = 297; // A4 宽度（横向）
        const pdfHeight = 210; // A4 高度（横向）
        const ratio = canvas.height / canvas.width;
        const imgWidth = pdfWidth;
        const imgHeight = pdfWidth * ratio;

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        // 如果图片高度超过页面高度，调整宽度以适应
        if (imgHeight > pdfHeight) {
          const adjustedWidth = (pdfHeight / ratio);
          pdf.addImage(imgData, 'JPEG', (pdfWidth - adjustedWidth) / 2, 0, adjustedWidth, pdfHeight);
        } else {
          pdf.addImage(imgData, 'JPEG', 0, (pdfHeight - imgHeight) / 2, imgWidth, imgHeight);
        }

        // 保存文件
        const fileName = fileStore.selectedFile.name.replace(/\.[^/.]+$/, "") + '.pdf';
        pdf.save(fileName);
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
