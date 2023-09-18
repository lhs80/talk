isFull
<template>
  <!--全屏按钮-->
  <div class="full-screen"
       :class="isFull==='video'?'right':'left'"
       @click="fullScreen('video')"
       v-show="isFull!=='record'">
    <svg-icon :size="16" :name="isFull==='video'?'zhedie_zuo':'zhedie-you'"/>
    <span class="text">{{isFull==='video'?'显示笔录':'视频全屏'}}</span>
  </div>
  <!--退出全屏按钮-->
  <div class="full-screen"
       :class="isFull==='record'?'left':'right'"
       @click="fullScreen('record')"
       v-show="isFull!=='video'">
    <svg-icon :size="16" :name="isFull==='record'?'zhedie-you':'zhedie_zuo'"/>
    <span class="text">{{isFull==='record'?'显示视频':'笔录全屏'}}</span>
  </div>
</template>

<script setup lang="ts">
  const emits = defineEmits<{
    (e: 'handleFull', value: string): void
  }>();
  const props = defineProps<{
    isFull: string
  }>();
  let isFull = ref<string>();
  const fullScreen = (type) => {
    isFull.value = isFull.value === type ? '' : type;
    emits('handleFull', isFull.value)
  };
  watch(() => props.isFull, () => {
    isFull.value = props.isFull
  })
</script>

<style lang="less" scoped>
  /*全屏按钮*/
  .full-screen {
    width: 20px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    padding: 10px 12px;
    background: rgba(248, 249, 250, 0.7);
    box-shadow: 0 0 4px 0 rgba(51, 51, 51, 0.5);
    z-index: 999;

    .text {
      display: block;
      writing-mode: vertical-lr;
      margin-top: 1px;
      font-size: 12px;
    }

    &.left {
      left: 0;
    }

    &.right {
      right: 0;
    }
  }
</style>
