<template>
  <aside class="login-wrapper">
    <div class="login-left"
         :style="{ backgroundImage: state.loginConfig.backgroundImage?`url(${proxy.prefix+state.loginConfig.backgroundImage})`:'' }">
          <span class="versions">
            {{ state.loginConfig.copyrightInformation }} <span class="ml10">{{ config.version }}</span>
          </span>
    </div>
    <div class="login-right">
      <div class="logo-img">
        <el-image :src="state.loginConfig.productIdentification?proxy.prefix+state.loginConfig.productIdentification:''"
                  fit="fill"/>
        <span class="login-title">{{ state.loginConfig.productName }}</span>
      </div>
      <!--登录表单-->
      <login-form v-if="state.loginConfig.accountAndVerification" type="all"/>
      <el-tabs v-model="state.activeName" class="demo-tabs" v-else>
        <el-tab-pane label="账号登录" name="account">
          <LoginForm type="account"/>
        </el-tab-pane>
        <el-tab-pane label="验证码登录" name="verificationCode">
          <LoginForm type="phone"/>
        </el-tab-pane>
      </el-tabs>
    </div>

  </aside>
</template>

<script setup lang="ts">
  import {getServerConfigApi} from "@/api/modules/pbs";
  import {setAppInfo} from "@/utils/appConfig";
  import {clearToken} from "@/utils/auth";
  import config from '../../package.json'
  import LoginForm from "./login/components/LoginForm.vue";

  let sendSmsTimer = null;
  const {proxy} = getCurrentInstance();
  const state = reactive({
    activeName: "account",
    loginConfig: {}
  });

  const handleFile = (files) => {
    console.log(files);
  };
  //获取应用信息
  const getAppInfo = async () => {
    const response = await getServerConfigApi();
    if (response.success) {
      state.loginConfig = response.data;
      setAppInfo(response.data);
    }
  };
  onMounted(() => {
    clearToken();
    getAppInfo();
  });
  onBeforeUnmount(() => {
    clearInterval(sendSmsTimer);
  });
</script>

<style lang="less" scoped>
  .login-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;

    .login-left {
      display: flex;
      justify-content: center;
      background-position: center;
      background-size: cover;
      color: #fff;
      width: 57.7%;
      height: 100%;
      float: left;

      .versions {
        position: absolute;
        bottom: 15px;
        font-size: 12px;
      }
    }

    .login-right {
      width: 42.3%;
      height: 100%;
      float: left;
      padding: 0 9%;
      position: relative;
      box-sizing: border-box;

      .logo-img {
        margin-top: 60px;
        margin-bottom: 150px;

        > .el-image {
          width: 50px;
          height: 50px;
          vertical-align: middle;
        }

        .login-title {
          font-size: 30px;
          font-weight: bold;
          color: var(--el-color-primary);
          vertical-align: middle;
          margin-left: 22px;
        }
      }

      :deep(.el-tabs__item) {
        height: 30px;
        font-size: 16px;
        line-height: 24px;
        color: #666666;

        &.is-active {
          color: #051c33;
          font-weight: bold;
        }
      }

      :deep(.el-tabs__nav-wrap::after) {
        display: none;
      }

      :deep(.el-input-group__append) {
        box-shadow: none;
        background: rgba(248, 249, 250, 1) !important;
      }
    }
  }
</style>
