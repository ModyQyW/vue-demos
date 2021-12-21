<template>
  <a-layout class="min-h-screen">
    <a-layout-header class="fixed z-10 w-full" style="padding: 0 12px">
      <a-row align="middle" class="h-full flex-nowrap">
        <a-typography-title :level="5" class="!text-white !mb-0 mx-4 flex-none">
          {{ pkg.name }}
        </a-typography-title>
        <a-menu
          theme="dark"
          mode="horizontal"
          class="flex-auto"
          :selected-keys="selectedKeys"
          @click="handleClickMenuItem"
        >
          <a-menu-item v-for="item of routes" :key="item">{{ item }}</a-menu-item>
        </a-menu>
      </a-row>
    </a-layout-header>
    <a-layout-content style="padding: 12px; margin-top: 64px">
      <slot />
    </a-layout-content>
    <a-layout-footer>
      <a-row justify="center">v{{ pkg.version }}</a-row>
      <a-row justify="center">
        <a-space size="large">
          <a-typography-link
            :href="`https://github.com/${pkg.author.name}/${pkg.name}`"
            target="_blank"
          >
            Github Repo
          </a-typography-link>
          <a-typography-link
            :href="`https://gitee.com/${pkg.author.name}/${pkg.name}`"
            target="_blank"
          >
            Gitee Repo
          </a-typography-link>
          <a-typography-link
            :href="`https://${pkg.author.name}.github.io/${pkg.name}/`"
            target="_blank"
          >
            Github Pages
          </a-typography-link>
          <a-typography-link
            :href="`https://${pkg.author.name}.gitee.io/${pkg.name}/`"
            target="_blank"
          >
            Gitee Pages
          </a-typography-link>
        </a-space>
      </a-row>
    </a-layout-footer>
  </a-layout>
</template>

<script setup lang="ts">
import { $computed } from 'vue/macros';
import { useRoute, useRouter } from 'vue-router';
import pkg from '@/../package.json';
// eslint-disable-next-line import/no-unresolved
import pages from '~pages';

const routes = pages
  .filter((page) => page.name !== 'index')
  .map((route) => (route?.name ?? '') as string);

const route = useRoute();
const router = useRouter();
const selectedKeys = $computed(() => routes.filter((item) => `/${item}` === route.fullPath));

const handleClickMenuItem = ({ key }: { key: string }) => {
  router.push(`/${key}`);
};
</script>
