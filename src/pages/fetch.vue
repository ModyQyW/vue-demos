<template>
  <a-row justify="center">
    <a-col :span="24" :lg="12">
      <a-input-search :default-value="keyword" enter-button @search="handleChangeKeyword">
        <template #addonBefore>
          <a-select v-model:value="service" :options="Services" @change="handleChangeService" />
        </template>
      </a-input-search>
    </a-col>
  </a-row>
  <a-row justify="center">
    <a-col :span="24" :lg="12">
      <a-result
        v-if="!isLoading && error"
        status="error"
        :title="error?.message ?? error ?? 'Unknown Error'"
      />
      <a-table
        :loading="isLoading"
        class="mt-4"
        :data-source="repositories"
        row-key="id"
        size="small"
        :pagination="{
          current: page,
          pageSize: 10,
          total,
          size: 'small',
          position: ['topCenter', 'bottomCenter'],
          showSizeChanger: false,
          onChange: handleChangePagination,
        }"
        :columns="[
          {
            title: 'Name',
            dataIndex: 'full_name',
            ellipsis: true,
          },
          {
            title: 'Stars',
            dataIndex: 'stargazers_count',
            width: 80,
          },
          {
            title: 'Forks',
            dataIndex: 'forks_count',
            width: 80,
          },
        ]"
      />
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { watch } from 'vue';

const ServiceMap = {
  github: 'https://api.github.com/search/repositories',
  gitee: 'https://gitee.com/api/v5/search/repositories',
} as const;
type TService = keyof typeof ServiceMap;
const Services: TOption<TService>[] = (Object.keys(ServiceMap) as Array<TService>).map((item) => ({
  label: item,
  value: item,
}));

type TRepository = {
  id: number;
  full_name: string;
  url: string;
  stargazers_count: number;
  forks_count: number;
};

type TCache = Record<string, TRepository[]>;

const getCacheKey = (service: typeof ServiceMap[TService], param: Record<string, any>) =>
  JSON.stringify([service, param]);

const cacheRef = $ref<TCache>({});
let repositories = $ref<TRepository[]>([]);

let page = $ref(1);
let total = $ref(0);
const service = $ref<TService>('github');
let keyword = $ref('vue');
let isLoading = $ref(true);
let error = $ref<Error | null>(null);
const handleSearch = () => {
  isLoading = true;
  error = null;
  const key = getCacheKey(ServiceMap[service as TService], { keyword, page });
  if (cacheRef[key]) {
    repositories = cacheRef[key];
    isLoading = false;
    return;
  }
  fetch(`${ServiceMap[service as TService]}?q=${keyword}&page=${page}&per_page=10`)
    .then((response) => {
      if (response.ok) {
        const newTotal = response.headers.get('total_count') ?? '';
        if (!Number.isNaN(Number.parseInt(newTotal, 10))) {
          total = Number.parseInt(newTotal, 10);
        }
      }
      return response.json();
    })
    .then((data) => {
      if (data.message && data.documentation_url) {
        error = new Error(`${data.message} ${data.documentation_url}`);
        repositories = [];
      } else {
        if (data.total_count) {
          total = data.total_count;
        }
        repositories = data.items ?? data;
        cacheRef[key] = data.items ?? data;
      }
    })
    .catch((newError) => {
      error = newError;
      repositories = [];
    })
    .finally(() => {
      isLoading = false;
    });
};
const handleChangeKeyword = (value: string) => {
  keyword = value;
};
const handleChangeService = () => {
  page = 1;
};
const handleChangePagination = (newPage: number) => {
  page = newPage;
};
watch(
  [$$(keyword), $$(page), $$(service)],
  () => {
    handleSearch();
  },
  {
    immediate: true,
  },
);
</script>
