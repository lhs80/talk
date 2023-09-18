<template>
  <div class="close"></div>
</template>

<script setup lang="ts">
  import {clearToken} from "@/utils/auth";
  // 传参
  const state = reactive({});
  // 方法
  const incident = () => {
    clearToken();
    open(location, "_self").close();
  };
  // 挂载
  onMounted(() => {
    incident();
  });
</script>
