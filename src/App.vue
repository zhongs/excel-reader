<template>
  <div id="app">
    <div class="app-container">
      <div class="sidebar">
        <div class="file-upload">
          <label class="upload-label" for="file-upload">
            <i class="upload-icon">📁</i>
            Upload Excel
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileUpload"
            class="hidden-input"
          />
        </div>
        <div class="file-list">
          <div
            v-for="file in fileStore.files"
            :key="file.id"
            class="file-item"
            :class="{ active: fileStore.selectedFile && fileStore.selectedFile.id === file.id }"
            @click="selectFile(file)"
          >
            <i class="file-icon">📄</i>
            <span class="file-name">{{ file.name }}</span>
            <button class="delete-button" @click.stop="deleteFile(file)">
              ×
            </button>
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <div class="view-toggle">
          <router-link to="/data" custom v-slot="{ navigate, isActive }">
            <button 
              class="toggle-button" 
              :class="{ active: isActive }"
              @click="navigate"
            >
              数据视图
            </button>
          </router-link>
          <router-link to="/chart" custom v-slot="{ navigate, isActive }">
            <button 
              class="toggle-button" 
              :class="{ active: isActive }"
              @click="navigate"
            >
              图表视图
            </button>
          </router-link>
        </div>
        
        <div class="view-container">
          <router-view v-if="fileStore.selectedFile"></router-view>
          <div v-else class="empty-state">
            请上传或选择一个 Excel 文件
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useFileStore } from './stores/fileStore';
import * as XLSX from "xlsx";

export default {
  name: 'App',
  setup() {
    const fileStore = useFileStore();

    const parseCellValue = (value) => {
      if (typeof value !== "string") return value;

      const trimmed = value.trim();
      if (trimmed === "") return value;

      if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return trimmed;
      }

      const significantDigits = trimmed.replace(/[-.]/g, "").length;
      if (significantDigits > 15) {
        return trimmed;
      }

      const numericValue = Number(trimmed);
      return Number.isFinite(numericValue) ? numericValue : trimmed;
    };

    onMounted(() => {
      fileStore.loadHistory();
    });

    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {
          cellDates: true,
          cellNF: true,
          cellText: false,
        });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 使用默认选项先获取数据
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: null,
        });

        // 处理数据，移除空字段和 __EMPTY 字段
        const processedData = rawData.map((row) => {
          const newRow = {};
          Object.entries(row).forEach(([key, value]) => {
            if (!key.startsWith("__EMPTY") && value !== null && value !== "") {
              newRow[key] = parseCellValue(value);
            }
          });
          return newRow;
        });

        // 创建新的文件记录
        const newFile = {
          id: Date.now(),
          name: file.name,
          uploadTime: new Date().toLocaleString(),
          content: JSON.stringify(processedData, null, 2),
          rawData: processedData
        };

        fileStore.addFile(newFile);
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Error reading file: " + error.message);
      }

      event.target.value = "";
    };

    const selectFile = (file) => {
      fileStore.selectFile(file);
    };

    const deleteFile = (file) => {
      fileStore.deleteFile(file.id);
    };

    return {
      fileStore,
      handleFileUpload,
      selectFile,
      deleteFile,
    };
  }
};
</script>

<style>
#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100%;
  background: #f5f5f5;
}

.sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.file-upload {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.upload-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #4CAF50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  justify-content: center;
}

.hidden-input {
  display: none;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 5px;
}

.file-item:hover {
  background: #f5f5f5;
}

.file-item.active {
  background: #e3f2fd;
}

.file-icon {
  margin-right: 8px;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-button {
  visibility: hidden;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
}

.file-item:hover .delete-button {
  visibility: visible;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-toggle {
  padding: 20px;
  display: flex;
  gap: 10px;
  background: white;
  border-bottom: 1px solid #eee;
}

.toggle-button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.toggle-button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.view-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
}
</style>
