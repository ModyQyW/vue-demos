<template>
  <a-config-provider :locale="zhCN">
    <Layout>
      <router-view />
    </Layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import Layout from '@/layouts/index.vue';
</script>
