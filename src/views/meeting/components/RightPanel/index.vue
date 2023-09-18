<template>
  <div class="record-panel" :class="isFull==='video'? 'hidden' : ''">
    <!--不能使用element自带的tabs，当tab来回切换时，会导致畅写文档不可预料的问题-->
    <ul class="tab-title">
      <li :class="state.activeName === 'record' ? 'active' : ''" @click="state.activeName = 'record'" v-if="!isNet">
        <svg-icon name="tanhuabilu" :size="24" color="#148afe"/>
        <span class="title">谈话笔录</span>
      </li>
      <li :class="state.activeName === 'material' ? 'active' : ''" @click="state.activeName = 'material'">
        <svg-icon name="tanhuacailiao" :size="24" color="#148afe"/>
        <span class="title">谈话材料</span>
      </li>
    </ul>
    <div class="tab-content">
      <talk-record :class="state.activeName === 'record' ? 'max' : 'min'"/>
      <talk-material :info="meetingInfo" type="upload" :class="state.activeName === 'material' ? 'max' : 'min'"/>
    </div>
  </div>
</template>

<script setup lang="ts">
  const isNet = internet;
  const props = defineProps(["isFull", "meetingInfo"]);
  const state = reactive({
    activeName: isNet ? "material" : "record",
  });
</script>

<style lang="scss" scoped>
  /*右侧笔录/材料*/
  .record-panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    transition: 1s all;

    &.hidden {
      flex: 0;
      margin: 0;
      display: none;
    }

    .tab-title {
      padding: 0;
      margin: 0;
      background: white;

      li {
        display: inline-block;
        width: 96px;
        height: 40px;
        line-height: 40px;
        text-align: center;

        font-size: 12px;
        color: #051c33 !important;
        box-sizing: border-box;

        .title {
          vertical-align: middle;
        }

        &.active {
          border-bottom: solid 1px #148afe;
        }
      }
    }

    .tab-content {
      height: calc(100% - 44px);
      overflow: hidden;

      .max {
        height: 100%;
        position: relative;
        z-index: 10;
      }

      .min {
        height: 0;
        overflow: hidden;
      }
    }
  }
</style>
