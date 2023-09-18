<template>
  <div class="control-bar-item" :class="cusClassName">
    <svg-icon :name="iconName" :size="30"/>
    <h6 class="name">{{ text }}</h6>
    <el-dropdown size="small" popper-class="customer-popper" placement="top-start" trigger="click" :show-arrow="false" style="position: absolute; height: 60%" v-if="type === 'dropdown'">
      <span class="arrow">
        <svg-icon name="icon_jiantou" :size="14"/>
      </span>
      <template #dropdown>
        <div class="menu-title">
          <svg-icon :name="menuIconName" :size="20"/>
          <i>{{ menuTitle }}</i>
        </div>
        <slot name="menu"/>
      </template>
    </el-dropdown>
    <slot/>
  </div>
</template>

<script setup lang="ts">
const props = defineProps(["iconName", "text", "type", "menuIconName", "menuTitle", "cusClassName"]);
</script>

<style lang="scss" scoped>
.control-bar-item {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .name {
    font-size: 12px;
    color: inherit;
    line-height: 1;
    font-weight: normal;
  }

  .arrow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(25px, -50%);
  }
}
.menu-title {
  color: #b3b3b3;
  padding: 0 10px;
  line-height: 30px;
  display: table-cell;
  vertical-align: middle;
  .iconfont {
    font-size: 20px !important;
    vertical-align: sub;
  }
}
</style>
<style>
.customer-popper {
  bottom: 57px;
  top: unset !important;
  border-radius: 0;
}
</style>
