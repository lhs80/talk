<!--预约会议上传材料-->
<template>
  <aside class="note-wrapper">
    <common-header @back="close"/>
    <div class="main-content">
      <el-tabs>
        <el-tab-pane label="谈话笔录" v-if="state.type === 'check'">
          <history-record :info="state.meetingInfo"/>
        </el-tab-pane>
        <el-tab-pane label="谈话材料">
          <talk-material :info="state.meetingInfo" :type="state.type"/>
        </el-tab-pane>
        <el-tab-pane label="格式文书" v-if="state.type !== 'check'">
          <share-material :info="state.meetingInfo"/>
        </el-tab-pane>
      </el-tabs>
    </div>
  </aside>
</template>

<script setup lang="ts">
  import {getMeetingInfoApi} from "@/api/modules/mcs";
  import {ElMessage} from 'element-plus'

  const route = useRoute();
  const router = useRouter();
  const state = reactive({
    type: route.query.type,
    meetingInfo: {},
  });
  const getHistoryMeetingInfo = async () => {
    let response = await getMeetingInfoApi(route.query.meetingId);
    if (response.success) {
      if (response.data)
        state.meetingInfo = response.data;
      else
        ElMessage.info("未查询到相关数据")
    }
  };
  const close = () => {
    if (state.type === "check") router.push("/mine-talk");
    else router.push("/main");
  };
  watch(() => route.query, (newValue, oldValue) => {
    if (newValue.meetingId && newValue.meetingId !== oldValue.meetingId) {
      getHistoryMeetingInfo();
    }
  });
  onMounted(() => {
    getHistoryMeetingInfo();
    //阻止浏览器回退按钮
    if (window.history && window.history.pushState) {
      window.history.pushState(null, null, document.URL);
      window.addEventListener(
        "popstate",
        () => {
          window.history.pushState(null, null, document.URL);
        },
        false
      );
    }
  });
</script>

<style lang="scss">
  .note-wrapper {
    height: 100%;
    background: #fafbfc;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .main-content {
      padding: 15px;
      flex: 1;
      height: 0;
      box-sizing: border-box;

      .el-tabs {
        height: 100%;

        .el-tabs__header {
          margin: 0 !important;

          .el-tabs__nav-wrap::after {
            display: none;
          }

          .el-tabs__nav {
            .el-tabs__active-bar {
              display: none;
            }

            .el-tabs__item {
              width: 80px;
              height: 30px;
              line-height: 30px;
              padding: 0;
              text-align: center;
              background: white;
              font-size: 14px;
              color: #148afe !important;
              box-sizing: border-box;
              border: 1px solid #148afe;

              &.is-active {
                background: #148afe;
                color: white !important;
              }
            }
          }
        }

        .el-tabs__content {
          background: #f0f2f5;
          height: calc(100% - 30px);

          .el-tab-pane {
            height: 100%;
          }
        }
      }
    }
  }
</style>
