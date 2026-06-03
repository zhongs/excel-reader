<template>
  <div class="excel-reader">
    <div class="header">
      <h2 class="title">Excel Reader</h2>
      <div class="view-toggle" v-if="selectedFile">
        <button 
          class="toggle-button" 
          :class="{ active: !showChart }"
          @click="showChart = false"
        >
          数据视图
        </button>
        <button 
          class="toggle-button" 
          :class="{ active: showChart }"
          @click="showChart = true"
        >
          图表视图
        </button>
      </div>
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
              <button class="delete-button" @click.stop="deleteFile(file)">
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="data-section">
          <!-- 图表视图 -->
          <div v-if="showChart && selectedFile" class="chart-section">
            <div>数据长度: {{ chartData.length }}</div>
            <div>数据示例: {{ JSON.stringify(chartData[0]) }}</div>
            <chart-view :data="chartData" />
          </div>
          
          <!-- JSON视图 -->
          <div v-else class="json-section">
            <div class="json-header">
              <h3 class="current-file-name">
                {{ selectedFile ? selectedFile.name : "" }}
              </h3>
              <div class="action-buttons" v-if="selectedFile">
                <button
                  @click="copyToClipboard"
                  class="action-button copy-button"
                >
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
            <div
              class="json-content"
              v-html="formatJSON(selectedFile ? selectedFile.content : '')"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from "vue";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";
import html2canvas from "html2canvas";
import ChartView from './ChartView.vue';

