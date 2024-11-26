<template>
  <div class="chart-view">
    <div class="chart-controls">
      <div class="control-group">
        <label>图表类型：</label>
        <select v-model="chartType">
          <option value="bar">柱状图</option>
          <option value="line">折线图</option>
          <option value="pie">饼图</option>
          <option value="scatter">散点图</option>
          <option value="area">面积图</option>
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

      <div class="control-group">
        <label>主题：</label>
        <select v-model="theme">
          <option value="default">默认</option>
          <option value="dark">暗色</option>
          <option value="light">亮色</option>
        </select>
      </div>

      <div class="control-group checkbox-group">
        <label>
          <input type="checkbox" v-model="showDataLabels">
          显示数据标签
        </label>
      </div>

      <div class="control-group" v-if="chartType === 'bar'">
        <label>柱状图样式：</label>
        <select v-model="barStyle">
          <option value="normal">普通</option>
          <option value="gradient">渐变</option>
          <option value="pattern">纹理</option>
        </select>
      </div>

      <div class="control-group">
        <button @click="exportChart" class="primary-button">导出图片</button>
        <button @click="resetChart" class="secondary-button">重置</button>
      </div>
    </div>
    
    <div class="chart-container" ref="chartContainer">
      <div ref="chartEl" class="chart"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
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
    const theme = ref('default');
    const showDataLabels = ref(true);
    const barStyle = ref('gradient');

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

    // 初始化默认值
    const initDefaultAxes = () => {
      if (fields.value.length > 0 && !xAxis.value) {
        xAxis.value = fields.value[0];
      }
      if (numericFields.value.length > 0 && !yAxis.value) {
        yAxis.value = numericFields.value[0];
      }
    };

    // 监听文件变化，自动设置默认值
    watch(() => fileStore.selectedFile, (newFile) => {
      if (newFile?.rawData?.length) {
        initDefaultAxes();
      }
    }, { immediate: true });

    // 当字段列表更新时，确保有默认值
    watch([fields, numericFields], () => {
      initDefaultAxes();
    });

    // 获取渐变色
    const getGradientColor = () => ({
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [{
        offset: 0,
        color: '#83bff6'
      }, {
        offset: 0.5,
        color: '#188df0'
      }, {
        offset: 1,
        color: '#188df0'
      }]
    });

    // 获取柱状图样式
    const getBarStyle = () => {
      switch (barStyle.value) {
        case 'gradient':
          return { color: getGradientColor() };
        case 'pattern':
          return {
            color: '#5470c6',
            barBorderRadius: [4, 4, 0, 0],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0,0,0,0.5)'
              }
            }
          };
        default:
          return { color: '#5470c6' };
      }
    };

    // 初始化图表
    const initChart = () => {
      if (chartEl.value) {
        // 根据主题初始化图表
        chart.value = echarts.init(chartEl.value, theme.value);
      }
    };

    // 更新图表
    const updateChart = () => {
      if (!chart.value || !fileStore.selectedFile?.rawData) return;

      const data = fileStore.selectedFile.rawData;
      let option = {
        animation: true,
        title: {
          text: fileStore.selectedFile.name,
          left: 'center',
          top: 10
        },
        grid: {
          top: 70,
          right: 40,
          bottom: 40,
          left: 80,
          containLabel: true
        },
        tooltip: {
          trigger: chartType.value === 'pie' ? 'item' : 'axis',
          formatter: chartType.value === 'pie' ? '{a} <br/>{b}: {c} ({d}%)' : null
        },
        legend: {
          top: 40,
          type: 'scroll'
        }
      };

      if (chartType.value === 'pie') {
        const pieData = data.map(item => ({
          name: item[xAxis.value] || item[Object.keys(item)[0]],
          value: item[yAxis.value]
        }));

        option.series = [{
          name: yAxis.value,
          type: 'pie',
          radius: '50%',
          data: pieData,
          label: {
            show: showDataLabels.value,
            formatter: '{b}: {c} ({d}%)'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }];
      } else {
        const xData = data.map(item => item[xAxis.value]);
        const yData = data.map(item => item[yAxis.value]);

        option = {
          ...option,
          xAxis: {
            type: 'category',
            data: xData,
            name: xAxis.value,
            axisLabel: {
              interval: 0,
              rotate: 45,
              formatter: function(value) {
                return value.length > 20 ? value.substring(0, 20) + '...' : value;
              },
              overflow: 'break',
              width: 100,
              hideOverlap: true,
              align: 'right'
            },
            axisTick: {
              alignWithLabel: true
            }
          },
          yAxis: {
            type: 'value',
            name: yAxis.value,
            scale: true
          },
          dataZoom: [{
            type: 'slider',
            show: xData.length > 10,
            start: 0,
            end: 100
          }],
          series: [{
            name: yAxis.value,
            data: yData,
            type: chartType.value === 'area' ? 'line' : chartType.value,
            areaStyle: chartType.value === 'area' ? {} : undefined,
            label: {
              show: showDataLabels.value,
              position: 'top'
            },
            ...(chartType.value === 'bar' ? getBarStyle() : {})
          }]
        };
      }

      chart.value.setOption(option);
    };

    // 导出图表为图片
    const exportChart = async () => {
      if (!chartContainer.value) return;

      try {
        const canvas = await html2canvas(chartContainer.value, {
          backgroundColor: theme.value === 'dark' ? '#333' : '#fff'
        });
        canvas.toBlob((blob) => {
          saveAs(blob, `${fileStore.selectedFile.name}_chart.png`);
        });
      } catch (error) {
        console.error('导出图表失败:', error);
        alert('导出图表失败，请重试');
      }
    };

    // 重置图表
    const resetChart = () => {
      chartType.value = 'bar';
      theme.value = 'default';
      showDataLabels.value = true;
      barStyle.value = 'gradient';
      if (fields.value.length > 0) {
        xAxis.value = fields.value[0];
      }
      if (numericFields.value.length > 0) {
        yAxis.value = numericFields.value[0];
      }
    };

    // 监听图表相关配置的变化
    watch([chartType, xAxis, yAxis, theme, showDataLabels, barStyle], () => {
      if (theme.value !== chart.value?.getOption()?.theme) {
        // 主题变化时需要重新初始化图表
        chart.value?.dispose();
        initChart();
      }
      updateChart();
    });

    // 监听窗口大小变化
    const handleResize = () => {
      chart.value?.resize();
    };

    onMounted(() => {
      initChart();
      initDefaultAxes();
      updateChart();
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
      chart.value?.dispose();
    });

    return {
      fileStore,
      chartEl,
      chartContainer,
      chartType,
      xAxis,
      yAxis,
      theme,
      showDataLabels,
      barStyle,
      fields,
      numericFields,
      exportChart,
      resetChart
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
  background-color: var(--bg-color, #fff);
}

.chart-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: var(--control-bg, #f5f5f5);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  font-weight: 500;
  color: var(--label-color, #333);
  min-width: 70px;
}

.control-group select {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  background-color: var(--input-bg, #fff);
  color: var(--text-color, #333);
  min-width: 120px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.primary-button, .secondary-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.primary-button {
  background-color: var(--primary-color, #4CAF50);
  color: white;
}

.primary-button:hover {
  background-color: var(--primary-hover, #45a049);
}

.secondary-button {
  background-color: var(--secondary-color, #f5f5f5);
  color: var(--text-color, #333);
  border: 1px solid var(--border-color, #ddd);
}

.secondary-button:hover {
  background-color: var(--secondary-hover, #e8e8e8);
}

.chart-container {
  flex: 1;
  min-height: 0;
  position: relative;
  margin-bottom: 20px;
  background: var(--chart-bg, #fff);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 450px;
}

/* 暗色主题 */
:root[data-theme='dark'] {
  --bg-color: #1a1a1a;
  --control-bg: #2d2d2d;
  --label-color: #fff;
  --text-color: #fff;
  --border-color: #404040;
  --input-bg: #333;
  --primary-color: #4CAF50;
  --primary-hover: #45a049;
  --secondary-color: #333;
  --secondary-hover: #404040;
  --chart-bg: #2d2d2d;
}
</style>
