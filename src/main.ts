import { createApp } from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import '@/styles/global.css';
import browserUpdate from 'browser-update';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import routes from '~pages';

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

browserUpdate({
  required: { e: 79, f: 67, o: 50, s: 12, c: 63 },
  insecure: true,
  unsupported: true,
});

createApp(App).use(router).use(Antd).mount('#app');