export default {
  name: "ExcelReader",
  components: {
    ChartView
  },
  setup() {
    const files = ref([]);
    const selectedFile = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const showChart = ref(false);
    const chartData = ref([]);

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

    const formatJSON = (jsonString) => {
      if (!jsonString) return "";

      try {
        const obj =
          typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
        const formatted = JSON.stringify(obj, null, 2);

        // 转义HTML字符
        const escaped = formatted
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        // 添加语法高亮
        const highlighted = escaped
          .split("\n")
          .map((line) => {
            // 保持原始缩进空格
            const spaces = line.match(/^\s*/)[0];
            const content = line.slice(spaces.length);

            // 处理行内容
            const lineContent = content
              .replace(/(".*?"):/g, '<span class="key">$1</span>:')
              .replace(/: (".*?")(,?)/g, ': <span class="string">$1</span>$2')
              .replace(
                /: (-?\d+\.?\d*)(,?)/g,
                ': <span class="number">$1</span>$2'
              )
              .replace(
                /: (true|false|null)(,?)/g,
                ': <span class="boolean">$1</span>$2'
              );

            // 使用 CSS 缩进
            const indentSize = spaces.length;
            return `
          <div class="json-line">
            <span class="line-content" style="padding-left: ${
              indentSize * 10
            }px">
              ${lineContent}
            </span>
          </div>`;
          })
          .join("");

        return highlighted;
      } catch (e) {
        return "Invalid JSON";
      }
    };

    const loadHistory = () => {
      const history = localStorage.getItem("excelReaderHistory");
      if (history) {
        files.value = JSON.parse(history);
        // 如果有历史记录，自动选择第一个文件
        if (files.value.length > 0) {
          selectedFile.value = files.value[0];
        }
      }
    };

    const saveHistory = () => {
      localStorage.setItem("excelReaderHistory", JSON.stringify(files.value));
    };

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
          raw: false, // 使用格式化的值
          defval: null, // 空单元格用null
        });

        // 处理数据，移除空字段和 __EMPTY 字段
        const processedData = rawData.map((row) => {
          const newRow = {};
          Object.entries(row).forEach(([key, value]) => {
            // 跳过 __EMPTY 开头的字段和 null 值
            if (!key.startsWith("__EMPTY") && value !== null && value !== "") {
              newRow[key] = parseCellValue(value);
            }
          });
          return newRow;
        });

        // 更新图表数据
        chartData.value = processedData;

        // 创建新的文件记录
        const newFile = {
          id: Date.now(),
          name: file.name,
          uploadTime: new Date().toLocaleString(),
          content: JSON.stringify(processedData, null, 2),
          rawData: processedData  
        };

        // 添加到文件列表
        files.value.unshift(newFile);
        selectedFile.value = newFile;

        // 保存到localStorage
        saveHistory();
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Error reading file: " + error.message);
      }

      // 清除input的value，允许重复上传同一个文件
      event.target.value = "";
    };

    const selectFile = (file) => {
      selectedFile.value = file;
      chartData.value = file.rawData || [];  
    };

    const deleteFile = (fileToDelete) => {
      const index = files.value.findIndex((f) => f.id === fileToDelete.id);
      if (index !== -1) {
        files.value.splice(index, 1);

        // 如果删除的是当前选中的文件，则选择新的文件
        if (selectedFile.value && selectedFile.value.id === fileToDelete.id) {
          if (files.value.length > 0) {
            selectFile(files.value[0]);
          } else {
            selectedFile.value = null;
          }
        }

        // 更新localStorage
        saveHistory();
      }
    };

    const copyToClipboard = async () => {
      try {
        if (!selectedFile.value || !selectedFile.value.content) return;

        await navigator.clipboard.writeText(selectedFile.value.content);
        const copyBtn = document.querySelector(".copy-button");
        if (copyBtn) {
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="copy-icon">✓</i> Copied!';
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
        }
      } catch (err) {
        console.error("Failed to copy:", err);
        alert("Failed to copy to clipboard");
      }
    };

    const exportToCSV = () => {
      if (!selectedFile.value || !selectedFile.value.content) return;

      try {
        const jsonData =
          typeof selectedFile.value.content === "string"
            ? JSON.parse(selectedFile.value.content)
            : selectedFile.value.content;

        // Convert JSON to CSV
        const csv = Papa.unparse(jsonData);

        // Create blob and download
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `${selectedFile.value.name.split(".")[0]}.csv`
        );
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        error.value = "Failed to export CSV: " + e.message;
      }
    };

    const exportToPDF = async () => {
      if (!selectedFile.value || !selectedFile.value.content) return;

      try {
        const jsonData =
          typeof selectedFile.value.content === "string"
            ? JSON.parse(selectedFile.value.content)
            : selectedFile.value.content;

        // 创建临时表格元素
        const tempTable = document.createElement("div");
        tempTable.style.position = "absolute";
        tempTable.style.left = "-9999px";
        tempTable.style.top = "-9999px";
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
                  ${headers
                    .map(
                      (header) =>
                        `<th style="padding: 12px; border: 1px solid #ddd; text-align: left;">${header}</th>`
                    )
                    .join("")}
                </tr>
              </thead>
              <tbody>
                ${jsonData
                  .map(
                    (row, index) => `
                  <tr style="background-color: ${
                    index % 2 === 0 ? "#ffffff" : "#f8f9fa"
                  }">
                    <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${
                      index + 1
                    }</td>
                    ${headers
                      .map(
                        (header) =>
                          `<td style="padding: 12px; border: 1px solid #ddd;">${
                            row[header] != null ? row[header] : ""
                          }</td>`
                      )
                      .join("")}
                  </tr>
                `
                  )
                  .join("")}
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
          logging: false,
        });

        // 移除临时元素
        document.body.removeChild(tempTable);

        // 创建PDF
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        // 计算实际可用区域
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

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
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = srcHeight;

          // 将对应部分绘制到临时画布
          const ctx = tempCanvas.getContext("2d");
          ctx.drawImage(
            canvas,
            0,
            srcY,
            canvas.width,
            srcHeight,
            0,
            0,
            canvas.width,
            srcHeight
          );

          // 将临时画布内容添加到PDF
          const pageImgData = tempCanvas.toDataURL("image/jpeg", 1.0);
          pdf.addImage(
            pageImgData,
            "JPEG",
            margin,
            margin,
            usableWidth,
            usableHeight,
            undefined,
            "FAST"
          );
        }

        // 保存PDF
        pdf.save(`${selectedFile.value.name.split(".")[0]}.pdf`);
      } catch (e) {
        error.value = "导出 PDF 失败: " + e.message;
      }
    };

    onMounted(() => {
      loadHistory();
    });

    return {
      files,
      selectedFile,
      loading,
      error,
      showChart,
      chartData,  
      formatJSON,
      handleFileUpload,
      selectFile,
      deleteFile,
      copyToClipboard,
      exportToCSV,
      exportToPDF,
    };
  },
};
</script>

<style scoped>
/*  导入css */
@import "../assets/styles/excelReader.css";

.view-toggle {
  display: flex;
  gap: 10px;
  margin-left: auto;
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

.data-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-section {
  flex: 1;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
