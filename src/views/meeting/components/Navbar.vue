<template>
  <el-row class="nab-bar">
    <el-col class="h4" :span="8">案号：{{ meetingInfo.meetingName || "" }} (ID:{{ getNewMeetingId }})</el-col>
    <el-col :span="8" class="h4 text-center">
      <span>{{ meetingInfo.started ? `谈话时长:${onLineTime}` : "" }}</span>
      <span class="tool-videoTapping" v-if="meetingInfo.isVideoTap" @click="stopVideoTap">
              <svg-icon name="luzhi-hongse" color="#e62e2e" :size="14"/>
              <span class="ml5 h6">正在录制</span>
              <el-divider direction="vertical" style="height: 12px"></el-divider>
              <svg-icon name="juxing" :size="10"/>
            </span>
    </el-col>
    <el-col :span="8" class="text-right">
       <span class="btn-finish" @click="leaveMeeting">
        <svg-icon name="tuichu1" color="currentColor" :size="18"/>
        <i class="pl5" style="vertical-align: middle">退出</i>
      </span>
      <span class="btn-finish ml10" @click="finishMeeting">
        <svg-icon name="jieshu" color="currentColor" :size="20"/>
        <i class="pl5" style="vertical-align: middle">结束</i>
      </span>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
  import useMeetingTime from "@/hooks/useMeetingTime";
  import useVideoTap from "@/hooks/useVideoTap";

  let {stopVideoTap} = useVideoTap(); //录像
  const props = defineProps({
    meetingInfo: Object,
  });
  const emit = defineEmits(["finishMeeting", "leaveMeeting"]);
  const {getOnlineTime, onLineTime} = useMeetingTime(); //会议时间

  //会议ID加空格
  const getNewMeetingId = computed(() => {
    return props.meetingInfo.meetingCode ? props.meetingInfo.meetingCode.replace(/\s/g, "").replace(/(\w{3})(?=\w)/g, "$1 ") : "";
  });
  const finishMeeting = () => {
    emit("finishMeeting");
  };
  const leaveMeeting = () => {
    emit("leaveMeeting");
  };
  watch(
    () => props.meetingInfo,
    () => {
      getOnlineTime(props.meetingInfo);
    }
  );
</script>

<style lang="scss" scoped>
  .nab-bar {
    background: white;
    height: 48px;
    line-height: 48px;
    padding: 0 20px;
    box-shadow: 0 2px 1px 0 rgba(216, 216, 216, 0.2);

    .btn-finish {
      cursor: pointer;
      color: var(--el-color-danger);
      font-size: 14px;
      width: 100px;
    }

    /*录像中*/
    .tool-videoTapping {
      display: inline-block;
      width: 120px;
      height: 20px;
      line-height: 16px;
      text-align: center;
      background: #f2f2f2;
      margin-left: 10px;
      cursor: pointer;
    }
  }
</style>
