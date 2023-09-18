<!--组件名称：参与人信息表单-->
<!--用途：1、会议中的邀请弹窗中使用；2、预约会议页面中使用；3、编辑预约会议页面中使用；-->
<!--需求：-->
<!--身份证输入框是根据后台配置控制显示；-->
<!--参与人姓名使用模糊搜索接口进行查询，拼接显示用户名&#45;&#45;手机号码用户点击某一个用户后，
自动填充他的姓名、手机号、身份证信息到表单中；-->
<!--新增时不需要显示编辑和取消按钮；编辑会议时默认不可编辑 ，显示编辑和取消按钮，显示编辑后表单可编辑；-->
<!--编辑时需要显示重新发送短信按钮和短信发送的结果图标；-->
<!--预约会议和编辑会议时，参与人可删除，需要显示删除图标；会议中的参与人邀请成功后，不可删除；-->
<!--当修改了某个人的手机号、名字或身份证号的时候，需要请求新增人员接口，添加新的参与人信息；-->
<template>
  <el-row align="middle" justify="center">
    <el-col :span="12">参与人</el-col>
    <el-col :span="12" class="text-right">
      <el-button size="small" plain :icon="Plus" @click="addJoinPerson">新增人员</el-button>
    </el-col>
  </el-row>
  <el-form class="mt10" ref="personForm" :rules="state.personRule" :model="formData" style="max-height:250px;overflow:auto">
    <el-row class="joinPersonList-item"
            :gutter="10"
            align="middle"
            v-for="(joinPerson, index) in formData.joinPersonList"
            :key="index">
      <el-col :span="1" v-if="props.isMeetingInvite">
        <el-form-item style="margin-bottom:0">
          <el-checkbox v-model="joinPerson.sendShortMessage"/>
        </el-form-item>
      </el-col>
      <el-col :span="faceValidate?4:6">
        <el-form-item style="margin-bottom:0"
                      :prop="'joinPersonList.' + index + '.userRole'"
                      :rules="state.personRule.userRole">
          <el-select
            placeholder="请选择诉讼地位"
            style="width: 100%"
            v-model="joinPerson.userRole"
            filterable
            clearable
            :disabled="state.editItem===joinPerson.userId?false:(props.isDisable&&!joinPerson.isNew)"
          >
            <el-option v-for="item in state.roleList" :key="item.id" :label="item.value" :value="item.id"/>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="faceValidate?5:7">
        <el-form-item style="margin-bottom:0"
                      :prop="'joinPersonList.' + index + '.userName'"
                      :rules="state.personRule.userName">
          <el-autocomplete
            style="width: 100%"
            :trigger-on-focus="false"
            v-model="joinPerson.userName"
            value-key="name"
            :fetch-suggestions="getScreener"
            placeholder="请输入参与人姓名"
            @select="(value) => setPersonInfo(value, index)"
            maxLength="50"
            :disabled="(props.isDisable&&!joinPerson.isNew)&&state.editItem!==joinPerson.userId"
            @input="delUserId(joinPerson?.invitationCode,index,joinPerson.userId)"
          >
            <template #default="{ item }">
              <span>{{ item.userName }}</span>
              <span v-if="item.certificateId">-{{ item.certificateId }}</span>
              <span v-if="item.telephone">-{{ item.telephone }}</span>
            </template>
          </el-autocomplete>
        </el-form-item>
      </el-col>
      <el-col :span="faceValidate?5:7">
        <el-form-item style="margin-bottom:0"
                      :prop="'joinPersonList.' + index + '.telephone'"
                      :rules="state.personRule.telephone">
          <el-input placeholder="请输入被邀请人手机号"
                    maxlength="11"
                    v-model="joinPerson.telephone"
                    @input="delUserId(joinPerson?.invitationCode,index,joinPerson.userId)"
                    :disabled="state.editItem===joinPerson.userId?false:(props.isDisable&&!joinPerson.isNew)"
          />
        </el-form-item>
      </el-col>
      <!--开启人脸识后才需要输入身份证-->
      <el-col :span="6" v-if="faceValidate">
        <el-form-item style="margin-bottom:0"
                      :prop="'joinPersonList.' + index + '.certificateId'"
                      :rules="state.personRule.certificateId">
          <el-input
            placeholder="请输入被邀请人身份证号"
            maxlength="18"
            v-model="joinPerson.certificateId"
            @input="delUserId(joinPerson?.invitationCode,index,joinPerson.userId)"
            :disabled="state.editItem===joinPerson.userId?false:(props.isDisable&&!joinPerson.isNew)"
          />
        </el-form-item>
      </el-col>
      <el-col :span="props.isMeetingInvite?3:4" class="text-center text-primary">
        <template v-if="(props.isMeetingInvite||page==='edit')&&!joinPerson.isNew">
          <!--          <svg-icon title="发送成功" name="icon_fasongchenggong" v-if="joinPerson.sendStatus===1"/>-->
          <el-icon title="发送成功" size="18" v-if="joinPerson.sendStatus===1" style="vertical-align: middle">
            <CircleCheck/>
          </el-icon>
          <el-icon title="发送中" size="18" color="#ffcb00" v-if="!joinPerson?.sendStatus&&joinPerson.sendStatus!==0" style="vertical-align: middle">
            <CircleCheck/>
          </el-icon>
          <el-icon title="发送失败" size="18" color="red" v-if="joinPerson.sendStatus===0" style="vertical-align: middle">
            <Warning/>
          </el-icon>
