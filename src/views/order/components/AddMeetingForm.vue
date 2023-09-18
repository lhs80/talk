<template>
  <el-form ref="meetingForm" label-width="100px" :rules="meetingFormRules" :model="meetingInfo">
    <el-form-item label="案号" prop="meetingName">
      <el-autocomplete
        value-key="caseName"
        :trigger-on-focus="false"
        v-model="meetingInfo.meetingName"
        :fetch-suggestions="searchCaseByName"
        placeholder="请输入案号"
        @select="selectCaseName"
        maxlength="50"
        @input="removeCaseId"
        @blur="replaceZntoEn"
        style="width: 100%"
        v-if="props.page!=='again'&&props.page!=='edit'"
      />
      <el-input v-model="meetingInfo.meetingName" placeholder="请输入案号" v-else :disabled="props.page==='again'"/>
    </el-form-item>
    <el-form-item label="时间" prop="meetingPlanStartTime">
      <el-date-picker
        style="width:100%;display:flex;"
        type="datetime"
        placeholder="请输入开始时间"
        v-model="meetingInfo.meetingPlanStartTime"
        format="YYYY-MM-DD HH:mm"
        value-format="YYYY-MM-DD HH:mm:ss"
        :disabled-date="disabledDate"
        :default-time="defaultTime"
        @change="startTimeChange"
      />
    </el-form-item>
    <el-form-item label="材料上传时间" prop="uploadFileDate">
      <el-date-picker
        style="width: 100%"
        type="daterange"
        v-model="meetingInfo.uploadFileDate"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD HH:mm:ss"
        :disabled-date="disabledDate"
        start-placeholder="请选择材料上传开始时间"
        end-placeholder="请选择材料上传结束时间"
      />
    </el-form-item>
    <el-form-item label="地点">
      <el-input placeholder="请输入地点" maxlength="50" v-model="meetingInfo.address"/>
    </el-form-item>
    <el-form-item label="合议庭成员" prop="collegialPerson">
      <client-select placeholder="请输入合议庭成员" v-model="meetingInfo.collegialPerson"
                     :initData="meetingInfo.collegialPerson"/>
    </el-form-item>
    <el-form-item label="书记员" prop="recordPerson">
      <client-select placeholder="请输入书记员" :multiple="false" v-model="meetingInfo.recordPerson"
                     :initData="meetingInfo.recordPerson"/>
    </el-form-item>
    <el-form-item label="辅助人员" prop="assistPerson">
      <client-select placeholder="请输入辅助人员" v-model="meetingInfo.assistPerson" :initData="meetingInfo.assistPerson"/>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
  import {searchCaseByNameApi} from "@/api/modules/cms";
  import {getToken} from "@/utils/auth";
  import {dayjs} from "element-plus";
  import ClientSelect from "./ClientSelect.vue";
  import {getSubstituteCodeApi} from "@/api/modules/pbs";

  const {proxy} = getCurrentInstance();
  //不可选日期
  const disabledDate = (time) => {
    return time.getTime() < Date.now() - 24 * 60 * 60 * 1000;
  };
  //会议开始时间选择框，默认当前时间后5分钟
  const defaultTime = new Date(dayjs().add(5, "minutes").format());
  //校验谈话时间
  const checkMeetingStartTime = (rule, value, callback) => {
    let {meetingPlanStartTime} = meetingInfo.value;
    let now = dayjs();
    let diff = now.diff(dayjs(meetingPlanStartTime), "seconds");
    if (diff >= 0) {
      return callback("谈话开始时间不能早于或等于当前时间！");
    }
    callback();
  };
  const props = defineProps(["data", "page"]);
  const emits = defineEmits(["autoComplete", "removeCaseId"]);
  const meetingForm = ref(null);
  let caseList = ref([]);
  let meetingInfo = ref({
    meetingName: '',
    address: "线上", // 谈话地点
    meetingPlanStartTime: "", //会议开始时间
    meetingPlanEndTime: "",
    meetingType: 1,//议类型，谈话会议默认是1
    uploadFileDate: "",
    recordPerson: {}, //选中的书记员
    collegialPerson: [], //选中的合议庭人员
    assistPerson: [], //选中的辅助人员
  });
  //校验姓名不能重复
  const checkCollegialNameIsRepeat = (rule, value, callback) => {
    let {recordPerson, collegialPerson, assistPerson} = meetingInfo.value;
    let allPerson = [];
    [recordPerson, ...assistPerson].map(item => {
      allPerson.push(item.id)
    });
    let isHave = false;
    for (let i = 0; i < value.length; i++) {
      if (allPerson.indexOf(value[i].id) >= 0) {
        isHave = true;
        break;
      }
    }
    if (isHave) {
      return callback("姓名不可以重复！");
    }
    callback();
  };
  //校验姓名不能重复
  const checkAssistNameIsRepeat = (rule, value, callback) => {
    let {recordPerson, collegialPerson, assistPerson} = meetingInfo.value;
    let allPerson = [];
    [recordPerson, ...collegialPerson].map(item => {
      allPerson.push(item.id)
    });
    let isHave = false;
    for (let i = 0; i < value.length; i++) {
      if (allPerson.indexOf(value[i].id) >= 0) {
        isHave = true;
        break;
      }
    }
    if (isHave) {
      return callback("姓名不可以重复！");
    }
    callback();
  };
  const getSubstituteCode = async () => {
    let response = await getSubstituteCodeApi();
    if (response.success) {
      meetingInfo.value.meetingName = `(${dayjs().format('YYYY')})${response.data}`;
    }
  };
  // 表单校验
  let meetingFormRules = reactive({
    meetingName: [{required: true, message: "请输入案号", trigger: "blur"}],
    meetingPlanStartTime: [{required: true, message: "请输入时间", trigger: "blur"}, {validator: checkMeetingStartTime}],
    collegialPerson: {validator: checkCollegialNameIsRepeat},
    assistPerson: {validator: checkAssistNameIsRepeat},
    recordPerson: {
      type: "object",
      required: true,
      message: "",
      fields: {id: {required: true, message: "请选择书记员"}},
    },
  });
  // 模糊搜索案件
  const searchCaseByName = async (queryString, cb) => {
    if (!queryString) return;
    let params = {
      caseName: queryString,
      pageIndex: 1,
      pageSize: 1000
    };
    let response = await searchCaseByNameApi(params);
    if (response.success) {
      caseList = response.data;
      cb(response.data);
    }
  };
  // 选择案号后，保存案件ID，需要提交到后端
  const selectCaseName = async (item) => {
    emits('autoComplete', item)
  };
  //替换中文括号为英文括号
  const replaceZntoEn = () => {
    let reg = /\uff08/g, reg2 = /\uff09/g;
    meetingInfo.value.meetingName = meetingInfo.value.meetingName.replace(reg, "(").replace(reg2, ")");
  };
  // 会议名称改变后，清空案件ID
  const removeCaseId = (e) => {
    emits('removeCaseId')
  };
  // 修改了会议开始时间,通知父组件
  const startTimeChange = () => {
    emits('startTimeChange')
  };
  //提供给父组件使用的表单校验方法
  const validForm = async () => {
    let result = false;
    await meetingForm.value.validate((valid) => {
      result = valid;
    });
    return result;
  };
  watch(
    () => props.data,
    () => {
      meetingInfo.value = {
        ...meetingInfo.value,
        ...props.data
      };
    }
  );
  onMounted(() => {
    if (props.page === 'add')
      getSubstituteCode();
    meetingInfo.value.recordPerson = {
      userName: getToken().userName,
      id: getToken().userId,
      depId: getToken().depId,
      telephone: getToken().telephone,
    }
  });
  defineExpose({
    validForm,
    meetingInfo,
  });
</script>
<style lang="less" scoped>
  ::v-deep .el-input__wrapper {
    width: 100%;
  }
</style>