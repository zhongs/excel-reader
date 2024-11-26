<template>
  <div class="excel-reader">
    <div class="header">
      <h2 class="title">Excel Reader</h2>
    </div>

    <div class="main-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        Loading...
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="error">
        <i class="error-icon">⚠</i>
        Error: {{ error }}
      </div>

      <!-- 数据展示 -->
      <div v-else class="content">
        <div class="file-section">
          <div class="file-list-header">
            <!-- 文件上传区域 -->
            <div class="upload-section">
              <label 
                class="upload-label" 
                for="file-upload"
              >
                <i class="upload-icon">📁</i>
                Upload Excel
              </label>
              <input 
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                @change="handleFileUpload"
                class="hidden-input"
              >
            </div>
          </div>

          <div class="file-list">
            <div 
              v-for="file in files" 
              :key="file.id"
              class="file-item"
              :class="{ active: selectedFile && selectedFile.id === file.id }"
              @click="selectFile(file)"
            >
              <i class="file-icon">📄</i>
              <span class="file-name">{{ file.name }}</span>
              <button class="delete-button" @click.stop="deleteFile(file)">×</button>
            </div>
          </div>
        </div>

        <div class="json-section">
          <div class="json-header">
            <h3 class="current-file-name">{{ selectedFile ? selectedFile.name : '' }}</h3>
            <div class="action-buttons" v-if="selectedFile">
              <button @click="copyToClipboard" class="action-button">
                <i class="copy-icon">📋</i>
                Copy JSON
              </button>
              <button @click="exportToCSV" class="action-button">
                <i class="export-icon">📊</i>
                Export CSV
              </button>
              <button @click="exportToPDF" class="action-button">
                <i class="export-icon">📄</i>
                Export PDF
              </button>
            </div>
          </div>
          <div class="json-content" v-html="formatJSON(selectedFile ? selectedFile.content : '')"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import { readAllExcelFiles } from '../utils/excelReader';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';

