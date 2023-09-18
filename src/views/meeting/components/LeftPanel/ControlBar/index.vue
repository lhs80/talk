<template>
  <div class="control-wrapper">
    <!--聊天-->
    <control-bar-item iconName="liaotian3" text="聊天" @click.stop.prevent="showChatDialog">
      <el-badge :value="state.chatNum" v-if="state.chatNum > 0 && state.showDialog !== 'chat'"/>
    </control-bar-item>
    <!--麦克风选项 没接入法庭的时候显示-->
    <control-bar-item
      type="dropdown"
      menuIconName="maikefeng-huise"
      menuTitle="选择麦克风"
      iconName="jingyin2"
      text="音频选项"
      v-if="!isHaveUseCourt"
    >
      <template v-slot:menu>
        <el-dropdown-menu>
          <control-bar-sub-item
            v-for="item in getDevicesByType('audioinput')"
            :key="item.deviceId"
            :active="currentDevice.audioInId === item.deviceId"
            :text="item.label"
            @click.stop="changeAudioId(item.deviceId)"
          />
        </el-dropdown-menu>
      </template>
    </control-bar-item>
    <!--视频选项 没接入法庭的时候显示-->
    <control-bar-item type="dropdown" menuIconName="shipin-huise" menuTitle="选择摄像机" iconName="shipinzhonglian2"
                      text="视频选项" v-if="!isHaveUseCourt">
      <template v-slot:menu>
        <el-dropdown-menu>
          <control-bar-sub-item
            v-for="item in getDevicesByType('videoinput')"
            :key="item.deviceId"
            :active="currentDevice.videoId === item.deviceId"
            :text="item.label"
            @click.stop="changeVideoId(item.deviceId)"
          />
          <el-divider style="margin: 0"/>
          <!--虚拟背景-->
          <control-bar-sub-item
            @click.stop.prevent="commandHandle('virtualBg')"
            :active="mineInfo.virtualBackground"
            text="开启虚拟背景"
            tate.canUseVirtualBg
          />
          <!--          <el-divider style="margin: 0"></el-divider>-->
          <!--          <control-bar-sub-item @click.stop.prevent="commandHandle('reload')" text="视频重连"/>-->
        </el-dropdown-menu>
      </template>
    </control-bar-item>
    <!--视频重连 接入法庭的时候显示-->
    <!--    <control-bar-item iconName="shipinzhonglian1" text="视频重连" v-if="isHaveUseCourt"-->
    <!--                      @click.stop.prevent="commandHandle('reload')"></control-bar-item>-->
    <!--主持人可以控制屏幕分享-->
    <control-bar-item iconName="pingmugongxiang3" text="屏幕共享" v-if="!shareStatus"
                      @click.stop.prevent="commandHandle('shareScreen')"/>
    <control-bar-item iconName="pingmugongxiang3" text="停止共享" v-else
                      @click.stop.prevent="endShare(meetingInfo.meetingId)"/>
    <!--邀请-->
    <control-bar-item iconName="yaoqing2" text="邀请" @click="state.showDialog = 'invite'"/>
    <!--成员管理-->
    <control-bar-item iconName="chengyuanguanli3" text="成员管理"
                      @click.stop.prevent="state.showDialog = 'members'"/>
    <!--投屏-->
    <control-bar-item iconName="touping" text="投屏" v-if="!projectionScreenStatus"
                      @click.stop.prevent="projectionScreen"></control-bar-item>
    <control-bar-item iconName="touping-copy" class="text-danger" text="结束投屏" v-else
                      @click.stop.prevent="closeProjectScreen"/>
    <!--录像-->
    <control-bar-item iconName="luzhi" text="开始录像" v-if="!meetingInfo.isVideoTap"
                      @click.stop.prevent="beginVideoTap"/>
    <control-bar-item iconName="jieshuluzhi" text="停止录像" v-else @click.stop.prevent="stopVideoTap"/>
  </div>
  <Dialogs :menuName="state.showDialog" @close="closeDialog"></Dialogs>
</template>

