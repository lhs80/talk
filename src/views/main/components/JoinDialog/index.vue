<template>
  <el-dialog v-model="props.show" title="立即加入" width="500px" :before-close="close">
    <el-form ref="joinForm" label-width="70px" :rules="state.joinFormRule" :model="state.joinInfo">
      <el-form-item label="谈话ID" prop="meetingId">
        <el-input
          placeholder="请输入谈话ID"
          v-model.trim="state.joinInfo.meetingId"
          :show-word-limit="true"
          maxlength="9"
          @keydown.enter.prevent="submit"
          @input.native="formatNumber('meetingId')"
          @compositionend.native="formatNumber('meetingId')"
        />
      </el-form-item>
      <el-form-item label="用户名">
        <el-input placeholder="请输入被邀请人姓名" v-model.trim="state.joinInfo.userName" disabled/>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button size="small" @click="close">取消</el-button>
      <el-button size="small" type="primary" @click="submit" :disabled="state.joinInfo.meetingId.length!==9">加入谈话</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import {getToken} from "@/utils/auth";

  const props = defineProps({
    show: {
      type: Boolean,
      default: false
    },
  });
  const emits = defineEmits(["submit"]);
  const joinForm = ref(null);
  let state = reactive({
    joinInfo: {
      meetingId: "",
      userName: getToken().userName,
    },
    joinFormRule: {
      meetingId: [{required: true, message: "请输入谈话ID"}],
    },
    submitBtnIsDisabled: true,
  });
  const formatNumber = (field) => {
    state.joinInfo[field] = state.joinInfo[field].toString().replace(/[^\d]/g, "");
  };
  const submit = () => {
    joinForm.value.validate((valid) => {
      if (valid) {
        emits("submit", state.joinInfo.meetingId);
        close();
      }
    });
  };
  const close = () => {
    emits("close");
  };
  const inputStatus = (value) => {
    state.submitBtnIsDisabled = value.length !== 9;
  };
</script>
