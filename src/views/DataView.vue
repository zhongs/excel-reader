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
      if (!fileStore.selectedFile) return;

      const csv = Papa.unparse(fileStore.selectedFile.rawData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${fileStore.selectedFile.name}.csv`);
    };

    const exportPDF = () => {
      if (!fileStore.selectedFile) return;

      const doc = new jsPDF();
      doc.text(fileStore.selectedFile.content, 10, 10);
      doc.save(`${fileStore.selectedFile.name}.pdf`);
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
