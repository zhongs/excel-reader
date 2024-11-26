<template>
  <div class="chart-view">
    <div class="chart-controls">
      <div class="control-group">
        <label>图表类型：</label>
        <select v-model="chartType">
          <option value="bar">柱状图</option>
          <option value="line">折线图</option>
          <option value="pie">饼图</option>
        </select>
      </div>
      
      <div class="control-group" v-if="chartType !== 'pie'">
        <label>X轴：</label>
        <select v-model="xAxis">
          <option v-for="field in fields" :key="field" :value="field">
            {{ field }}
          </option>
        </select>
      </div>
      
      <div class="control-group">
        <label>{{ chartType === 'pie' ? '数值' : 'Y轴' }}：</label>
        <select v-model="yAxis">
          <option v-for="field in numericFields" :key="field" :value="field">
            {{ field }}
          </option>
        </select>
      </div>
      
      <button @click="exportChart">导出图片</button>
    </div>
    
    <div class="chart-container" ref="chartContainer">
      <div ref="chartEl" class="chart"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useFileStore } from '../stores/fileStore';
import * as echarts from 'echarts';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

export default {
  name: 'ChartView',
  setup() {
    const fileStore = useFileStore();
    const chartEl = ref(null);
    const chartContainer = ref(null);
    const chart = ref(null);
    const chartType = ref('bar');
    const xAxis = ref('');
    const yAxis = ref('');

    // 获取所有字段
    const fields = computed(() => {
      if (!fileStore.selectedFile?.rawData?.length) return [];
      return Object.keys(fileStore.selectedFile.rawData[0]);
    });

    // 获取数值类型字段
    const numericFields = computed(() => {
      if (!fileStore.selectedFile?.rawData?.length) return [];
      const firstRow = fileStore.selectedFile.rawData[0];
      return Object.entries(firstRow)
        .filter(([_, value]) => typeof value === 'number')
        .map(([key]) => key);
    });

    // 当字段列表更新时，设置默认值
    watch(fields, (newFields) => {
      if (newFields.length > 0) {
        xAxis.value = xAxis.value || newFields[0];
      }
    });

    watch(numericFields, (newFields) => {
      if (newFields.length > 0) {
        yAxis.value = yAxis.value || newFields[0];
      }
    });

    // 初始化图表
    const initChart = () => {
      if (chartEl.value) {
        chart.value = echarts.init(chartEl.value);
      }
    };

    // 更新图表
    const updateChart = () => {
      if (!chart.value || !fileStore.selectedFile?.rawData) return;

      const data = fileStore.selectedFile.rawData;
      let option = {};

      if (chartType.value === 'pie') {
        const pieData = data.map(item => ({
          name: item[xAxis.value] || item[Object.keys(item)[0]],
          value: item[yAxis.value]
        }));

        option = {
          title: {
            text: fileStore.selectedFile.name,
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          series: [{
            name: yAxis.value,
            type: 'pie',
            radius: '50%',
            data: pieData
          }]
        };
      } else {
        const xData = data.map(item => item[xAxis.value]);
        const yData = data.map(item => item[yAxis.value]);

        option = {
          title: {
            text: fileStore.selectedFile.name,
            left: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            type: 'category',
            data: xData,
            name: xAxis.value
          },
          yAxis: {
            type: 'value',
            name: yAxis.value
          },
          series: [{
            data: yData,
            type: chartType.value,
            name: yAxis.value
          }]
        };
      }

      chart.value.setOption(option);
    };

    // 导出图表为图片
    const exportChart = async () => {
      if (!chartContainer.value) return;

      const canvas = await html2canvas(chartContainer.value);
      canvas.toBlob((blob) => {
        saveAs(blob, `${fileStore.selectedFile.name}_chart.png`);
      });
    };

    // 监听图表类型和轴的变化
    watch([chartType, xAxis, yAxis], () => {
      updateChart();
    });

    // 监听窗口大小变化
    const handleResize = () => {
      chart.value?.resize();
    };

    onMounted(() => {
      initChart();
      updateChart();
      window.addEventListener('resize', handleResize);
    });

    return {
      fileStore,
      chartEl,
      chartContainer,
      chartType,
      xAxis,
      yAxis,
      fields,
      numericFields,
      exportChart
    };
  }
};
</script>

<style scoped>
.chart-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.chart-controls {
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  white-space: nowrap;
}

.control-group select {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 120px;
}

button {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background: #45a049;
}

.chart-container {
  flex: 1;
  background: white;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
