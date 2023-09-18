<template>
  <div class="video-panel" :class="isFull==='record' ? 'hidden' : ''">
    <!-- 视频区域-->
    <xsy-video class="video"
               :mediaInfo="mediaInfo"
               :streamInfo="haveCameraAttends"
               :selfId="userId"
               @setMicStatus="setMicStatus"
               @screenSharing="screenSharing"
               @deviceListChange="deviceListChange"
               @meetingStart="meetingStart"
    />
    <!-- 控制栏-->
    <control-bar @submit="handleDialog"/>
  </div>
</template>

<script setup lang="ts">
  import '@xsykj/video/es/css/xsyvideo.css'
  import '@xsykj/video/es/css/pull.css'
  import '@xsykj/video/es/css/push.css'
  import ControlBar from "./ControlBar/index.vue";
  import {syncSetMicroStatusApi} from "@/api/modules/mcs";
  import useShareScreen from "@/hooks/useShareScreen";
  import useEnumerateDevices from "@/hooks/useEnumerateDevices";
  import {getToken} from '@/utils/auth'
  import mittBus from "@/utils/mittBus";
  import {historyMessageApi} from "@/api/modules/wms";

  let {toggleShareScreen, shareStatus, cancelShare} = useShareScreen(); //共享屏幕
  let {currentDevice} = useEnumerateDevices(); //摄像头和麦克风
  const props = defineProps(["isFull", "meetingInfo"]);
  const emits = defineEmits(["submit", "start"]);
  const attendList = inject('attendList');
  const userId = getToken().userId;
  let mediaInfo = ref<MediaInfo | {}>({});
  let haveCameraAttends = ref<StreamInfo[]>([]);
  let messageGroup = ref([]); //聊天群组
  // 设置自己的静音和发言
  const setMicStatus = async (object) => {
    let params = {
      meetingId: props.meetingInfo.id,
      enable: object.status,
      users: [object.userId],
    };
    let response = await syncSetMicroStatusApi(params);
  };
  const screenSharing = (enable: boolean) => {
    if (enable) {
      toggleShareScreen(enable);
    } else {
      //如果enable为false
      //正在共享时，调用停止共享接口
      //没有共享时，调用取消共享接口
      if (shareStatus.value)
        toggleShareScreen(enable);
      else {
        emits("cancelShareScreen");
      }
    }
  };
  const meetingStart = () => {
    emits('start')
  };
  const handleDialog = (type) => {
    emits("handleDialog", type);
  };
  const deviceListChange = () => {
    mittBus.emit('DEVICE_LIST_CHANGE')
  };
  watch(() => props.meetingInfo, (newValue) => {
    mediaInfo.value = {
      rtcUrl: internet ? newValue?.outRtcUrl : newValue?.rtcUrl,
      homeScreen: newValue?.homeScreen,
      stunServer: newValue?.stunServer,
      videoDevice: '',//currentDevice.value.videoId,
      audioDevice: '',//currentDevice.value.audioInId
    };
    console.log("mediaInfo", mediaInfo.value);
  }, {deep: true});
  watch(() => attendList, () => {
    haveCameraAttends.value = [];
    if (attendList.value.length) {
      attendList.value.map(attend => {
        if (attend.resourceType === 0) {
          haveCameraAttends.value.push({
            mediaId: attend.mediaId,
            memberType: attend.memberType,
            resourceId: attend.resourceId,
            userId: attend.userId,
            micStatus: attend.micStatus,
            virtualBackground: attend.virtualBackground,
            screenUserId: attend.screenUserId,
            alias: attend.alias
          })
        }
      });
    }
  }, {deep: true});
  watch(() => currentDevice, (newValue, oldValue) => {
    mediaInfo.value = {
      ...mediaInfo.value,
      videoDevice: currentDevice.value.videoId,
      audioDevice: currentDevice.value.audioInId
    };
  }, {deep: true})
</script>

<style lang="scss" scoped>
  .video-panel {
    position: relative;
    flex: 1;
    overflow: hidden;

    .video {
      height: calc(100% - 56px)
    }

    &.hidden {
      flex: 0;
      margin: 0;
      display: none;
    }
  }
</style>