<script setup lang="ts">
  import {useThrottleFn} from '@vueuse/core'
  import {getAppInfo} from "@/utils/appConfig";
  import {syncSetMicroStatusApi} from "@/api/modules/mcs";
  import useEnumerateDevices from "@/hooks/useEnumerateDevices";
  import useProjectScreen from "@/hooks/useProjectScreen";
  import useShareScreen from "@/hooks/useShareScreen";
  import useVideoTap from "@/hooks/useVideoTap";
  import Dialogs from "../../Dialogs/index.vue";
  import ControlBarItem from "./ControlBarItem.vue";
  import ControlBarSubItem from "./ControlBarSubItem.vue";
  import mittBus from '@/utils/mittBus'

  let mineInfo = inject("mineInfo");
  let meetingInfo = inject("meetingInfo"); //当前谈话信息
  let courtSeatList = inject("courtSeatList"); //加入席位列表
  let {currentDevice, changeDevice, machineList, getList} = useEnumerateDevices(); //摄像头和麦克风
  let {projectionScreenStatus, createProjectScreen, closeProjectScreen} = useProjectScreen(); //投屏
  let {shareStatus, startShare, endShare, onBrowserClick} = useShareScreen(); //共享
  let {beginVideoTap, stopVideoTap} = useVideoTap(); //录像

  let msgBox = null;
  const emit = defineEmits(["submit"]);
  const state = reactive({
    showDialog: "none",
    chatNum: 0,
    canUseVirtualBg: getAppInfo().virtualBackground === "true", //后台是否允许开启虚拟背景
  });
  //有可用席位时,才显示席位画面,麦克风和视频操作菜单才能隐藏
  const isHaveUseCourt = computed(() => {
    const courtList = courtSeatList.value.filter((item) => {
      return item.enable;
    });
    const isMineVideoClose = courtSeatList.value.filter((item) => {
      return item.linkUserId && item.enable && item.linkUserId === mineInfo.value.userId;
    });
    return isMineVideoClose.length; //courtList.length && isMineVideoClose;
  });
  //按类型过滤设备
  const getDevicesByType = computed(() => (type) => {
    return machineList.value.filter((item) => {
      return item.kind === type && item.deviceId;
    });
  });
  const commandHandle = useThrottleFn((cmd) => {
    emit("submit", cmd);
  }, 1000);
  /**
   * 接收聊天消息
   */
  const receiveMessage = () => {
    if (state.showDialog === "chat") return false;
    state.chatNum++;
    console.log(state.chatNum);
  };
  /**
   * 切换摄像头
   */
  const changeVideoId = useThrottleFn((data) => {
    changeDevice({
      videoId: data,
      audioInId: currentDevice.value.audioInId,
    });
  }, 1000);
  /**
   * 切换麦克风
   */
  const changeAudioId = useThrottleFn((data) => {
    changeDevice({
      videoId: currentDevice.value.videoId,
      audioInId: data,
    });
  }, 1000);

  /**
   * 新消息数量
   */
  const initMessageNumber = (event) => {
    let {newMessageNumber} = event.detail;
    state.chatNum = newMessageNumber;
  };
  /**
   * 初始化投屏对象
   */
  const projectionScreen = () => {
    createProjectScreen(meetingInfo.value);
  };
  /**
   * 设置自己的静音和发言
   * **/
  const setMicrophone = async () => {
    let params = {
      meetingId: meetingInfo.value.id,
      enable: !mineInfo.value.micStatus,
      users: [mineInfo.value.userId],
    };
    let response = await syncSetMicroStatusApi(params);
  };
  /**
   * 设备列表变化
   * **/
  const deviceListChange = async () => {
    if (!msgBox)
      msgBox = ElMessage({
        message: '检测到设备切换',
        type: 'info',
        onClose: () => {
          msgBox = null
        }
      });
    await getList();
  };
  /**
   * 关闭弹窗
   * **/
  const closeDialog = () => {
    state.showDialog = "";
  };
  const showChatDialog = () => {
    state.showDialog = "chat";
    state.chatNum = 0;
  };
  onMounted(() => {
    mittBus.on("CHAT", receiveMessage); //接收消息成功
    mittBus.on("DEVICE_LIST_CHANGE", deviceListChange); //接收消息成功
  });
  onBeforeUnmount(() => {
    // mittBus.off("CHAT", receiveMessage); //接收消息成功
    mittBus.off("DEVICE_LIST_CHANGE", deviceListChange); //接收消息成功
  })
</script>

<style lang="scss" scoped>
  .control-wrapper {
    position: absolute;
    bottom: 0;
    left: 0;
    background: #f8f9fa;
    width: 100%;
    display: flex;
    flex-direction: row;
    height: 56px;
    z-index: 20;

    .el-badge {
      position: absolute;
      top: 0;
      left: 50%;
    }
  }
</style>
