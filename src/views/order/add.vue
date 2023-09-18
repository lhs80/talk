<template>
  <common-header @back="close"/>
  <div class="order-wrapper">
    <add-meeting-form ref="meetingForm"
                      page="add"
                      :data="state.formData.meetingInfo"
                      @autoComplete="autoCompleteMeetingInfo"
                      @removeCaseId="removeCaseId"/>
    <add-person-form ref="personForm" :data="state.formData.personInfo" :isDisable="true" :canEdit="true" page="add"/>
    <div class="footer-btn">
      <el-button type="primary" @click="submit" :disabled="state.isSubmit">预约谈话</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {dayjs, ElMessage} from "element-plus";
  import {createMeetingApi} from "@/api/modules/mcs"
  import {getMeetingInfoByCaseIdApi, addCaseAndPersonApi} from "@/api/modules/cms"
  import {addCasePersonApi, getSubstituteCodeApi} from "@/api/modules/pbs";
  import AddMeetingForm from "./components/AddMeetingForm.vue";
  import {getToken} from "@/utils/auth";

  const router = useRouter();
  const route = useRoute();
  const {proxy} = getCurrentInstance();
  const meetingForm = ref(null);
  const personForm = ref(null);
  let state = reactive({
    casePrefix: '',
    isSubmit: false,
    page: route.query.type || "add",
    formData: {
      meetingInfo: {
        recordPerson: {}, //选中的书记员
        collegialPerson: [], //选中的合议庭人员
        assistPerson: [], //选中的辅助人员
        meetingName: ''//案号
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
      let {caseId, collegialPerson, assistPerson, recordPerson, meetingName, uploadFileDate, caseName, ...otherParams} = meetingForm.value.meetingInfo;
      let {joinPersonList} = personForm.value.formData;
      let joinMembers = [], newCasePerson = []; //合议庭成员，书记员，参与人，辅助人员
      // 合议庭成员
      collegialPerson.length &&
      collegialPerson.map((item) => {
        Object.assign(item, {
          sendShortMessage: true,
          userId: item.id,
          userType: 0,//内网0，外网1
          userRole: proxy.constant.IDS.hytcy.id,
        })
      });

      // 辅助人员
      assistPerson.length &&
      assistPerson.map((item) => {
        Object.assign(item, {
          sendShortMessage: true,
          userId: item.id,
          userType: 0,//内网0，外网1
          userRole: proxy.constant.IDS.fzry.id
        })
      });
      // 书记员
      if (recordPerson) Object.assign(recordPerson, {
        sendShortMessage: true,
        userId: recordPerson.id,
        userType: 0,//内网0，外网1
        certificateId: "",
        userRole: proxy.constant.IDS.jly.id,
        send: true
      });

      joinMembers = [...collegialPerson, ...assistPerson, recordPerson];

      if (recordPerson.userId !== getToken().userId) {
        let isHave = joinMembers.find(user => {
          return user.userId === getToken().userId && (user.userRole === proxy.constant.IDS.jly.id || user.userRole === proxy.constant.IDS.hytcy.id || user.userRole === proxy.constant.IDS.fzry.id);
        });
        if (!isHave)
          joinMembers.push({
            certificateId: '',
            telephone: getToken().telephone,
            sendShortMessage: true,
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
                sendShortMessage: true,// item.sendShortMessage,
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
        const response = await addNewCase(meetingName, joinMembers);
        if (response.success) {
          caseId = response.data.caseId;
        } else {
          state.isSubmit = false;
        }
      } catch (err) {
        state.isSubmit = false;
        // message.error('更新案件信息出错。');
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
          sendShortMessage: item.sendShortMessage
        })
      });

      let params = {
        ...otherParams,
        materialUploadStartDate: uploadFileDate.length ? uploadFileDate[0] : null,
        materialUploadStopDate: uploadFileDate.length ? uploadFileDate[1] : null,
        meetingName,
        caseId,
        joinMembers: newJoinMembers,
        meetingType: 1
      };

      createMeetingApi(params).then((response) => {
        if (response.success) {
          ElMessage({
            message: "谈话预约成功",
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
  //根据caseId查询谈话详情，自动回填
  const autoCompleteMeetingInfo = async (caseInfo) => {
    let response = await getMeetingInfoByCaseIdApi(caseInfo.caseId);
    let {collegialPerson, assistPerson, recordPerson} = state.formData.meetingInfo;
    let {joinPersonList} = state.formData.personInfo;
    if (response.success) {
      joinPersonList.splice(0, joinPersonList.length);
      collegialPerson.splice(0, collegialPerson.length);
      assistPerson.splice(0, assistPerson.length);
      response.data.map((person) => {
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
        } else if (person.userType === 1) {
          //参与人
          joinPersonList.push(Object.assign(person, {isEdit: person.userId, sendShortMessage: true}));
        }
      });
      state.formData.meetingInfo = {
        caseId: caseInfo.caseId,
        collegialPerson,
        assistPerson,
        recordPerson
      };
      state.formData.personInfo = {
        joinPersonList
      }
    }
  };
  //会议号改变后，清空CASEID
  const removeCaseId = () => {
    state.formData.meetingInfo.caseId = '';
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
</script>

<style lang="scss">
  .order-wrapper {
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-position: bottom left;
    background-size: contain;
    background-color: white;
    background-image: url('../../assets/images/bg-order.png');
    padding: 60px 20%;
    box-sizing: border-box;

    .footer-btn {
      margin-top: 4rem;
      text-align: right;
    }
  }
</style>