<!--          <svg-icon title="发送中" name="icon_fasongchenggong" color="F40"-->
<!--                    v-if="!joinPerson?.sendStatus&&joinPerson.sendStatus!==0"/>-->
          <!--          <el-icon title="发送中" v-if="!joinPerson?.sendStatus"><Position /></el-icon>-->
<!--          <svg-icon title="发送失败" name="icon_fasongshibai" v-if="joinPerson.sendStatus===0"/>-->
          <svg-icon title="重新发送" class="ml5" name="icon_zhongxinfasong" @click="resendSMS(joinPerson.userId, index)"/>
        </template>
        <template v-if="props.canEdit&&!joinPerson.isNew">
          <svg-icon title="编辑" name="bianji"
                    @click="editPerson(joinPerson.userId)"
                    v-if="joinPerson.userId !== state.editItem"/>
          <svg-icon title="编辑" name="xuanze"
                    v-if="joinPerson.userId&&joinPerson.userId === state.editItem"
                    @click="updatePersonInfo(joinPerson)"/>
        </template>
        <!--如果已经发送了短信，不允许删除 -->
        <svg-icon name="icon_shanchu" title="删除" :size="20" @click="delSendSmsUser(index)"
                  v-if="page==='again'||page==='add'||joinPerson.isNew"/>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
  import {updatePersonInfoApi, getExternalUserFuzzyApi} from "@/api/modules/pbs";
  import {resendSmsApi} from "@/api/modules/sms";
  import {validatePhone, validateIdentity} from "@/utils/validate";
  import useDict from "@/hooks/useDict";
  import useMeetingConfig from "@/hooks/useMeetingConfig";
  import {CircleCheck, Warning, Plus} from '@element-plus/icons-vue'
  import {ElMessage} from 'element-plus';

  const personForm = ref(null);
  const props = defineProps({
    data: {//回显数据
      type: Object,
      default: {}
    },
    canEdit: {//是否显示编辑按钮
      type: Boolean,
      default: false
    },
    isDisable: {//已有数据是否灰化
      type: Boolean,
      default: false
    },
    canDel: {//已有数据是否可删除
      type: Boolean,
      default: false
    },
    isMeetingInvite: {//会议中的邀请
      type: Boolean,
      default: false
    },
    page: {//会议中的邀请
      type: String,
      default: ''
    },
  });
  const route = useRoute();
  const {getDataDictionary} = useDict();
  const {faceValidate} = useMeetingConfig();
  const {proxy} = getCurrentInstance();
  //校验手机号码不能重复
  const checkTelIsRepeat = (rule, value, callback) => {
    let {joinPersonList} = formData.value;
    let isHas = [];
    if (joinPersonList.length) {
      isHas = joinPersonList.filter((item) => {
        return item.telephone && item.telephone === value;
      });
      if (isHas.length > 1) {
        return callback("手机号不可以重复！");
      }
    }
    callback();
  };
  //校验姓名不能重复
  const checkNameIsRepeat = (rule, value, callback) => {
    let {joinPersonList} = formData.value;
    let isHas = [];

    if (joinPersonList.length) {
      isHas = joinPersonList.filter((item) => {
        return item.userName && item.userName === value;
      });

      if (isHas.length > 1) {
        return callback("姓名不可以重复！");
      }
    }
    callback();
  };
  //校验身份证号不能重复
  const checkIdCardRepeat = (rule, value, callback) => {
    let {joinPersonList} = formData.value;
    let isHas = [];
    console.log(joinPersonList);
    if (joinPersonList.length) {
      isHas = joinPersonList.filter((item) => {
        return item.certificateId && item.certificateId === value;
      });

      if (isHas.length > 1) {
        return callback("身份证号不可以重复！");
      }
    }
    callback();
  };
  let formData = ref({
    joinPersonList: [],
  });
  //保存props.data，作为修改电话号码的比较数据
  let tempPropsData = ref({
    joinPersonList: [],
  });
  const delUserId = (invitationCode, index, userId) => {
    if (invitationCode || state.editItem === userId) return false;
    formData.value.joinPersonList[index].userId = '';
    formData.value.joinPersonList[index].reGenerate = false;
  };
  const state = reactive({
    editItem: "",
    roleList: [], // 被约谈人角色列表
    outerUserList: [],//外网人员列表
    personRule: {
      userRole: [{required: true, message: "请选择诉讼地位", trigger: "blur"}],
      userName: [{required: true, message: "请输入被邀请人", trigger: "blur"}],//{validator: checkNameIsRepeat}
      telephone: [
        {required: true, message: "请输入被邀请人手机号", trigger: "blur"},
        {
          pattern: validatePhone,
          message: "请输入正确的手机号",
        },
        {validator: checkTelIsRepeat},
      ],
      certificateId: [
        {required: true, message: "请输入身份证号", trigger: "blur"},
        {
          pattern: validateIdentity,
          message: "请输入正确的身份证号",
        },
        {validator: checkIdCardRepeat},
      ],
    },
  });
  // 筛选参与人
  const getScreener = async (query, cb) => {
    if (!query) return false;
    let params = {
      userName: query
    };
    let response = await getExternalUserFuzzyApi(params);
    if (response.success) {
      cb(response.data);
    }
  };
  //新增被邀请人
  const addJoinPerson = () => {
    //有一条空数据的时候，不允许新增；
    let isNull = formData.value.joinPersonList.find(item => {
      if (faceValidate.value)
        return !item.userRole || !item.userName || !item.telephone || !item.certificateId
      else
        return !item.userRole || !item.userName || !item.telephone
    });
    if (isNull) return false;
    formData.value.joinPersonList.unshift({
      telephone: "",
      userId: "",
      userName: "",
      userType: 1,
      userRole: "",
      sendShortMessage: true,
      certificateId: "",
      reGenerate: false,//是否重新生成邀请码
      isNew: true,
    });
  };
  const editPerson = (userId) => {
    state.editItem = userId;
    formData.value.joinPersonList.map(item => {
      if (item.userId === userId) item.sendShortMessage = true;
    })
  };
  //删除被邀请人
  const delSendSmsUser = (index) => {
    formData.value.joinPersonList.splice(index, 1);
  };
  // 分别赋值
  const setPersonInfo = (value, index) => {
    formData.value.joinPersonList[index].userName = value.userName;
    formData.value.joinPersonList[index].certificateId = value.certificateId;
    formData.value.joinPersonList[index].telephone = value.telephone;
    formData.value.joinPersonList[index].userId = value.userId;
  };
  //修改参与人信息
  const updatePersonInfo = async (item) => {
    let {certificateId, telephone, userId, userName} = item;
    let params = {
      certificateId, telephone, userId, userName
    };
    let response = await updatePersonInfoApi(params);
    if (response.success) {
      let modifyTelephoneMember = tempPropsData.value.joinPersonList.find(item => {
        return item.userId === response.data.userId && item.telephone !== response.data.telephone;
      });
      if (modifyTelephoneMember) {
        formData.value.joinPersonList.map(item => {
          item.reGenerate = item.userId === modifyTelephoneMember.userId;
        });
      }
      tempPropsData.value = formData.value;
      state.editItem = ""
    }
  };
  //重新发送短信
  const resendSMS = async (userId) => {
    let params = {
      orderId: route.query.meetingId,
      userId
    };
    let response = await resendSmsApi(params);
    if (response.success) {
      ElMessage.success('发送成功!')
    }
  };
  const validForm = async () => {
    let result = false;
    await personForm.value.validate((valid) => {
      result = valid;
    });
    return result;
  };
  const createRoleList = async () => {
    const ssdw = await getDataDictionary(proxy.constant.DICT.ssdw.value);
    const spzz = await getDataDictionary(proxy.constant.DICT.spzz.value);
    state.roleList = [...ssdw, ...spzz];
  };
  defineExpose({
    validForm,
    formData,
  });
  watchEffect(() => {
    formData.value = JSON.parse(JSON.stringify(props.data));
    tempPropsData.value = JSON.parse(JSON.stringify(props.data));
  });
  onMounted(async () => {
    createRoleList();
  });
</script>

<style lang="scss" scoped>
  .joinPersonList-item {
    width: 100%;
    border-top: solid 1px #d8d8d8;
    /*margin-top: 1.6rem;*/
    padding: 20px 5px;

    &:hover {
      background: #e9f4ff;
      color: #e9f4ff;
    }

    ::v-deep(.el-input__wrapper) {
      box-shadow: none !important;
    }
  }
</style>
