<template>
  <a-row justify="center">
    <a-col :span="24" :lg="12">
      <a-input-group compact>
        <a-select
          style="width: 150px"
          :value="storage"
          :options="Storages"
          @change="handleSetStorage"
        />
        <a-input
          v-model:value="title"
          style="width: calc(100% - 334px)"
          allow-clear
          @press-enter="handleAddTitle"
        />
        <a-button type="primary" style="width: 60px" @click="handleAddTitle">Add</a-button>
        <a-popconfirm title="Are you sure to sync memos to other storages?" @confirm="handleSync">
          <a-button style="width: 60px">Sync</a-button>
        </a-popconfirm>
        <a-popconfirm title="Are you sure to clear storages?" @confirm="handleClear">
          <a-button style="width: 60px">Clear</a-button>
        </a-popconfirm>
      </a-input-group>
    </a-col>
  </a-row>
  <a-row justify="center" class="mt-4">
    <a-col :span="24" :lg="12">
      <a-list bordered :data-source="memos">
        <template #renderItem="{ item }: { item: TMemo }">
          <a-list-item :key="item.id" class="flex flex-row">
            <Icon class="flex-none anticon" :icon="MemoStatusMap[item.status].statusIcon"></Icon>
            <a-typography-text class="mx-2 break-all">{{ item.title }}</a-typography-text>
            <a-button
              v-show="item.status !== 'todo'"
              class="flex-none"
              type="text"
              shape="circle"
              @click="handleTodoMemo(item)"
            >
              <template #icon>
                <Icon class="mx-auto anticon" :icon="MemoStatusMap.todo.buttonIcon" />
              </template>
            </a-button>
            <a-button
              v-show="item.status !== 'doing'"
              class="flex-none"
              type="text"
              shape="circle"
              @click="handleDoingMemo(item)"
            >
              <template #icon>
                <Icon class="mx-auto anticon" :icon="MemoStatusMap.doing.buttonIcon" />
              </template>
            </a-button>
            <a-button
              v-show="item.status !== 'done'"
              class="flex-none"
              type="text"
              shape="circle"
              @click="handleDoneMemo(item)"
            >
              <template #icon>
                <Icon class="mx-auto anticon" :icon="MemoStatusMap.done.buttonIcon" />
              </template>
            </a-button>
            <a-button class="flex-none" type="text" shape="circle" @click="handleRemoveMemo(item)">
              <template #icon>
                <Icon class="mx-auto anticon" icon="ant-design:delete-outlined" />
              </template>
            </a-button>
          </a-list-item>
        </template>
      </a-list>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue';
import { Icon } from '@iconify/vue';
import { objectKeys } from '@/utils';

// codeStorage
const codeStorage = {} as any;
codeStorage.clear = () => {
  Object.keys(codeStorage).forEach((key) => {
    delete codeStorage[key];
    codeStorage.length = Object.keys(codeStorage).length - 6;
  });
};
codeStorage.getItem = (key: string): string | null => codeStorage[key] ?? null;
codeStorage.key = (index: number) => Object.keys(codeStorage)?.[index] ?? null;
codeStorage.removeItem = (key: string) => {
  delete codeStorage[key];
  codeStorage.length = Object.keys(codeStorage).length - 6;
};
codeStorage.setItem = (key: string, value: string) => {
  codeStorage[key] = value;
  codeStorage.length = Object.keys(codeStorage).length - 6;
};
codeStorage.length = 0;

const StorageMap = {
  codeStorage: codeStorage as Storage,
  localStorage,
  sessionStorage,
} as const;
type TStorage = keyof typeof StorageMap;
const DefaultStorage: TStorage = 'codeStorage';
const Storages = objectKeys(StorageMap).map((key) => ({
  label: key,
  value: key,
}));

const StorageKey = 'storage';

const MemosKey = 'memos';

const MemoStatusMap = {
  done: {
    order: 2,
    buttonIcon: 'ant-design:check-circle-outlined',
    statusIcon: 'ant-design:check-circle-filled',
    statusIconColor: '#52c41a',
  },
  doing: {
    order: 0,
    buttonIcon: 'eos-icons:bubble-loading',
    statusIcon: 'eos-icons:bubble-loading',
    statusIconColor: '#1890ff',
  },
  todo: {
    order: 1,
    buttonIcon: 'ant-design:info-circle-outlined',
    statusIcon: 'ant-design:info-circle-filled',
    statusIconColor: '#722ed1',
  },
} as const;
type TMemoStatus = keyof typeof MemoStatusMap;
type TMemo = {
  id: string;
  title: string;
  status: TMemoStatus;
};
type TMemos = TMemo[];
const MemoSortFunction = (memoA: TMemo, memoB: TMemo) =>
  MemoStatusMap[memoA.status].order - MemoStatusMap[memoB.status].order === 0
    ? Number.parseInt(memoA.id, 10) - Number.parseInt(memoB.id, 10)
    : MemoStatusMap[memoA.status].order - MemoStatusMap[memoB.status].order;

let storage = $ref(
  (objectKeys(StorageMap).includes((localStorage.getItem(StorageKey) ?? DefaultStorage) as TStorage)
    ? localStorage.getItem(StorageKey) ?? DefaultStorage
    : DefaultStorage) as TStorage,
);
const handleSetStorage = (value: TStorage) => {
  storage = value;
  localStorage.setItem(StorageKey, value);
};

let memos = $ref<TMemos>([]);
watchEffect(() => {
  try {
    const newMemos = JSON.parse(StorageMap[storage as TStorage].getItem(MemosKey) ?? '[]');
    memos = newMemos.sort(MemoSortFunction);
  } catch {
    memos = [];
  }
});

let title = $ref('');
const handleAddTitle = () => {
  memos.push({
    id: `${+Date.now()}${Number.parseInt((Math.random() * 1000).toFixed(0), 10)}`,
    title,
    status: 'todo',
  });
  memos.sort(MemoSortFunction);
  title = '';
  StorageMap[storage as TStorage].setItem(MemosKey, JSON.stringify(memos));
};

const handleSync = () => {
  objectKeys(StorageMap).forEach((item) => {
    StorageMap[item].setItem(MemosKey, JSON.stringify(memos));
  });
};

const handleClear = () => {
  memos = [];
  objectKeys(StorageMap).forEach((item) => {
    StorageMap[item].removeItem(MemosKey);
  });
};

const handleTodoMemo = (memo: TMemo) => {
  const index = memos.findIndex((item) => item.id === memo.id);
  memos.splice(index, 1, {
    ...memo,
    status: 'todo',
  });
  memos.sort(MemoSortFunction);
  StorageMap[storage as TStorage].setItem(MemosKey, JSON.stringify(memos));
};

const handleDoingMemo = (memo: TMemo) => {
  const index = memos.findIndex((item) => item.id === memo.id);
  memos.splice(index, 1, {
    ...memo,
    status: 'doing',
  });
  memos.sort(MemoSortFunction);
  StorageMap[storage as TStorage].setItem(MemosKey, JSON.stringify(memos));
};

const handleDoneMemo = (memo: TMemo) => {
  const index = memos.findIndex((item) => item.id === memo.id);
  memos.splice(index, 1, {
    ...memo,
    status: 'done',
  });
  memos.sort(MemoSortFunction);
  StorageMap[storage as TStorage].setItem(MemosKey, JSON.stringify(memos));
};

const handleRemoveMemo = (memo: TMemo) => {
  const index = memos.findIndex((item) => item.id === memo.id);
  memos.splice(index, 1);
  StorageMap[storage as TStorage].setItem(MemosKey, JSON.stringify(memos));
};
</script>
