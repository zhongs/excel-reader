<template>
  <div class="chart-view">
    <div class="chart-controls">
      <div class="chart-type-selector">
        <label>图表类型：</label>
        <select v-model="chartType">
          <option value="bar">柱状图</option>
          <option value="line">折线图</option>
          <option value="pie">饼图</option>
        </select>
      </div>
      <div class="data-selector">
        <template v-if="chartType !== 'pie'">
          <div class="axis-selector">
            <label>X轴：</label>
            <select v-model="xAxis">
              <option v-for="field in fields" :key="field" :value="field">
                {{ field }}
              </option>
            </select>
          </div>
          <div class="axis-selector">
            <label>Y轴：</label>
            <select v-model="yAxis">
              <option v-for="field in numericFields" :key="field" :value="field">
                {{ field }}
              </option>
            </select>
          </div>
        </template>
        <template v-else>
          <div class="axis-selector">
            <label>名称字段：</label>
            <select v-model="pieNameField">
              <option v-for="field in fields" :key="field" :value="field">
                {{ field }}
              </option>
            </select>
          </div>
          <div class="axis-selector">
            <label>数值字段：</label>
            <select v-model="pieValueField">
              <option v-for="field in numericFields" :key="field" :value="field">
                {{ field }}
              </option>
            </select>
          </div>
        </template>
      </div>
      <button class="export-chart" @click="exportChart">导出图表</button>
    </div>
    <div class="chart-container">
      <v-chart class="chart" :option="chartOption" :autoresize="true" />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import html2canvas from 'html2canvas';

// 注册必要的组件
echarts.use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
]);

export default {
  name: 'ChartView',
  components: {
    VChart,
  },
  props: {
    data: {
      type: Array,
      required: true,
      default: () => []
    },
  },
  setup(props) {
    const chartType = ref('bar');
    const xAxis = ref('');
    const yAxis = ref('');
    const pieNameField = ref('');
    const pieValueField = ref('');
    const chartContainer = ref(null);

    // 获取所有字段
    const fields = computed(() => {
      if (!props.data || props.data.length === 0) return [];
      return Object.keys(props.data[0]);
    });

    // 获取数值类型字段
    const numericFields = computed(() => {
      if (!props.data || props.data.length === 0) return [];
      return fields.value.filter(field => {
        return typeof props.data[0][field] === 'number';
      });
    });

    // 监听数据变化
    watch(() => props.data, (newData) => {
      if (newData && newData.length > 0) {
        // 自动设置第一个字段为 X 轴
        if (fields.value.length > 0) {
          xAxis.value = fields.value[0];
          pieNameField.value = fields.value[0];
        }
        // 自动设置第一个数值字段为 Y 轴
        if (numericFields.value.length > 0) {
          yAxis.value = numericFields.value[0];
          pieValueField.value = numericFields.value[0];
        }
      }
    }, { immediate: true });

    // 图表配置
    const chartOption = computed(() => {
      if (!props.data || props.data.length === 0) return {};

      if (chartType.value === 'pie') {
        return {
          title: {
            text: '数据可视化',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 'left'
          },
          series: [
            {
              name: pieNameField.value,
              type: 'pie',
              radius: '50%',
              data: props.data.map(item => ({
                name: item[pieNameField.value],
                value: item[pieValueField.value]
              })),
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        };
      }

      return {
        title: {
          text: '数据可视化',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: props.data.map(item => item[xAxis.value]),
          name: xAxis.value
        },
        yAxis: {
          type: 'value',
          name: yAxis.value
        },
        series: [
          {
            data: props.data.map(item => item[yAxis.value]),
            type: chartType.value,
            smooth: chartType.value === 'line'
          }
        ]
      };
    });

    // 导出图表
    const exportChart = async () => {
      if (!chartContainer.value) return;
      
      try {
        const canvas = await html2canvas(chartContainer.value, {
          scale: 2,
          useCORS: true,
          logging: false
        });

        // 创建下载链接
        const link = document.createElement('a');
        link.download = `chart-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('导出图表失败:', error);
        alert('导出图表失败');
      }
    };

    return {
      chartType,
      xAxis,
      yAxis,
      pieNameField,
      pieValueField,
      fields,
      numericFields,
      chartOption,
      exportChart,
    };
  },
};
</script>

<style>
/* 重要：确保图表容器有固定高度 */
.chart-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.chart-controls {
  margin-bottom: 20px;
}

.chart-container {
  flex: 1;
  min-height: 400px;
  position: relative;
}

.chart {
  height: 100% !important;
  width: 100% !important;
  min-height: 400px;
}

.chart-type-selector,
.data-selector {
  margin-bottom: 15px;
}

.axis-selector {
  display: inline-block;
  margin-right: 20px;
}

label {
  margin-right: 8px;
}

select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.export-chart {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.export-chart:hover {
  background: #45a049;
}
</style>
