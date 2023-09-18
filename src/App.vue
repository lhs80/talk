<template>
  <el-config-provider :locale="zhCn">
    <router-view v-slot="{ Component }">
      <!--根据是否登录判断组件需不需要缓存-->
      <component :is="Component"/>
    </router-view>
  </el-config-provider>
</template>
<script setup lang="ts">
  import zhCn from 'element-plus/lib/locale/lang/zh-cn'
  import {ElMessage} from 'element-plus';

  onMounted(() => {
    const channel = new BroadcastChannel("xsy");
    channel.postMessage("opened");
    channel.addEventListener("message", (m: MessageEvent) => {
      if (m.data == "opened") {
        console.log("已经有打开的标签存在");
        channel.postMessage("closed");
      } else if (m.data === 'closed') {
        ElMessage.error('已经有打开的页面,不能重复打开.');
        setTimeout(() => {
          window.location.replace("about:blank");
        }, 1000);
      }
    })
  })
</script>