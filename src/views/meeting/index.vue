<template>
  <aside class="meeting-wrapper" v-loading="state.loading" element-loading-background="rgba(0, 0, 0, 0.8)">
    <!--导航-->
    <nav-bar :meetingInfo="meetingInfo" @finishMeeting="finishMeeting" @leaveMeeting="leaveMeeting"/>
    <div class="main-content">
      <!--视频画面-->
      <left-panel :isFull="state.isFull"
                  :meetingInfo="meetingInfo"
                  :attendList="attendList"
                  @start="noticeService"
                  @cancelShareScreen="cancelShareScreen"
                  @handleDialog="handleDialog"/>
      <!--笔录材料-->
      <right-panel :isFull="state.isFull" :meetingInfo="meetingInfo"/>
      <full-screen-button :isFull="state.isFull" @handleFull="handleFull"/>
    </div>
    <!--共享屏幕中-->
    <div ref='dragEl' :style="style" class="tool-shareScreen" v-if="shareStatus && state.isFull === 'record'">
      <span>正在共享屏幕</span>
      <el-divider direction="vertical"/>
      <svg-icon name="luzhi-hongse" :size="24" color="red"/>
      <span @click="endShare(meetingInfo.meetingId)">停止共享</span>
    </div>
    <!-- 会议结束时的提示-->
    <el-dialog v-model="state.showCountDownDlg" title="提醒" width="300px" :show-close="false"
               :close-on-click-modal="false">
      <span>{{ state.tipContent }}</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" size="small" @click="goBack">立即退出系統({{ state.tipsNum }})</el-button>
        </div>
      </template>
    </el-dialog>
  </aside>
</template>

