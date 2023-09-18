<template>
  <common-header title="预约" @back="close"/>
  <div class="order-wrapper">
    <add-meeting-form ref="meetingForm" :data="state.formData.meetingInfo" page="edit"
                      @startTimeChange="startTimeChange"/>
    <add-person-form ref="personForm" :canEdit="true" :isDisable="true" page="edit" :data="state.formData.personInfo"/>
    <div class="footer-btn">
      <el-button type="primary" @click="submit" :disabled="state.isSubmit">预约谈话</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {ElMessage} from "element-plus";
  import {updateMeetingApi, getMeetingInfoApi} from "@/api/modules/mcs";
  import {addCasePersonApi} from "@/api/modules/pbs";
  import {addCaseAndPersonApi} from "@/api/modules/cms";
  //自定义组件
  import AddMeetingForm from "./components/AddMeetingForm.vue";
  import {getToken} from "@/utils/auth";

  const router = useRouter();
  const route = useRoute();
  const {proxy} = getCurrentInstance();
  const meetingForm = ref(null);
  const personForm = ref(null);
  let state = reactive({
    isSubmit: false,
    isStartTimeChange: false,//会议开始时间是否被修改
    meetingId: route.query.meetingId,
    formData: {
      meetingInfo: {
        address: "", // 谈话地点
        meetingStartTime: "",
        meetingEndTime: "", //会议类型，谈话会议默认是1
        recordPerson: {}, //选中的书记员
        collegialPerson: [], //选中的合议庭人员
        assistPerson: [], //选中的辅助人员
      },
      personInfo: {
        joinPersonList: [],
      },
    },
  });

  //提交表单
  const submit = async () => {
    let personFormValid = await personForm.value.validForm();
    let meetingFormValid = await meetingForm.value.validForm();
    //表单验证通
    if (personFormValid && meetingFormValid) {
      state.isSubmit = true;
      let {caseId, caseName, collegialPerson, assistPerson, recordPerson, meetingName, uploadFileDate, meetingCode, meetingEndTime, meetingStartTime, ...otherParams} = meetingForm.value.meetingInfo;
      let {joinPersonList} = personForm.value.formData;
      let joinMembers = [], newCasePerson = []; //合议庭成员，书记员，参与人，辅助人员

      // 合议庭成员
      collegialPerson.length &&
      collegialPerson.map((item) => {
        Object.assign(item, {
          sendShortMessage: false,
          userId: item.id,
          userType: 0,//内网0，外网1
          userRole: proxy.constant.IDS.hytcy.id
        })
      });
      // 辅助人员
      assistPerson.length &&
      assistPerson.map((item) => {
        Object.assign(item, {
          sendShortMessage: false,
          userId: item.id,
          userType: 0,//内网0，外网1
          userRole: proxy.constant.IDS.fzry.id
        })
      });
      // 书记员
      if (recordPerson) Object.assign(recordPerson, {
        sendShortMessage: false,
        userId: recordPerson.id,
        userType: 0,//内网0，外网1
        certificateId: "",
        userRole: proxy.constant.IDS.jly.id,
        send: true
      });

      joinMembers = [...collegialPerson, ...assistPerson, recordPerson];
      //判断当前会议的参与人中有没有当前用户,如果没有需要加入当前用户
      if (recordPerson.userId !== getToken().userId) {
        let isHave = joinMembers.find(user => {
          return user.userId === getToken().userId && (user.userRole === proxy.constant.IDS.jly.id || user.userRole === proxy.constant.IDS.hytcy.id || user.userRole === proxy.constant.IDS.fzry.id);
        });
        if (!isHave)
          joinMembers.push({
            certificateId: '',
            telephone: getToken().telephone,
            sendShortMessage: false,
            userId: getToken().userId,
            userType: 0,
            userName: getToken().userName,
            userRole: proxy.constant.IDS.fzry.id
          })
      }
      // 参与人
      //筛选有ID的人员，这些人直接添加到joinMembers变量中，准备提交到约会议接口
      //没有ID的人员，是用户新添加的人员，把他们存到newCasePerson变量中，准备后面使用
      joinPersonList.length &&
      joinPersonList.map((item) => {
        item.id = item.userId;
        if (item.userId) joinMembers.push(item);
        else newCasePerson.push(item);
      });

      //1、把新增加的人员提交到后端保存，保存成功后放入变量joinMembers中，准备提交到预约会议接口
      if (newCasePerson.length) {
        const response = await addCasePersonApi(newCasePerson);
        try {
          if (response.success) {
            response.data.forEach((item) => {
              let otherInfo = newCasePerson.find(user => {
                return item.telephone === user.telephone;
              });
              joinMembers.push({
                ...item,
                userRole: otherInfo.userRole,
                userType: 1,//内网0，外网1
                sendShortMessage: item.sendShortMessage,
              });
            });
          } else {
            state.isSubmit = false;
          }
        } catch (error) {
          state.isSubmit = false;
          message.error('新增案件人员出错。');
          return false;
        }
      }
      //2、新增案件，把内外网人员信息全部提交到后端保存
      try {
        let updateCasePersonList = [];
        joinMembers.map(item => {
          updateCasePersonList.push({
            userId: item.userId,
            userName: item.userName,
            telephone: item.telephone,
            certificateId: "",
            userRole: item.userRole,
            userType: item.userType,
          })
        });
        const response = await addNewCase(meetingName, updateCasePersonList);
        if (response.success) {
          caseId = response.data.caseId;
        } else {
          state.isSubmit = false;
        }
      } catch (err) {
        state.isSubmit = false;
        return false;
      }

      // 3、预约会议,提交后端数据
      //重新组装数据，符合接口要求；
      let newJoinMembers = [];
      joinMembers.map(item => {
        newJoinMembers.push({
          userId: item.userId,
          userType: item.userType,
          userRole: item.userRole,
          sendShortMessage: state.isStartTimeChange || item.sendShortMessage,
          reGenerate: item.reGenerate || false
        })
      });
      let params = {
        ...otherParams,
        materialUploadStartDate: uploadFileDate ? uploadFileDate[0] : null,
        materialUploadStopDate: uploadFileDate ? uploadFileDate[1] : null,
        meetingName,
        caseId,
        joinMembers: newJoinMembers,
        meetingType: 1
      };

      updateMeetingApi(params).then((response) => {
        if (response.success) {
          ElMessage({
            message: "修改成功",
            type: "success",
          });
          close();
        } else {
          state.isSubmit = false;
        }
      }).catch(err => {
        state.isSubmit = false;
      });
    }
  };
  //新增案件信息
  const addNewCase = async (meetingName, newCasePerson) => {
    let params = {
      caseName: meetingName,
      caseUsers: newCasePerson,
      caseId: state.formData.meetingInfo.caseId,
    };
    const response = await addCaseAndPersonApi(params);
    if (response.success) {
      return response;
    }
  };

  const close = () => {
    router.push("/main");
  };
  const startTimeChange = () => {
    state.isStartTimeChange = true;
  };
  //查询谈话详情
  const getMeetingInfo = async () => {
    if (state.meetingId) {
      let response = await getMeetingInfoApi(state.meetingId);
      if (response.success) {
        let {interiorInviteMembers, externalInviteMembers, interiorJoinMembers, externalJoinMembers, noteFileId, password, recordFileId, materialUploadStartDate, materialUploadStopDate, meetingPlanStartTime, ...otherParams} = response.data;
        let {collegialPerson, assistPerson, recordPerson} = state.formData.meetingInfo;
        let {joinPersonList} = state.formData.personInfo;
        const db = {};
        //拼装数据，并去重
        let concatArray = [...interiorInviteMembers, ...interiorJoinMembers].reduce((currentValue, array) => {
          db[array.userName] ? '' : db[array.userName] = true && currentValue.push(array);
          return currentValue;
        }, []);
        //合议庭成员
        concatArray.map((person) => {
          if (person.userRole === proxy.constant.IDS.hytcy.id) {
            //合议庭成员
            collegialPerson.push({
              id: person.userId,
              userName: person.userName,
            });
          } else if (person.userRole === proxy.constant.IDS.fzry.id) {
            //辅助人员
            assistPerson.push({
              id: person.userId,
              userName: person.userName,
            });
          } else if (person.userRole === proxy.constant.IDS.jly.id) {
            //书记员
            recordPerson = {
              id: person.userId,
              userName: person.userName,
            };
          }
        });
        //参与人
        externalInviteMembers.map(person => {
          //参与人
          joinPersonList.push(Object.assign(person, {
            page: 'edit',
            isEdit: person.userId,
            sendShortMessage: false,
            userType: 1
          }));
        });
        state.formData.meetingInfo = {
          ...state.formData.meetingInfo,
          ...otherParams,
          uploadFileDate: [materialUploadStartDate, materialUploadStopDate],
          meetingPlanStartTime,
          meetingPlanEndTime: '',
          collegialPerson,
          assistPerson,
          recordPerson
        };
        state.formData.personInfo = {
          joinPersonList
        };
      }
    }
  };
  onMounted(() => {
    getMeetingInfo();
  });
</script>

<style lang="scss">
  .order-wrapper {
    width: 100%;
    height: 100%;
    background-image: url("../../assets/images/bg-order.png") white no-repeat bottom left / 100% 30%;
    background-repeat: no-repeat;
    background-position: bottom left;
    background-size: contain;
    background-color: white;
    padding: 6rem 20%;
    box-sizing: border-box;
    .footer-btn {
      margin-top: 4rem;
      text-align: right;
    }
  }
</style>
