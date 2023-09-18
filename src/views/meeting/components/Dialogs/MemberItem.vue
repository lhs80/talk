<template>
  <el-row class="member-list-item" :class="onLine ? '' : 'offline'" align="middle" v-if="!state.isEditUserName">
    <el-col :span="2" class="text-center">
      <!--主视频图片-->
      <svg-icon name="zhuhuamian" :size="22" v-if="userInfo.userId === meetingInfo.homeScreen"></svg-icon>
    </el-col>
    <el-col :span="10">
      <!--姓名-->
      <span class="userName" :title="userInfo.alias">{{ userInfo.alias }}<i
        v-if="userInfo.userId === state.userId">(我)</i></span>
      <!--席位是否启用标识-->
      <span class="flag" v-if="userType === 'seat'">{{ onLine ? "启用" : "禁用" }}</span>
      <span class="flag" v-if="userType === 'attend'">{{ onLine ? "在线" : "离线" }}</span>
    </el-col>
    <el-col :span="2">
      {{userInfo.invitationCode}}
    </el-col>
    <!--右侧菜单-->
    <el-col :span="10" class="text-right" v-if="userType === 'seat' || (userType === 'attend' && onLine)">
      <!-- 静听 仅参会人显示-->
      <svg-icon
        :size="22"
        :name="userInfo.groupId === 0 ? 'tingtong-xian' : 'tingtong-jinyong'"
        :title="userInfo.groupId === 1 ? '取消禁听' : '禁听'"
        @click="forbidHear(userInfo)"
        v-if="!userInfo.interior&&userInfo.userId !== meetingInfo.homeScreen"
      />
      <svg-icon
        :size="22"
        name="renlianshibie"
        title="人脸识别"
        color="black"
        @click="controlFaceRecognition(userInfo, !userInfo.cameraTurn)"
        v-if="!userInfo.interior&&faceValidate"
      />
      <!-- 更多 参会人-->
      <el-dropdown size="small" placement="bottom-end" trigger="click"
                   v-if="userType === 'attend' && onLine && (userInfo.userId === state.userId || userInfo.userId !== meetingInfo.homeScreen)">
        <span>
          <svg-icon name="gengduo-xian" :size="22"/>
        </span>
        <template #dropdown>
          <el-dropdown-menu style="width: 80px">
            <el-dropdown-item v-if="userInfo.userId === state.userId"
                              @click="todoModifyUserName(userInfo.userId, userInfo.alias)"> 改名
            </el-dropdown-item>
            <el-dropdown-item v-if="userInfo.userId !== meetingInfo.homeScreen && userInfo.groupId!==1"
                              @click="setMainScreen">设为主画面
            </el-dropdown-item>
            <!--仅小程序显示-->
            <el-dropdown-item v-if="!userInfo.interior" @click="kickOut(userInfo)">移出</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- 更多 席位-->
      <el-dropdown size="small" placement="bottom-end" trigger="click" v-if="userType === 'seat'">
        <span>
          <svg-icon name="gengduo-xian" :size="22"/>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-if="onLine" @click="todoModifyUserName(userInfo.userId, userInfo.alias)"> 改名
            </el-dropdown-item>
            <el-dropdown-item v-if="userInfo.userId !== meetingInfo.homeScreen && onLine" @click="setMainScreen">设为主画面
            </el-dropdown-item>
            <el-dropdown-item @click="changeSeatStatus(userInfo.userId)">
              {{ userInfo.enable ? "禁用" : "启用" }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-col>
  </el-row>
  <!--修改姓名-->
  <el-row class="modify-username" align="middle" v-if="state.isEditUserName === userInfo.userId">
    <el-col :span="16">
      <el-input size="small" v-model="state.newUserName" maxlength="25"/>
    </el-col>
    <el-col :span="8" class="text-right">
      <el-button type="primary" size="small" @click="modifyUserName">保存</el-button>
      <el-button type="info" size="small" @click="state.isEditUserName = ''">取消</el-button>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
  import {
    syncSetMicroStatusApi,
    faceRecognitionApi,
    forbidListenApi,
    kictOutApi,
    changeNameApi,
    setHomeScreenApi
  } from '@/api/modules/mcs'
  // import {changeSeatStatusFun} from "@/api/court";
  import {getToken} from "@/utils/auth";
  import {ElMessageBox} from "element-plus";
  import useMeetingConfig from "@/hooks/useMeetingConfig";

  const props = defineProps(["userInfo", "userType", "onLine"]);
  const emits = defineEmits(["submit"]);
  const meetingInfo = inject("meetingInfo");
  const {faceValidate} = useMeetingConfig();
  const state = reactive({
    isEditUserName: "",
    newUserName: "",
    userId: getToken().userId,
  });
  /**
   * 设置主屏
   * **/
  const setMainScreen = async () => {
    let params = {
      meetingId: meetingInfo.value.id,
      userId: props.userInfo.userId,
    };
    //调用接口，向用户发送广播消息
    const response = await setHomeScreenApi(params.meetingId, params.userId);
    if (response) {
    }
  };
  /**
   * 准备修改姓名
   * **/
  const todoModifyUserName = (id, alias) => {
    state.isEditUserName = id;
    state.newUserName = alias;
  };
  /**
   * 修改姓名
   * **/
  const modifyUserName = async () => {
    const userInfo = {
      alias: state.newUserName,
      userId: state.isEditUserName,
    };
    const response = await changeNameApi(meetingInfo.value.id, userInfo);
    if (response) {
      await emits("submit");
      state.isEditUserName = "";
    }
  };
  /**
   * 启用禁用席位
   * **/
  const changeSeatStatus = async (id) => {
    const response = await changeSeatStatusFun(meetingInfo.value.meetingId, id, !props.onLine);
    if (response) {
      emits("submit");
      state.isEditUserName = "";
    }
  };
  /**
   * 人脸识别
   * **/
  const controlFaceRecognition = async (member, value) => {
    let params = {
      meetingId: meetingInfo.value.id,
      enable: value,
      users: [member.userId],
    };
    let response = await faceRecognitionApi(params);
    if (response.success) {
      emits("submit");
    }
  };
  /**
   * 禁听
   * **/
  const forbidHear = async (member) => {
    console.log(member);
    let params = {
      enable: !member.groupId,
      meetingId: meetingInfo.value.id,
      users: [member.userId]
    };
    let response = await forbidListenApi(params);
    if (response.success) {
      emits("submit");
    }
  };
  /**
   * 禁言
   * **/
  const setAudioStatus = async (member, isOpen) => {
    let params = {
      enable: isOpen,
      meetingId: meetingInfo.value.id,
      users: [member.userId]
    };
    let response = await syncSetMicroStatusApi(params);
    if (response.success) {
      emits("submit");
    }
  };
  /**
   * 踢出会议
   * **/
  const kickOut = async (member) => {
    ElMessageBox.confirm("确定要将该参会员请出会议吗？", "提醒", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    })
      .then(async () => {
        let response = await kictOutApi(meetingInfo.value.id, member.userId);
        if (response.success) {
          emits("submit");
        }
      })
      .catch(() => {
      });
  };
  /**
   * 设置全员发言/全员静音
   * **/
  const submit = async (member, status) => {
    let params = {
      meetingId: meetingInfo.value.orderId,
      enable: status,
    };
    if (typeof member === "object") {
      params.users = [member];
    }

    let response = await syncSetMicroStatusApi(params);
    if (response.success) {
      emits("submit");
    }
  };
</script>

<style lang="scss" scoped>
  .member-list-item {
    color: #051c33;
    font-size: 12px;
    background: #f8f9fa;
    margin-top: 8px;
    padding: 5px 0;

    .userName {
      display: inline-block;
      max-width: 100px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      vertical-align: middle;
      margin: 0 6px 0 0;
    }

    .flag {
      padding: 2px 5px;
      background: #148afe;
      border-radius: 1px;
      color: white;
      font-size: 12px;
    }

    /*离线*/
    &.offline {
      .userName {
        color: #d9d9d9;
      }

      .flag {
        background: #d9d9d9;
      }
    }
  }

  /*修改名称*/
  .modify-username {
    margin-top: 10px;

    ::v-deep(.el-input__inner) {
      border: 1px solid #148afe;
      border-radius: 0;
    }

    .el-button {
      border-radius: 0;
      border: none;
    }

    .el-button--info {
      color: #666666;
      background: #e6e6e6;
    }
  }
</style>
