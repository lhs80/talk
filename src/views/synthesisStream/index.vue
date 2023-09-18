<template>
  <div class="menu">
    <div id="player"></div>
    <div class="info">
      <span>案号：{{ state.meetingId }}</span>
      <span>时间：{{ state.onLineTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import useMeetingTime from "@/hooks/useMeetingTime";

  let attendeeClient = null;
  const route = useRoute();
  const {onLineTime, getOnlineTime} = useMeetingTime();
  const state = reactive({
    meetingId: "",
  });
  // 拉合成流
  const subscribeChannel = () => {
    let data = route.query;
    state.meetingId = data.meetingId;
    const channelId = data.mcMixId;
    const stunServer = data.stunServer;
    const ROLE_TYPE = KConference.ROLE_TYPE;
    const cfg = {
      role: ROLE_TYPE.ATTENDEE,
    };
    attendeeClient = KConference.createClient(cfg);
    attendeeClient.initSubscriber({
      selector: "#player", // 媒体存放容器
      loading: true, // 是否开启内部loading
      showMessage: true,
    });
    // 不拉声音
    attendeeClient.on("loadedmetadata", () => {
      attendeeClient.volume(0);
    });
    attendeeClient.on("error", (err) => {
      console.log(JSON.stringify("拉合成流错误：" + JSON.stringify(err)));
    });
    const nmediaConfig = {
      nmediaSocketUrl: data.rtcUrl,
      nmediaId: 10,
      stunServer,
    };
    const subscribeConfig = {
      nmediaConfig,
      channelId,
      autoplay: true,
    };
    attendeeClient.subscribe(subscribeConfig);
  };
  /**
   * 谈话时长
   * **/
  const setKeepTime = () => {
    let params = {
      startTime: route.query.startTime,
      serverTime: route.query.serverTime
    };
    getOnlineTime(params);
  };
  onMounted(() => {
    setKeepTime();
    subscribeChannel();
  });
</script>

<style scoped lang="scss">
  .menu {
    width: 100vw;
    height: 100vh;
    position: relative;
    background: #222;

    #player {
      width: 100vw;
      height: 100vh;
    }

    .info {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 9;
      color: #fff;
      font-size: 16px;
      width: 200px;
      height: 80px;
      background-color: rgba(5, 28, 51, 0.2);

      span {
        display: block;
        /*margin: 10px 20px;*/
      }
    }
  }
</style>
