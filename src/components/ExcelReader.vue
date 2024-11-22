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

        <div class="json-container">
          <div class="json-header">
            <h3 class="current-file-name">{{ selectedFile ? selectedFile.name : '' }}</h3>
            <button v-if="selectedFile" @click="copyToClipboard" class="copy-button">
              <i class="copy-icon">📋</i>
              Copy JSON
            </button>
          </div>
          <div class="json-viewer">
            <pre v-html="formatJSON(selectedFile ? selectedFile.content : '')"></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { readAllExcelFiles } from '../utils/excelReader';
import * as XLSX from 'xlsx';

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
          .map((line, i) => {
            // 计算缩进级别
            const indentLevel = (line.match(/^\s*/)[0].length / 2);
            const indentGuides = Array(indentLevel).fill('<span class="json-indent"></span>').join('');
            
            // 添加语法高亮
            const colorized = line
              // 高亮键名
              .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:')
              // 高亮字符串值
              .replace(/: "([^"]+)"/g, ': <span class="string">"$1"</span>')
              // 高亮数字
              .replace(/: (-?\d+\.?\d*)/g, ': <span class="number">$1</span>')
              // 高亮布尔值
              .replace(/: (true|false)/g, ': <span class="boolean">$1</span>')
              // 高亮null
              .replace(/: (null)/g, ': <span class="null">$1</span>');
              
            return `<span class="json-line">${indentGuides}${colorized}</span>`;
          })
          .join('\n');
          
        return highlighted;
      } catch (error) {
        console.error('JSON formatting error:', error);
        return jsonString;
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
      copyToClipboard
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
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-height: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.file-section {
  flex: 0 0 320px;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border-radius: 12px 0 0 12px;
}

.file-list-header {
  padding: 20px;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.hidden-input {
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
  pointer-events: none;
}

.upload-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px 24px;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95em;
  font-weight: 500;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(44, 62, 80, 0.15);
}

.upload-label:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(44, 62, 80, 0.2);
  background: linear-gradient(135deg, #34495e, #2980b9);
}

.upload-label:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(44, 62, 80, 0.15);
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  color: #2c3e50;
  position: relative;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.file-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.file-item.active {
  background: #2c3e50;
  color: white;
  box-shadow: 0 2px 6px rgba(44, 62, 80, 0.2);
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
  font-size: 0.95em;
}

.delete-button {
  opacity: 0;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: currentColor;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.file-item:hover .delete-button {
  opacity: 0.6;
}

.delete-button:hover {
  opacity: 1 !important;
  background: rgba(0, 0, 0, 0.05);
}

.json-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: white;
  border-radius: 0 12px 12px 0;
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

.copy-button {
  display: inline-flex;
  align-items: center;
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

/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* JSON语法高亮 */
.json-viewer {
  flex: 1;
  padding: 20px;
  background: #1e1e1e;
  overflow: auto;
  color: #d4d4d4;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  border-radius: 0 0 12px 0;
}

.json-viewer pre {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  tab-size: 2;
}

.json-viewer .key {
  color: #9cdcfe;
  font-weight: 500;
}

.json-viewer .string {
  color: #ce9178;
}

.json-viewer .number {
  color: #b5cea8;
}

.json-viewer .boolean {
  color: #569cd6;
  font-weight: 500;
}

.json-viewer .null {
  color: #569cd6;
  font-style: italic;
}

/* 添加行号和缩进指示线 */
.json-line {
  display: block;
  position: relative;
  padding-left: 3em;
  counter-increment: line;
}

.json-line::before {
  content: counter(line);
  position: absolute;
  left: 0;
  color: #858585;
  text-align: right;
  width: 2em;
  padding-right: 1em;
  opacity: 0.5;
  user-select: none;
}

.json-line:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* 缩进指示线 */
.json-indent {
  display: inline-block;
  width: 20px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  margin-left: -1px;
  height: 100%;
}
</style>
