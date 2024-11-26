import { createRouter, createWebHistory } from 'vue-router';
import DataView from '../views/DataView.vue';
import ChartView from '../views/ChartView.vue';

const routes = [
  {
    path: '/',
    redirect: '/data'
  },
  {
    path: '/data',
    name: 'data',
    component: DataView
  },
  {
    path: '/chart',
    name: 'chart',
    component: ChartView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