<script setup lang="ts">
  import {
    joinMeetingApi,
    leaveMeetingApi,
    setVirtualBgStatusApi,
    noticeServiceUserJoinApi,
    getScreenInfoApi,
    meetingRenewApi,
    overMeetingApi,
    startMeetingApi
  } from '@/api/modules/mcs'
  import {historyMessageApi} from '@/api/modules/wms'
  import {getToken} from "@/utils/auth";
  import NavBar from "./components/Navbar.vue"; //导航栏
  import LeftPanel from "./components/LeftPanel/index.vue";
  import RightPanel from "./components/RightPanel/index.vue";
  import FullScreenButton from './components/FullScreenButton/index.vue'
  import {ElMessage, ElMessageBox} from "element-plus";
  import useProjectScreen from "@/hooks/useProjectScreen"; //投屏
  import useShareScreen from "@/hooks/useShareScreen";
  import useEnumerateDevices from "@/hooks/useEnumerateDevices";
  import {getScreenInfo, removeScreenInfo, setScreenInfo} from "@/utils/screen"; //投屏
  import mittBus from '@/utils/mittBus'
  import {useDraggable} from '@vueuse/core'

  let timer = null; //退出倒计时
  let msgObj = null;
  const userId = getToken().userId;
  //设置“正在共享”提示可拖动
  const dragEl = ref<HTMLElement | null>(null);
  const {x, y, style} = useDraggable(dragEl, {
    initialValue: {x: 40, y: 200},
  });
  const route = useRoute();
  const router = useRouter();
  let meetingInfo = ref({}); //会议相关信息
  let mineInfo = ref({}); //当前用户的相关信息，使用ref是为了方便赋值，并且保持响应式
  let attendList = ref([]); //参会人列表
  let courtSeatList = ref([]); //席位列表
  let meetingId = ref(route.query.meetingId);
  let messageGroup = ref([]); //聊天群组
  let {closeProjectScreen} = useProjectScreen(); //投屏
  let {shareStatus, endShare, cancelShare} = useShareScreen(meetingInfo.value.meetingId); //共享

  let state = reactive({
    showDialog: null,
    tipsNum: 3, //提示谈话结束的倒计时秒数
    tipContent: "", //退出谈话提示内容
    isFull: "",
    currRecorderId: "", //转移记录人后，当前记录人ID
    loading: false,
    showCountDownDlg: false, //会议结束退出谈话提示框
    closeVideoUserId: "", //接入法庭后,要关闭的视频流对象
  });
  //全屏开关
  const handleFull = (value) => {
    state.isFull = value;
  };
  //获取推流信息
  const joinMeeting = async () => {
    state.loading = true;
    const videoDevices = await KConference.enumerateDevices();
    const isHaveCamera = videoDevices.filter(item => {
      return item.kind === "videoinput";
    });
    let params = {
      meetingId: meetingId.value,
      resourceType: isHaveCamera.length ? 0 : 2//0 - 音视频,2 - 无,default:0
    };
    let response = await joinMeetingApi(params);
    if (response.success) {
      if (isHaveCamera.length)
        initHostClient(response.data);
      else {
        await updateMeetingData(response.data);
        await noticeService();
      }
    } else {
      //进入谈话失败，提示用户退出
      onErrorTips(response.message);
    }
  };
  //用户第一次入会时的数据处理
  const initHostClient = (data) => {
    //延时1秒给数据，确保虚拟背景可以打开
    setTimeout(() => {
      attendList.value = attendList.value.slice(0, 0); //清空参会人
      let {memberInfos, recordId, ...otherParams} = data || {};

      //当前用户信息
      attendList.value = memberInfos;
      // }, 500);
      mineInfo.value = memberInfos.find((item) => {
        return item.userId === userId;
      });
      //会议相关信息
      meetingInfo.value = {
        isVideoTap: !!recordId, //是否正在录像
        ...otherParams,
      };
    }, 1000)
  };
  //通知服务器用户入会
  const noticeService = async () => {
    console.log('::用户入会通知::');
    let response = await noticeServiceUserJoinApi(meetingInfo.value.id);
    if (response.success) {
      if (!response.data.started) {
        let startResponse = await startMeetingApi(meetingInfo.value.id);
      } else {
        updateMeetingData(response.data);
      }
      // await chatInit();
      state.loading = false;
    }
  };
  //其他参会人加入谈话回调
  const userJoin = (e) => {
    if (e) {
      let {userName, userId} = e[0];
      if (userId === getToken().userId) return;//自己加不入提醒
      let isHave = attendList.value.find(user => {
        return user.userId === userId;
      });
      if (isHave) return;
      ElMessage.success({
        message: `用户${userName}加入了会议!`,
      });
      attendList.value.push(e[0]);
    }
  };
  //法庭中的席位加入
  const joinCourtSeat = (e) => {
    if (e) {
      updateMeetingData(e);
    }
  };
  //用户修改姓名的回调
  const modifyUserName = (e) => {
    if (e) {
      attendList.value.map((item) => {
        if (item.userId === e.userId) {
          item.alias = e.alias;
        }
      });
    }
  };
  //参会人发生变化时，重新整理参会人、会议、席位的数据
  const updateMeetingData = (data) => {
    state.closeVideoUserId = ""; //把被关闭的用户ID清空
    mineInfo.value = {};
    attendList.value = attendList.value.slice(0, 0); //清空参会人
    courtSeatList.value = courtSeatList.value.slice(0, 0); //清空席位
    let {memberInfos, seatList, recordId, ...otherParams} = data || {};
    //当前用户信息
    mineInfo.value = memberInfos.find((item) => {
      return item.userId === userId;
    });
    if (seatList && seatList.length) {
      //席位列表
      seatList.forEach((item) => {
        if (item.linkUserId && item.enable) state.closeVideoUserId = item.linkUserId; //记录要关闭的用户ID
        courtSeatList.value.push(item);
      });
    } else {
      seatList = [];
    }
    //参会人列表
    attendList.value = [...memberInfos, ...seatList].filter((item) => {
      return (item.online || item.enable) && item.userId !== state.closeVideoUserId;
    });
    //会议相关信息
    meetingInfo.value = {
      // orderId: id,
      isVideoTap: !!recordId, //是否正在录像
      ...otherParams,
    };
    if (mineInfo.value.virtualBackground) {
      //因为设置虚拟背景时，取的是mineInfo.value.virtualBackground的相反值，所以这里要设置为false;
      mineInfo.value.virtualBackground = false;
      setVirtualBgStatus();
    }
  };
  //结束谈话
  const finishMeeting = () => {
    let contentStr = "是否确认结束谈话?所有参与人均将退出本次谈话?";
    ElMessageBox.confirm(contentStr, "提醒", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    }).then(async () => {
      //退出前，检测是不是在分享桌面，如果正在分享，停止分享；
      if (shareStatus.value) endShare(); //20221021 停止屏幕分享，防止用户不停止分享，直接退出会议
      state.loading = true;
      let response = await overMeetingApi(meetingId.value);
      await goBack();
    });
  };
  //退出谈话
  const leaveMeeting = () => {
    let contentStr = "是否确认退出谈话?";
    ElMessageBox.confirm(contentStr, "提醒", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    }).then(async () => {
      //退出前，检测是不是在分享桌面，如果正在分享，停止分享；
      if (shareStatus.value) endShare(); //20221021 停止屏幕分享，防止用户不停止分享，直接退出会议
      state.loading = true;
      let response = await leaveMeetingApi(meetingId.value);
      await goBack();
    });
  };
  //参会人离开谈话
  const quitRoom = (e) => {
    if (e) {
      let {userId, userName} = e[0]; //离开谈话用户的ID
      //记录与退出人ID相同的参会人的数组下标，因为分享屏幕的用户会有两条数据，所有使用数组记录
      let leaveUserIndex = [];
      ElMessage.success(`用户${userName}退出了会议!`);
      attendList.value.forEach((attend, index) => {
        if (attend.userId === userId) leaveUserIndex.push(index);
      });
      //删除退出用户数据
      if (leaveUserIndex.length) {
        for (let i = leaveUserIndex.length - 1; i >= 0; i--) {
          attendList.value.splice(leaveUserIndex[i], 1);
        }
      }
    }
  };
  //谈话被解散
  const dismissRoom = async (e) => {
    if (e.sender === getToken().userId) {
      await goBack();
      return false;
    }
    state.tipContent = "当前谈话已结束";
    state.showCountDownDlg = true;
    timer = setInterval(() => {
      if (state.tipsNum > 1) {
        state.tipsNum--;
      } else {
        goBack();
      }
    }, 1000);
  };
  //接口错误或谈话结束时的，提示用户退出的提示框
  const onErrorTips = (content) => {
    state.tipContent = content;
    showErrorTipDialog(content)
  };
  //退出页面
  const goBack = async () => {
    state.loading = false;
    clearInterval(timer);
    if (route.query.source === "tdh") {
      await router.push("/");
    } else {
      await router.replace("/main");
    }
  };
  //获取分享屏幕的信息
  const todoShareScreen = async () => {
    let response = await getScreenInfoApi(meetingInfo.value.id);
    if (response.success) {
      attendList.value.push(response.data);
      //缓存共享信息
      setScreenInfo(true);
    }
  };
  //结束屏幕分享广播消息回调
  const stopShareScreen = async (e) => {
    removeScreenInfo();
    //删除缓存的共享屏幕信息
    let leaveUserIndex = [];
    attendList.value.forEach((attend, index) => {
      if (attend.memberType === 1) leaveUserIndex.push(index);
    });
    if (leaveUserIndex.length) {
      for (let i = leaveUserIndex.length - 1; i >= 0; i--) {
        attendList.value.splice(leaveUserIndex[i], 1);
      }
    }
  };  //结束屏幕分享广播消息回调
  const cancelShareScreen = async () => {
    cancelShare();
    //删除缓存的共享屏幕信息
    let leaveUserIndex = [];
    attendList.value.forEach((attend, index) => {
      if (attend.memberType === 1) leaveUserIndex.push(index);
    });
    if (leaveUserIndex.length) {
      for (let i = leaveUserIndex.length - 1; i >= 0; i--) {
        attendList.value.splice(leaveUserIndex[i], 1);
      }
    }
  };
  //开始屏幕分享广播消息回调
  const beginShareScreen = (e) => {
    if (e) {
      removeScreenInfo();
      if (e.screenUserId !== getToken().userId) {
        let isHave = attendList.value.filter(item => {
          return item.memberType === 1
        });
        if (!isHave.length) {
          attendList.value.push(e);
        }
      }
    }
  };
  // 设置静音
  const setMicroStatusSuccess = (e) => {
    if (e) {
      let {enable, users} = e;
      //更新参会人麦克风状态
      attendList.value.map(user => {
        if (users.indexOf(user.userId) >= 0) {
          user.micStatus = enable;
        }
      });
    }
  };
  //设置录像状态后， 广播消息回调
  const setVideoStatus = (e) => {
    meetingInfo.value.isVideoTap = e;
  };
  //是否开启虚拟背景
  const setVirtualBgStatus = async () => {
    let param = {
      enable: !mineInfo.value.virtualBackground,
      meetingId: meetingInfo.value.id,
      users: [mineInfo.value.userId],
    };
    let response = await setVirtualBgStatusApi(param);
    if (response.success) {
      attendList.value.map((item) => {
        if (item.userId === response.userId) item.virtualBackground = response.enable;
      });
      mineInfo.value.virtualBackground = !mineInfo.value.virtualBackground;
    }
  };
  //视频重连
  const reload = async () => {
    if (!msgObj)
      msgObj = ElMessage({
        message: "视频重连中...",
        duration: 3000,
        type: "success",
        onClose: () => {
          msgObj = null;
        },
      });
    await joinMeeting();
  };
  // 控制栏操作回调
  const handleDialog = async (type) => {
    switch (type) {
      case "virtualBg": //虚拟背景
        await setVirtualBgStatus();
        break;
      case "shareScreen": //分享屏幕
        // const videoDevices = await KConference.enumerateDevices();
        // const isHaveCamera = videoDevices.filter(item => {
        //   return item.kind === "videoinput";
        // });
        // if (!isHaveCamera.length) {
        //   ElMessage.info("未检测到摄像头,无法共享屏幕!");
        //   return false;
        // }
        await todoShareScreen();
        break;
    }
  };
  //显示会议异常结束时的提示
  const showErrorTipDialog = (content) => {
    ElMessageBox.alert(content, '提示', {
      confirmButtonText: '退出系统',
      callback: () => {
        goBack();
      },
    })
  };
  //监听网格恢复
  const reconnectNetWork = () => {
    console.log("网络连接恢复");
  };
  //监听网格断开
  const breakNetWork = () => {
    ElMessageBox.confirm("系统检测到网络异常,请检查网络连接后尝试重连.", "提醒", {
      confirmButtonText: "重连",
      showCancelButton: false,
    }).then(async () => {
      window.location.reload();
    });
  };
  // 更新主屏幕
  const updateMainScreen = (e) => {
    meetingInfo.value.homeScreen = e;
  };
  //禁听
  const forbidListen = (e) => {
    attendList.value.forEach(item => {
      if (item.userId === e.users[0])
        item.groupId = Number(e.enable)
    });
  };
  //移出会议
  const driveOutMeeting = (e) => {
    if (e) {
      let {userId} = e[0]; //离开谈话用户的ID
      //记录与退出人ID相同的参会人的数组下标，因为分享屏幕的用户会有两条数据，所有使用数组记录
      let leaveUserIndex = [];
      attendList.value.forEach((attend, index) => {
        if (attend.userId === userId) leaveUserIndex.push(index);
      });
      //删除退出用户数据
      if (leaveUserIndex.length) {
        for (let i = leaveUserIndex.length - 1; i >= 0; i--) {
          attendList.value.splice(leaveUserIndex[i], 1);
        }
      }
    }
  };
  //翻转摄像头
  const cameraTurn = (e) => {
    if (e) {
      const {users, enable} = e;
      attendList.value.forEach(item => {
        if (users.includes(item.userId))
          item.cameraTurn = enable
      });
    }
  };
  //会议续期
  const meetingRenewal = (e) => {
    if (e) {
      ElMessageBox.confirm(e ? e : "会议已达最大时长", "提醒", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(async () => {
        let response = await meetingRenewApi(meetingInfo.value.id);
      })
    }
  };
  // websocket重连时，判断自己是否在线，不在线时需要重新调用加入会议接口
  const meetingInit = (e) => {
    if (e) {
      let mineInfo = e.memberInfos.find(item => {
        return item.userId === getToken().userId
      });
      if (!mineInfo.online) {
        joinMeeting()
      }
    }
  };
  const isHaveNotStartedShareScreen = () => {
    if (getScreenInfo()) {
      cancelShare();
      removeScreenInfo();
    }
  };
  //监听共享状态，开始共享时，最大化笔录
  watch(
    () => shareStatus.value,
    () => {
      state.isFull = shareStatus.value ? "record" : "";
    }
  );
  onMounted(() => {
    // 阻止浏览器回退按钮
    joinMeeting();
    isHaveNotStartedShareScreen();//是否有没有开始的共享屏幕信息
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
    mittBus.on('AUDIO_ENABLE', setMicroStatusSuccess);//麦克风操作
    mittBus.on('RECORD_SWITCH', setVideoStatus);//录像状态监听事件
    mittBus.on('JOIN_MEETING', userJoin);//用户加入
    mittBus.on('LEAVE_MEETING', quitRoom); //参会人退出，重新赋值人员列表
    mittBus.on("START_SCREEN_SHARING", beginShareScreen); //屏幕分享开始指令；
    mittBus.on("HOME_SCREEN", updateMainScreen); //用户修改了主画面
    mittBus.on("MEMBER_RENAME", modifyUserName); //用户修改了姓名
    mittBus.on("onBrowserClick", cancelShare); //取消分享
    mittBus.on("STOP_SCREEN_SHARING", stopShareScreen); //结束分享
    mittBus.on("OVER_MEETING", dismissRoom); //解散会议
    mittBus.on("MEMBER_FORBID_LISTEN", forbidListen); //禁听
    mittBus.on("REMOVE_MEETING", driveOutMeeting); //移出会议
    mittBus.on("CAMERA_TURN_ENABLE", cameraTurn); //翻转摄像头
    mittBus.on("START_MEETING", (e) => updateMeetingData(e));
    mittBus.on("MEETING_RENEWAL", meetingRenewal); //会议超过最大时限
    mittBus.on("MEETING_INIT", meetingInit); //会议初始化
    //=============================================================================
    window.addEventListener("online", reconnectNetWork);
    window.addEventListener("offline", breakNetWork);
  });
  onBeforeRouteLeave(() => {
    //退出前关闭所有弹窗
    ElMessageBox.close();
    mittBus.off('AUDIO_ENABLE', setMicroStatusSuccess);//麦克风操作
    mittBus.off('RECORD_SWITCH', setVideoStatus);//录像状态监听事件
    mittBus.off('JOIN_MEETING', userJoin);//用户加入
    mittBus.off('LEAVE_MEETING', quitRoom); //参会人退出，重新赋值人员列表
    mittBus.off("START_SCREEN_SHARING", beginShareScreen); //屏幕分享开始指令；
    mittBus.off("HOME_SCREEN", updateMainScreen); //用户修改了主画面
    mittBus.off("MEMBER_RENAME", modifyUserName); //用户修改了姓名
    mittBus.off("onBrowserClick", cancelShare); //取消分享
    mittBus.off("STOP_SCREEN_SHARING", stopShareScreen); //结束分享
    mittBus.off("OVER_MEETING", dismissRoom); //解散会议
    mittBus.off("MEMBER_FORBID_LISTEN", forbidListen); //禁听
    mittBus.off("REMOVE_MEETING", driveOutMeeting); //移出会议
    mittBus.off("CAMERA_TURN_ENABLE", cameraTurn); //翻转摄像头
    mittBus.off("START_MEETING", (e) => updateMeetingData(e));
    mittBus.off("MEETING_RENEWAL", meetingRenewal); //会议超过最大时限
    mittBus.off("MEETING_INIT", meetingInit); //会议初始化
    closeProjectScreen();
  });
  provide("mineInfo", mineInfo);
  provide("attendList", attendList);
  provide("messageGroup", messageGroup);
  provide("meetingInfo", meetingInfo);
  provide("courtSeatList", courtSeatList);
</script>

<style lang="scss" scoped>
  .meeting-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fafbfc;

    .main-content {
      position: relative;
      display: flex;
      flex-direction: row;
      flex: 1;
      height: 0;
      margin-top: 2px;
      overflow: hidden;
    }

    /*屏幕共享中*/
    .tool-shareScreen {
      cursor: pointer;
      position: fixed;
      top: 190px;
      left: 16px;
      width: 240px;
      height: 40px;
      line-height: 40px;
      font-size: 14px;
      text-align: center;
      background: white;
      box-shadow: 0 8px 10px -5px rgba(0, 0, 0, 0.08);
      z-index: 25;
    }
  }
</style>
