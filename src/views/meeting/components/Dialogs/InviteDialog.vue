<template>
  <el-dialog v-model="props.show" title="邀请" width="700px" :before-close="close">
    <el-row class="meeting-info">
      <el-col :span="12">
        <p>谈话名称：{{ meetingInfo.meetingName }}</p>
        <p class="mt10">谈话时间：{{ meetingInfo.startTime }}</p>
        <p class="mt10">谈话ID：{{ meetingInfo.meetingCode }}</p>
      </el-col>
      <el-col :span="12" class="text-right">
        <el-button size="small" type="primary" plain @click="copyMeetingInfo">复制信息</el-button>
      </el-col>
    </el-row>
    <AddPersonForm ref="personForm" :canEdit="true" :isDisable="true" :isMeetingInvite="true" :data="personInfo"/>
    <template #footer>
      <el-button size="small" type="primary" @click="submit">短信邀请</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import {ElMessage, dayjs} from "element-plus";
  import {getMeetingInvitedApi, sendSmsApi} from "@/api/modules/mcs";
  import {resendApi} from "@/api/modules/sms";
  import {addCasePersonApi} from "@/api/modules/pbs";
  import {useClipboard} from "@vueuse/core";
  import {getToken} from "@/utils/auth";

  const props = defineProps(["show"]);
  const emits = defineEmits(["close"]);
  const {proxy} = getCurrentInstance();
  const {copy, isSupported} = useClipboard();
  const attendList = inject("attendList");
  const meetingInfo = inject("meetingInfo");
  const personForm = ref(null);
  const personInfo = ref({
    joinPersonList: [],
  });
  //表单信息
  let state = reactive({
    isSubmit: false,
    info: {},
  });
  //查询被邀请人
  const queryInviteUserList = async () => {
    let response = await getMeetingInvitedApi(meetingInfo.value.id);
    if (response.success) {
      response.data.map((item) => {
        item.sendShortMessage = false;
        item.userType = 1;
      });
      personInfo.value.joinPersonList = response.data;
    }
  };
  //提交表单,发送短信
  const submit = async () => {
    state.isSubmit = true;
    let joinMembers = [], newCasePerson = [];
    let personFormValid = await personForm.value.validForm();
    if (personFormValid) {
      let {joinPersonList} = personForm.value.formData;
      //查询有没有勾选人员
      let selectUserList = joinPersonList.filter((item) => {
        return item.sendShortMessage
      });

      joinPersonList.map((item) => {
        item.id = item.userId;
        if (item.userId) joinMembers.push(item);
        else newCasePerson.push(item);
      });
      //有勾选人员
      if (selectUserList.length) {
        //1、把新增加的人员提交到后端保存，保存成功后放入变量joinMembers中，准备提交到预约会议接口
        if (newCasePerson.length) {
          console.log("newCasePerson", newCasePerson);
          const response = await addCasePersonApi(newCasePerson);
          if (response.success) {
            response.data.forEach((item) => {
              let otherInfo = newCasePerson.find(user => {
                return item.telephone === user.telephone;
              });
              joinMembers.push({
                ...item,
                userRole: otherInfo.userRole,
                userType: 1,//内网0，外网1
                sendShortMessage: true,//item.sendShortMessage,
                reGenerate: item.reGenerate
              });
            });
          } else {
            return false;
          }
        }
        //发送短信
        sendSmsApi(meetingInfo.value.id, joinMembers).then((response) => {
          if (response.success) {
            ElMessage.success("发送成功！");
          }
        });
        close();
      } else {
        ElMessage.warning("请选择参与人！");
      }
    }
    state.isSubmit = false;
  };
  //复制谈话链接
  const copyMeetingInfo = () => {
    let {meetingName, meetingCode, startTime} = meetingInfo.value;
    let name = attendList.value.find((item) => {
      return item.userId === getToken().userId;
    });
    let content = `${name.alias}邀请您参加云视庭谈话系统\n谈话名称：${meetingName}\n谈话时间：${dayjs(startTime).format("YYYY年MM月DD日 HH:mm:ss ")}\n谈话ID：${meetingCode} `;
    if (!isSupported) {
      console.log("您的浏览器不支持Clipboard API");
      return;
    }
    //复制链接
    copy(content);
    ElMessage({
      message: "复制成功",
      type: "success",
    });
  };
  /**
   * 重新发送短信
   * **/
  const resendSMS = async (userId) => {
    const response = await resendApi(userId);
    if (response.success) {
      ElMessage.success("发送成功");
    }
    close();
  };
  const close = () => {
    emits("close");
  };
  watchEffect(() => {
    if (props.show) {
      queryInviteUserList();
    }
  });
</script>

<style lang="scss" scoped>
  .meeting-info {
    padding: 20px 30px 2px;
    border-radius: 6px;
    margin-bottom: 30px;
    font-size: 14px;
    color: #333333;
    background: #e9f4ff;
  }
</style>