export default {
  name: 'ExcelReader',
  setup() {
    const files = ref([]);
    const selectedFile = ref(null);
    const jsonContent = ref('');
    const loading = ref(false);
    const error = ref(null);

    const formatJSON = (jsonString) => {
      if (!jsonString) return '';
      
      try {
        const obj = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        const formatted = JSON.stringify(obj, null, 2);
        
        // 转义HTML字符
        const escaped = formatted
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        
        // 添加语法高亮和行号
        const highlighted = escaped
          .split('\n')
          .map((line, index) => {
            const lineNumber = `<span class="line-number">${index + 1}</span>`;
            
            // 保持原始缩进空格
            const spaces = line.match(/^\s*/)[0];
            const content = line.slice(spaces.length);
            
            // 处理行内容
            const lineContent = content
              .replace(/(".*?"):/g, '<span class="key">$1</span>:')
              .replace(/: (".*?")(,?)/g, ': <span class="string">$1</span>$2')
              .replace(/: (-?\d+\.?\d*)(,?)/g, ': <span class="number">$1</span>$2')
              .replace(/: (true|false|null)(,?)/g, ': <span class="boolean">$1</span>$2');
            
            // 使用 CSS 缩进，行号固定不缩进
            const indentSize = spaces.length;
            return `
              <div class="json-line">
                ${lineNumber}
                <span class="line-content" style="padding-left: ${indentSize * 10}px">
                  ${lineContent}
                </span>
              </div>`;
          })
          .join('');
        
        return highlighted;
      } catch (e) {
        return 'Invalid JSON';
      }
    };

    const loadHistory = () => {
      const history = localStorage.getItem('excelReaderHistory');
      if (history) {
        files.value = JSON.parse(history);
        // 如果有历史记录，自动选择第一个文件
        if (files.value.length > 0) {
          selectedFile.value = files.value[0];
          jsonContent.value = selectedFile.value.content;
        }
      }
    };

    const saveHistory = () => {
      localStorage.setItem('excelReaderHistory', JSON.stringify(files.value));
    };

    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {
          cellDates: true,
          cellNF: true,
          cellText: false
        });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 使用默认选项先获取数据
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,  // 使用格式化的值
          defval: null // 空单元格用null
        });

        // 处理数据，移除空字段和 __EMPTY 字段
        const processedData = rawData.map(row => {
          const newRow = {};
          Object.entries(row).forEach(([key, value]) => {
            // 跳过 __EMPTY 开头的字段和 null 值
            if (!key.startsWith('__EMPTY') && value !== null && value !== '') {
              // 如果是数字字符串，保持精度
              if (typeof value === 'string' && !isNaN(value)) {
                newRow[key] = Number(value);
              } else {
                newRow[key] = value;
              }
            }
          });
          return newRow;
        });

        // 创建新的文件记录
        const newFile = {
          id: Date.now(),
          name: file.name,
          uploadTime: new Date().toLocaleString(),
          content: JSON.stringify(processedData, null, 2)
        };

        // 添加到文件列表
        files.value.unshift(newFile);
        selectedFile.value = newFile;
        jsonContent.value = newFile.content;

        // 保存到localStorage
        saveHistory();
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file: ' + error.message);
      }

      // 清除input的value，允许重复上传同一个文件
      event.target.value = '';
    };

    const selectFile = (file) => {
      selectedFile.value = file;
      jsonContent.value = file.content;
    };

    const deleteFile = (fileToDelete) => {
      const index = files.value.findIndex(f => f.id === fileToDelete.id);
      if (index !== -1) {
        files.value.splice(index, 1);
        
        // 如果删除的是当前选中的文件，则选择新的文件
        if (selectedFile.value && selectedFile.value.id === fileToDelete.id) {
          if (files.value.length > 0) {
            selectFile(files.value[0]);
          } else {
            selectedFile.value = null;
            jsonContent.value = '';
          }
        }
        
        // 更新localStorage
        saveHistory();
      }
    };

    const copyToClipboard = async () => {
      try {
        if (selectedFile) {
          const jsonString = selectedFile.content;
          await navigator.clipboard.writeText(jsonString);
          // 可以添加一个临时提示，表示复制成功
          const button = document.querySelector('.copy-button');
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    const exportToCSV = () => {
      if (!selectedFile.value || !selectedFile.value.content) return;
      
      try {
        const jsonData = typeof selectedFile.value.content === 'string' 
          ? JSON.parse(selectedFile.value.content) 
          : selectedFile.value.content;

        // Convert JSON to CSV
        const csv = Papa.unparse(jsonData);
        
        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedFile.value.name.split('.')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        error.value = 'Failed to export CSV: ' + e.message;
      }
    };

    const exportToPDF = async () => {
      if (!selectedFile.value || !selectedFile.value.content) return;
      
      try {
        const jsonData = typeof selectedFile.value.content === 'string' 
          ? JSON.parse(selectedFile.value.content) 
          : selectedFile.value.content;

        // 创建临时表格元素
        const tempTable = document.createElement('div');
        tempTable.style.position = 'absolute';
        tempTable.style.left = '-9999px';
        tempTable.style.top = '-9999px';
        document.body.appendChild(tempTable);

        // 创建表格HTML
        const headers = Object.keys(jsonData[0] || {});
        const tableHTML = `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="margin-bottom: 20px;">${selectedFile.value.name}</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #4285f4; color: white;">
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: center; width: 50px;">序号</th>
                  ${headers.map(header => `<th style="padding: 12px; border: 1px solid #ddd; text-align: left;">${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${jsonData.map((row, index) => `
                  <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'}">
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                    ${headers.map(header => `<td style="padding: 12px; border: 1px solid #ddd;">${row[header] != null ? row[header] : ''}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        tempTable.innerHTML = tableHTML;

        // 等待下一个渲染周期
        await nextTick();

        // 使用html2canvas渲染
        const canvas = await html2canvas(tempTable, {
          scale: 2, // 提高清晰度
          useCORS: true,
          logging: false
        });

        // 移除临时元素
        document.body.removeChild(tempTable);

        // 创建PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        // 计算实际可用区域
        const usableWidth = pageWidth - (margin * 2);
        const usableHeight = pageHeight - (margin * 2);

        // 计算图片缩放比例
        const imgRatio = canvas.width / canvas.height;
        const imgWidth = usableWidth;
        const imgHeight = imgWidth / imgRatio;

        // 计算总页数
        const totalPages = Math.ceil(imgHeight / usableHeight);

        // 对每一页进行处理
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }

          // 计算当前页的裁剪区域
          const srcY = i * (canvas.height / totalPages);
          const srcHeight = canvas.height / totalPages;

          // 创建临时画布用于当前页
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = srcHeight;

          // 将对应部分绘制到临时画布
          const ctx = tempCanvas.getContext('2d');
          ctx.drawImage(
            canvas,
            0, srcY, canvas.width, srcHeight,
            0, 0, canvas.width, srcHeight
          );

          // 将临时画布内容添加到PDF
          const pageImgData = tempCanvas.toDataURL('image/jpeg', 1.0);
          pdf.addImage(
            pageImgData,
            'JPEG',
            margin,
            margin,
            usableWidth,
            usableHeight,
            undefined,
            'FAST'
          );
        }

        // 保存PDF
        pdf.save(`${selectedFile.value.name.split('.')[0]}.pdf`);
      } catch (e) {
        error.value = '导出 PDF 失败: ' + e.message;
      }
    };

    onMounted(() => {
      loadHistory();
    });

    return {
      files,
      selectedFile,
      jsonContent,
      loading,
      error,
      formatJSON,
      handleFileUpload,
      selectFile,
      deleteFile,
      copyToClipboard,
      exportToCSV,
      exportToPDF
    }
  }
}
</script>

<style scoped>
.excel-reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f0f2f5;
  color: #2c3e50;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.header {
  flex: 0 0 auto;
  padding: 24px 32px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.title {
  color: #2c3e50;
  margin: 0;
  font-size: 1.8em;
  font-weight: 600;
  text-align: center;
  letter-spacing: -0.5px;
}

.main-content {
  flex: 1;
  overflow: hidden;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.content {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.file-section {
  width: 300px;
  min-width: 300px;
  height: 100%;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
}

.file-list-header {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.upload-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.upload-label:hover {
  background: #2980b9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.hidden-input {
  display: none;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
  border: 1px solid #e0e0e0;
  position: relative;
}

.file-item:hover {
  background: #f0f2f5;
}

.file-item.active {
  background: #e3f2fd;
  border-color: #90caf9;
}

.file-icon {
  margin-right: 12px;
  font-size: 1.2em;
  opacity: 0.8;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9em;
  color: #2c3e50;
  padding-right: 24px;
}

.delete-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  font-size: 14px;
  line-height: 1;
  transition: all 0.2s ease;
}

.file-item:hover .delete-button {
  opacity: 0.6;
}

.delete-button:hover {
  opacity: 1 !important;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.json-section {
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}

.json-header {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-file-name {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1em;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: #2d3748;
}

.export-icon {
  font-size: 1.1rem;
}

.copy-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px 16px;
  background: #f8f9fa;
  color: #2c3e50;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
  font-weight: 500;
}

.copy-button:hover {
  background: #e9ecef;
  border-color: rgba(0, 0, 0, 0.12);
}

.copy-icon {
  margin-right: 8px;
  font-size: 1.1em;
  opacity: 0.8;
}

.json-content {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 20px;
  background: #1e1e1e;
  border-radius: 4px;
  overflow-x: auto;
  color: #d4d4d4;
}

.json-line {
  white-space: pre;
  padding: 2px 0;
  display: flex;
  min-height: 20px;
}

.json-line:hover {
  background: rgba(255, 255, 255, 0.05);
}

.line-number {
  color: #6b7280;
  width: 30px;
  text-align: right;
  padding-right: 10px;
  user-select: none;
  flex-shrink: 0;
}

.line-content {
  flex: 1;
}

/* JSON 语法高亮 */
.key {
  color: #9cdcfe;
}

.string {
  color: #ce9178;
}

.number {
  color: #b5cea8;
}

.boolean {
  color: #569cd6;
}

/* 自定义滚动条 */
.json-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.json-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.json-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.json-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 移动端样式 */
@media (max-width: 768px) {
  .app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    padding: 12px 16px;
    position: sticky;
    top: 0;
  }

  .title {
    font-size: 1.3em;
    margin-bottom: 4px;
  }

  .main-content {
    padding: 12px;
    height: calc(100vh - 60px);
    overflow: hidden;
  }

  .content {
    flex-direction: column;
    gap: 12px;
  }

  .file-section {
    width: 100%;
    min-width: 100%;
    height: auto;
    max-height: 35vh;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .file-list {
    padding: 8px;
  }

  .file-item {
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 6px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
  }

  .file-item:active {
    background: #e9ecef;
    transform: scale(0.98);
  }

  .file-name {
    font-size: 0.95em;
    padding-right: 36px;
  }

  .delete-button {
    width: 32px;
    height: 32px;
    right: 6px;
    opacity: 1;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
  }

  .upload-label {
    margin: 8px;
    padding: 12px 16px;
    font-size: 0.95em;
    border-radius: 6px;
    text-align: center;
    background: linear-gradient(45deg, #3498db, #2980b9);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .json-section {
    flex: 1;
    min-height: 0;
    border-radius: 8px;
    background: #1e1e1e;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .json-header {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(4px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .json-title {
    font-size: 0.95em;
    color: #e0e0e0;
  }

  .copy-button {
    padding: 8px 12px;
    font-size: 0.9em;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .copy-button:active {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(0.98);
  }

  .json-content {
    font-size: 13px;
    line-height: 1.5;
    padding: 16px;
    -webkit-overflow-scrolling: touch;
  }

  /* 触摸优化 */
  .file-item,
  .upload-label,
  .copy-button,
  .delete-button {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.15s ease, background-color 0.2s ease;
  }

  /* 滚动条优化 */
  .file-list,
  .json-content {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .file-list::-webkit-scrollbar,
  .json-content::-webkit-scrollbar {
    display: none;
  }
}

/* 横屏模式优化 */
@media (max-width: 768px) and (orientation: landscape) {
  .main-content {
    height: calc(100vh - 50px);
  }

  .content {
    flex-direction: row;
    gap: 12px;
  }

  .file-section {
    width: 280px;
    min-width: 280px;
    max-height: none;
    height: 100%;
  }

  .json-section {
    height: 100%;
  }

  .file-list {
    height: calc(100% - 70px);
  }

  .upload-label {
    margin: 8px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .file-section {
    background: #2d2d2d;
    border-color: #404040;
  }

  .file-item {
    background: #333;
    border-color: #404040;
  }

  .file-name {
    color: #e0e0e0;
  }

  .delete-button {
    background: rgba(45, 45, 45, 0.8);
    color: #e0e0e0;
  }
}
</style>
