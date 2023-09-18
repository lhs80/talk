<template>
  <el-dropdown-item>
    <svg-icon name="xuanze" :size="14" v-if="active"/>
    <span class="text">{{ text }}</span>
  </el-dropdown-item>
</template>

<script setup lang="ts">
  const props = defineProps({
    active: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      default: "",
    },
  });
</script>

<style lang="less" scoped>
  :deep(.el-dropdown-menu__item) {
    position: relative;
    height: 30px;
    line-height: 30px;
    padding-left:20px;

    > svg {
      position: absolute;
      top: 50%;
      left: 10px;
      transform: translateY(-50%);
    }

    > .text {
            margin-left: 20px;
      vertical-align: middle;
    }
  }
</style>
