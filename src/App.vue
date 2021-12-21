<template>
  <a-config-provider>
    <Layout>
      <router-view />
    </Layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import Layout from '@/layouts/index.vue';
</script>
