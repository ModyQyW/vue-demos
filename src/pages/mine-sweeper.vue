<template>
  <a-form class="justify-center" :model="formModel" :colon="false" @finish="handleFinish">
    <a-row :gutter="16">
      <a-col :span="12" :lg="5">
        <a-form-item
          name="difficulty"
          label="Difficulty"
          :rules="[
            {
              type: 'enum',
              enum: Object.keys(DifficultyMap),
              required: true,
              message: 'Please select',
            },
          ]"
        >
          <a-select
            v-model:value="formModel.difficulty"
            :options="Difficulties"
            @change="handleChangeDifficulty"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12" :lg="5">
        <a-form-item
          name="rowCount"
          label="Row"
          :rules="[
            {
              type: 'number',
              min: MinRowCount,
              max: MaxRowCount,
              required: true,
              message: `Should between ${MinRowCount} and ${MaxRowCount}`,
            },
          ]"
        >
          <a-input-number
            v-model:value="formModel.rowCount"
            :min="MinRowCount"
            :max="MaxRowCount"
            :precision="0"
            class="w-full"
            @change="handleChangeFormModel"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12" :lg="5">
        <a-form-item
          name="colCount"
          label="Col"
          :rules="[
            {
              type: 'number',
              min: MinColCount,
              max: MaxColCount,
              required: true,
              message: `Should between ${MinColCount} and ${MaxColCount}`,
            },
          ]"
        >
          <a-input-number
            v-model:value="formModel.colCount"
            :min="MinColCount"
            :max="MaxColCount"
            :precision="0"
            class="w-full"
            @change="handleChangeFormModel"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12" :lg="5">
        <a-form-item
          name="mineCount"
          label="Mine"
          :validate-first="true"
          :rules="[
            {
              type: 'number',
              min: MinMineCount,
              max: MaxMineCount,
              required: true,
              message: `Should between ${MinMineCount} and ${MaxMineCount}`,
            },
            {
              validator: handleValidateMineCount,
            },
          ]"
        >
          <a-input-number
            v-model:value="formModel.mineCount"
            :min="MinMineCount"
            :max="MaxMineCount"
            :precision="0"
            class="w-full"
            @change="handleChangeFormModel"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12" :lg="4" class="text-center lg:text-left">
        <a-form-item>
          <a-button type="primary" html-type="submit" class="mr-2">Start</a-button>
          <a-button html-type="button" @click="form.resetFields()">Reset</a-button>
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
  <a-row class="flex-col my-4 overflow-x-auto">
    <a-row v-for="(rowItem, row) of matrix" :key="row" class="mx-auto flex-nowrap">
      <div
        v-for="(matrixItem, col) of rowItem"
        :key="col"
        :class="`flex justify-center items-center w-5 h-5 m-px transition flex-none ${
          status === StatusMap.ended ? 'cursor-default' : 'cursor-pointer'
        } ${
          matrixItem.status === MatrixItemStatusMap.opened &&
          matrixItem.type === MatrixItemTypeMap.bomb
            ? 'bg-red-300'
            : ''
        } ${
          matrixItem.status === MatrixItemStatusMap.opened &&
          matrixItem.type !== MatrixItemTypeMap.bomb
            ? 'bg-gray-300'
            : ''
        } ${matrixItem.status !== MatrixItemStatusMap.opened ? 'bg-gray-400' : ''}`"
        role="button"
        tabindex="-1"
        @click.prevent.stop="handleClickMatrixItem(row, col)"
        @contextmenu.prevent.stop="handleRightClickMatrixItem(row, col)"
      >
        {{ getMatrixItemText(row, col) }}
      </div>
    </a-row>
  </a-row>
  <a-typography-paragraph v-if="status === StatusMap.ended" class="text-center">
    Game Over :D
  </a-typography-paragraph>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue';
import { $ref } from 'vue/macros';
import { Form } from 'ant-design-vue';
import {
  MinRowCount,
  MaxRowCount,
  MinColCount,
  MaxColCount,
  MinMineCount,
  MaxMineCount,
  MinDensity,
  MaxDensity,
  DifficultyMap,
  Difficulties,
  type TDifficulty,
  type TParam,
  PresetMap,
  StatusMap,
  type TStatus,
  MatrixItemStatusMap,
  MatrixItemTypeMap,
  type TMatrix,
  type TMatrixItem,
} from '@/constants';
import { isEqual, uniqWith, randomInteger } from '@/utils';

let status = $ref<TStatus>(StatusMap.default);

let matrix = $ref<TMatrix>([]);
const getMatrixItemText = (row: number, col: number) => {
  const matrixItem = matrix[row][col];
  // MatrixItemStatusMap.default
  if (matrixItem.status === MatrixItemStatusMap.default) {
    if (matrixItem.type === MatrixItemTypeMap.bomb && status === StatusMap.ended) {
      return '💣';
    }
    return '';
  }
  // MatrixItemStatusMap.flagged
  if (matrixItem.status === MatrixItemStatusMap.flagged) {
    if (matrixItem.type === MatrixItemTypeMap.bomb && status === StatusMap.ended) {
      return '💣';
    }
    return '⚠️';
  }
  // MatrixItemStatusMap.opened
  if (matrixItem.type === MatrixItemTypeMap.bomb) {
    return '💣';
  }
  if (matrixItem.type === MatrixItemTypeMap.number) {
    let sum = 0;
    for (let i = row - 1; i <= row + 1; i += 1) {
      for (let j = col - 1; j <= col + 1; j += 1) {
        sum += matrix?.[i]?.[j]?.type === MatrixItemTypeMap.bomb ? 1 : 0;
      }
    }
    return sum;
  }
  return '';
};
const handleClickMatrixItem = (row: number, col: number) => {
  if (status !== StatusMap.ended && matrix[row][col].status !== MatrixItemStatusMap.opened) {
    status = StatusMap.playing;
    const newMatrix = [...matrix];
    if (
      newMatrix[row][col].type === MatrixItemTypeMap.bomb ||
      newMatrix[row][col].type === MatrixItemTypeMap.number
    ) {
      if (newMatrix[row][col].type === MatrixItemTypeMap.bomb) {
        status = StatusMap.ended;
      }
      newMatrix[row][col].status = MatrixItemStatusMap.opened;
    } else {
      let queue = [{ row, col }];
      while (queue.length > 0) {
        const { row: tmpRow, col: tmpCol } = queue.shift()!;
        if (newMatrix[tmpRow][tmpCol].status !== MatrixItemStatusMap.opened) {
          newMatrix[tmpRow][tmpCol].status = MatrixItemStatusMap.opened;
        }
        if (newMatrix[tmpRow][tmpCol].type === MatrixItemTypeMap.empty) {
          for (let i = tmpRow - 1; i <= tmpRow + 1; i += 1) {
            for (let j = tmpCol - 1; j <= tmpCol + 1; j += 1) {
              if (
                newMatrix?.[i]?.[j]?.status === MatrixItemStatusMap.default ||
                newMatrix?.[i]?.[j]?.status === MatrixItemStatusMap.flagged
              ) {
                queue.push({ row: i, col: j });
              }
            }
          }
          queue = uniqWith(queue, isEqual);
        }
      }
    }
    matrix = newMatrix;
  }
};
const handleRightClickMatrixItem = (row: number, col: number) => {
  if (status !== StatusMap.ended && matrix[row][col].status !== MatrixItemStatusMap.opened) {
    status = StatusMap.playing;
    const newMatrix = [...matrix];
    newMatrix[row][col].status =
      newMatrix[row][col].status === MatrixItemStatusMap.default
        ? MatrixItemStatusMap.flagged
        : MatrixItemStatusMap.default;
    matrix = newMatrix;
  }
};
watchEffect(() => {
  if (
    status !== StatusMap.ended &&
    matrix.length > 0 &&
    matrix.filter((rowItem) =>
      rowItem.some(
        (matrixItem) =>
          matrixItem.status !== MatrixItemStatusMap.opened &&
          matrixItem.type !== MatrixItemTypeMap.bomb,
      ),
    ).length === 0
  ) {
    status = StatusMap.ended;
  }
});

let formModel = $ref<TParam>({
  ...PresetMap.easy,
});
const form = Form.useForm(formModel);
const handleChangeDifficulty = (difficulty: TDifficulty) => {
  formModel = {
    ...PresetMap[difficulty],
  };
};
const handleChangeFormModel = () => {
  const { rowCount, colCount, mineCount } = formModel;
  formModel.difficulty =
    Object.values(PresetMap).find(
      (item) =>
        item.rowCount === rowCount && item.colCount === colCount && item.mineCount === mineCount,
    )?.difficulty ?? DifficultyMap.custom;
};
// @ts-ignore
const handleValidateMineCount = async (rule: any, value: number) => {
  const { rowCount = MinRowCount, colCount = MinColCount } = formModel;
  const density = value / rowCount / colCount;
  if (density >= MinDensity && density <= MaxDensity) {
    return Promise.resolve();
  }
  return Promise.reject(new Error('Unsuitable density'));
};
const handleFinish = async () => {
  const { rowCount, colCount, mineCount } = formModel;
  const newMatrix: TMatrix = Array.from({ length: rowCount }).map(() =>
    Array.from({ length: colCount }).map(
      () =>
        ({
          type: MatrixItemTypeMap.empty,
          status: MatrixItemStatusMap.default,
        } as TMatrixItem),
    ),
  );
  let nowMineCount = 0;
  while (nowMineCount < mineCount) {
    const row = randomInteger(0, rowCount);
    const col = randomInteger(0, colCount);
    if (newMatrix[row][col].type !== MatrixItemTypeMap.bomb) {
      newMatrix[row][col].type = MatrixItemTypeMap.bomb;
      for (let i = row - 1; i <= row + 1; i += 1) {
        for (let j = col - 1; j <= col + 1; j += 1) {
          if (newMatrix?.[i]?.[j]?.type === MatrixItemTypeMap.empty) {
            newMatrix[i][j].type = MatrixItemTypeMap.number;
          }
        }
      }
      nowMineCount += 1;
    }
  }
  matrix = newMatrix;
  status = StatusMap.default;
};
</script>
