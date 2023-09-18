<template>
  <el-form ref="loginForm" class="login-form" :model="state.userInfo" :rules="state.formRules">
    <el-form-item prop="loginName" v-if="props.type === 'all' || props.type === 'account'">
      <el-input placeholder="请输入用户名" v-model.trim="state.userInfo.loginName" @keydown.enter.native="confirmLogin"
                autofocus>
        <template #prefix>
          <i class="iconfont icon-icon_yonghu"/>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item prop="password" v-if="props.type === 'all' || props.type === 'account'">
      <el-input type="password" placeholder="请输入密码" v-model.trim="state.userInfo.password"
                @keydown.enter="confirmLogin">
        <template #prefix>
          <i class="iconfont icon-icon_mima"/>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item prop="phone" v-if="props.type === 'phone'">
      <el-input placeholder="请输入手机号码" v-model.trim="state.userInfo.phone" maxlength="11" @keydown.enter="confirmLogin"
                autofocus>
        <template #prefix>
          <i class="iconfont icon-shouji"/>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item prop="code" v-if="props.type === 'all' || props.type === 'phone'">
      <el-input placeholder="请输入验证码" v-model.trim="state.userInfo.code" @keydown.enter="confirmLogin">
        <template #prefix>
          <i class="iconfont icon-yanzhengma"/>
        </template>
        <template #append>
          <el-link :underline="false" type="primary" @click="chooseSendSmsCode"
                   v-if="!state.canReSend">获取验证码
          </el-link>
          <el-link :underline="false" type="primary" :disabled="true" v-else>{{ state.sendSmsWaitTimer }}秒重新发送</el-link>
        </template>
      </el-input>
      <div class="text-lightgray h6" v-if="state.lastFourDigits && props.type === 'all'">验证码已发送至尾号为{{
        state.lastFourDigits }}的手机
      </div>
    </el-form-item>
    <el-form-item>
      <el-button class="login-submit" type="primary" @click="confirmLogin">登录</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
  import {validatePhone} from "@/utils/validate";
  import {loginApi, phoneLoginApi, sendSmsCodeApi, loginByAccountAndCodeApi, getUserInfoApi} from "@/api/modules/pbs";
  import {setToken} from "@/utils/auth";
  import md5 from "js-md5";

  let sendSmsTimer = null;
  const router = useRouter();
  const loginForm = ref(null);
  const props = defineProps(["showTips", "type"]);
  const state = reactive({
    lastFourDigits: "",
    sendSmsWaitTimer: 60, //重新发送验证码间隔时长
    canReSend: false, //重新发送开关
    userInfo: {
      loginName: "",
      password: "",
      phone: "",
      code: "",
    },
    formRules: {
      loginName: [{required: true, message: "请输入用户名"}],
      password: [
        {required: true, message: "请输入密码"},
        // {min: 6, max: 12, message: "密码长度为6-12位"},
      ],
      phone: [
        {required: true, message: "请输入手机号"},
        {pattern: validatePhone, message: "请输入正确的手机号"},
      ],
      code: [{required: true, message: "请输入验证码"}],
    },
  });
  /**
   * 最终的登录方式
   * **/
  const confirmLogin = () => {
    if (props.type === "all") {
      loginByAccountAndCode()
    } else if (props.type === "phone") {
      loginByPhone();
    } else {
      loginByAccount();
    }
  };
  /**
   * 根据表单类型判断选择发送短信验证码的过程
   * all:先调用账号密码登陆接口获取手机号码，然后再发送短信验证码；
   * phone:直接调用发送短信验证码接口；
   * **/
  const chooseSendSmsCode = async () => {
    await sendSmsCode()
  };
  /**
   * 账号密码登录
   * 判断表单类型 all:获取用户手机号码并赋值给变量，
   * **/
  const loginByAccount = async () => {
    let validateResult = "";
    await loginForm.value.validateField(["loginName", "password"], (valid) => {
      validateResult = valid;
    });
    if (validateResult) {
      let params = {
        loginName: state.userInfo.loginName,
        password: md5(state.userInfo.password)
      };
      const response = await loginApi(params);

      if (response.success) {
        let {isUpdatePassword, telephone} = response.data;
        // isUpdatePassword 1:需要提示 0:不需要提示
        if (isUpdatePassword) {
          ElMessage.info("检测到您的密码三个月未更新，请更新密码！");
        }
        if (props.type === "all") {
          if (telephone) {
            state.userInfo.phone = telephone;
            await sendSmsCode();
          } else {
            // @ts-ignore
            ElMessage.error("该账号未绑定手机号码");
            return false;
          }
        } else {
          if (response.data?.role && response.data.role[0].id === 'd569901e27914bb89c050692f8eb883b') {
            await getUserInfo(response);
          } else {
            ElMessage.info('您没有权限！')
          }
        }
      }
    }
  };
  /**
   * 发送短信验证码
   * **/
  const sendSmsCode = async () => {
    //根据登录方式判断验证哪些字段
    //type=all:判断账号密码+验证码
    //type=phone:判断手机号码
    let flag = [];
    if (props.type === 'all') {
      await loginForm.value.validateField(['loginName'], (valid) => {
        flag.push(valid);
      });
      await loginForm.value.validateField(['password'], (valid) => {
        flag.push(valid);
      });
    } else if (props.type === 'phone') {
      await loginForm.value.validateField(['phone'], (valid) => {
        flag.push(valid);
      });
    }

    if (flag.indexOf(false) < 0) {

      let params = {
        loginName: state.userInfo.loginName,
        password: md5(state.userInfo.password),
        phone: state.userInfo.phone
      };
      let res = await sendSmsCodeApi(params);
      if (res.success) {
        state.canReSend = true;
        sendSmsTimer = setInterval(() => {
          if (state.sendSmsWaitTimer > 1) {
            state.sendSmsWaitTimer--;
          } else {
            clearInterval(sendSmsTimer);
            state.sendSmsWaitTimer = 60;
            state.canReSend = false;
          }
        }, 1000);
        state.lastFourDigits = state.userInfo.phone.substring(7, 11);
        ElMessage.success("验证码发送成功!");
      }
    }
  };
  /**
   * 手机验证码登录
   * **/
  const loginByPhone = async () => {
    loginForm.value.validate(async (valid) => {
      if (valid) {
        const {phone, code} = state.userInfo;
        let params = {
          phone,
          code,
        };
        const response = await phoneLoginApi(params);
        if (response.success) {
          if (response.data?.role && response.data.role[0].id === 'd569901e27914bb89c050692f8eb883b') {
            await getUserInfo(response);
          } else {
            ElMessage.info('您没有权限！')
          }
        }
      }
    });
  };
  /**
   * 账号密码+验证码登录
   * **/
  const loginByAccountAndCode = () => {
    loginForm.value.validate(async (valid) => {
      console.log(valid);
      if (valid) {
        let params = {
          loginName: state.userInfo.loginName,
          password: md5(state.userInfo.password),
          code: state.userInfo.code
        };
        const response = await loginByAccountAndCodeApi(params);
        if (response.success) {
          if (response.data?.role && response.data.role[0].id === 'd569901e27914bb89c050692f8eb883b') {
            await getUserInfo(response);
          } else {
            ElMessage.info('您没有权限！')
          }
        }
      }
    })
  };
  /**
   * 获取用户信息，缓存到本地，跳转到主页面
   * **/
  const getUserInfo = async (response) => {
    let {token} = response.data;
    let resUserInfo = await getUserInfoApi(token);
    if (!resUserInfo.id) {
      const {userName, id, loginName, depId, depName, telephone, unitName, unitId} = resUserInfo.data;
      let userInfo = {
        userId: id,
        loginName,
        userName,
        token,
        telephone,
        depId,
        depName,
        unitName,
        unitId,
      };
      setToken(userInfo);
      router.push("/main");
      // }
    } else {
      ElMessage.error(response.message);
    }
  };

  /**
   * 获取随机码
   * **/
  const genRandomString = (len) => {
    let rdmString = "";
    while (rdmString.length < len) {
      rdmString += ((Math.random() * 37) | 0).toString(36);
    }
    return rdmString;
  };
  /**
   * 获取验证码在条件满足的情况下才可点击
   * **/
  const isPhoneCurrent = computed(() => {
    //二合一验证时，输入用户名和密码后才可以点击
    if (props.type === "all") {
      loginForm.value.validate((valid) => {
          if (!valid) {
          } else {
            console.log("error submit!!");
          }
        }
      );
    } else if (props.type === "phone")
      //手机验证码时，手机号合法后才可以点击
      return !validatePhone.test(state.userInfo.phone);
  });
</script>

<style lang="less" scoped>
  .login-form {
    width: 100%;
    margin-top: 10%;

    ::v-deep(.el-input__wrapper) {
      background: rgba(248, 249, 250, 1) !important;
      height: 40px;
      border: none;
      box-shadow: none;
    }

    ::v-deep(.iconfont) {
      font-size: 20px;
    }

    .login-submit {
      margin-top: 20%;
      width: 100%;
      height: 49px;
      font-size: 18px;
      box-shadow: 0 3px 7px 0 #a5cbfa;
    }
  }
</style>
