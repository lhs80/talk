<template>
  <aside class="main-wrapper">
    <common-header @back="back"/>
    <div class="main-content">
      <!--左侧-->
      <div class="main-left">
        <div class="now">
          <p>{{ state.time }}</p>
          <p>{{ dayjs().locale('zh-cn').format("YYYY年MM月DD日 dddd") }}</p>
        </div>
        <div class="menu-wrapper">
          <div class="appointment" @click="router.push('/order/add')">
            <svg-icon name="icon_yuyuetanhua" color="white" :size="55"/>
            <p class="h3">预约谈话</p>
          </div>
          <div class="other">
            <div class="join" @click="state.showDialog = 'join'">
              <svg-icon name="jiaru" color="white" :size="55"/>
              <p class="h3 mt10">立即加入</p>
            </div>
            <div class="bottom">
              <div class="quick" @click="quickBegin">
                <svg-icon name="icon_kuaisukaishi" color="white" :size="55"/>
                <p class="h3 mt10">快速开始</p>
              </div>
              <div class="mine" @click="router.push('/mine-talk')">
                <svg-icon name="icon_tanhua" color="white" :size="55"/>
                <p class="h3 mt10">我的谈话</p>
              </div>
            </div>
          </div>
        </div>
        <div class="copyright">
          {{ state.copyright }}<span class="ml10">{{ config.version }}</span>
        </div>
      </div>
      <!--右侧-->
      <div class="main-right">
        <!-- 会议列表-->
        <meeting-list/>
      </div>
    </div>
    <!--立即加入-->
    <join-dialog :show="state.showDialog === 'join'" @close="closeDialog" @submit="intoMeeting"/>
  </aside>
</template>

<script setup lang="ts">
  import {getMeetingEffectiveApi, meetingQuickReserveApi} from "@/api/modules/mcs";
  import {getAppInfo} from "@/utils/appConfig";
  import {dayjs} from "element-plus";
  import 'dayjs/locale/zh-cn'
  import MeetingList from "./components/MeetingList/index.vue"; //会议列表
  import JoinDialog from "./components/JoinDialog/index.vue"; //立即加入
  import {versionString} from "@/utils/getVersion";
  import config from '../../../package.json'

  let timer = null;

  const router = useRouter();
  const {proxy} = getCurrentInstance();
  let state = reactive({
    settingInfo: {},
    meetingList: [],
    showDialog: "",
    meetingId: "",
    loading: false, // 加载的loading
    time: dayjs().format("HH:mm"),
    copyright: getAppInfo().copyrightInformation,
    versions: '',//process.env.VUE_APP_versions,
  });

  //快速开始
  const quickBegin = async () => {
    state.loading = true;
    let response = await meetingQuickReserveApi(1);
    if (response.success) {
      router.replace({
        path: "/meeting",
        query: {
          meetingId: response.data.meetingId,
        },
      });
      state.loading = false;
    } else {
      state.loading = false;
    }
  };
  //立即加入&&加入谈话&&开始谈话
  const intoMeeting = async (meetingId) => {
    let response = await getMeetingEffectiveApi(meetingId);
    if (response.success) {
      router.push({
        path: "/meeting",
        query: {
          meetingId: response.data,
        },
      });
    }
  };
  //编辑谈话
  const editMeeting = (meetingId) => {
    state.meetingId = meetingId;
    state.showDialog = "order";
  };
  const getCurrentTime = () => {
    timer = setInterval(() => {
      state.time = dayjs().format("HH:mm");
    }, 1000);
  };
  //关闭页面弹窗
  const closeDialog = () => {
    state.showDialog = "";
    state.meetingId = "";
  };
  //关闭窗口
  const back = () => {
    window.location.href = '/yst/uicp/main.html#/main'
  };
  onMounted(() => {
    getCurrentTime();
  });
  onUnmounted(() => {
    clearInterval(timer);
  });
</script>

<style lang="less" scoped>
  .main-wrapper {
    display: flex;
    position: relative;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: url("../../assets/images/bg-main.png") no-repeat top left;
    background-size: cover;
    overflow: hidden;

    .main-content {
      display: flex;
      flex-direction: row;
      flex: 1;
      overflow: auto;

      .main-left {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 2% 290px 38px 178px;
        box-sizing: border-box;

        .now {
          color: #333333;
          font-size: 18px;
          font-family: "element-icons";

          p:first-child {
            color: #0948a9;
            font-size: 56px;
            font-weight: bold;
          }
        }

        .menu-wrapper {
          display: flex;
          flex-direction: row;
          width: 100%;
          margin: 39px 0 10% 0;
          flex: 1;
          color: white;
          text-align: center;
          font-size: 15px;

          .appointment {
            width: 30%;
            height: 100%;
            background: linear-gradient(135deg, #9983fd 1%, #1453de 58%, #054495);
            margin-right: 20px;
            border-radius: 8px;
            cursor: pointer;
          }

          .other {
            flex: 1;
            display: flex;
            flex-direction: column;

            .join {
              width: 100%;
              flex: 1;
              background: linear-gradient(135deg, #56b7f9 1%, #1d68ba);
              border-radius: 8px;
              cursor: pointer;
            }

            .bottom {
              flex: 1;
              display: flex;
              flex-direction: row;
              margin-top: 20px;

              .quick,
              .mine {
                flex: 1;
                background: linear-gradient(135deg, #69ccfa 1%, #0ea6cd 99%);
                border-radius: 8px;
                cursor: pointer;
              }

              .mine {
                margin-left: 20px;
              }
            }
          }

          .appointment,
          .other .join,
          .other .quick,
          .other .mine {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            &:hover {
              transform: scale(1.05);
            }
          }
        }

        .copyright {
          font-size: 14px;
          color: #666464;
        }
      }

      .main-right {
        width: 26%;
        background: rgba(255, 255, 255, 0.6);
        display: flex;
        flex-direction: column;
        margin: 54px 20px 40px 0;
        overflow: auto;
      }
    }
  }
</style>
