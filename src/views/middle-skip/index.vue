<template>
  <div class="container"></div>
</template>

<script setup lang="ts">
  import {setToken} from "@/utils/auth.ts";
  import {setAppInfo} from "@/utils/appConfig";
  import {getServerConfigApi} from "@/api/modules/pbs";
  import {loginForButtFun} from "@/api/modules/cig";
  import {getMeetingEffectiveApi} from "@/api/modules/mcs";
  import {ElMessage} from "element-plus";

  const router = useRouter();
  const route = useRoute();
  // 传参
  const state = reactive({});
  //获取应用信息
  const getAppInfo = async () => {
    await getServerConfigApi()
      .then((res) => {
        if (res.success) {
          state.systemName = res.data.appName;
          state.copyright = res.data.copyright;
          // App配置信息，用到的比较多，加个缓存
          setAppInfo(res.data);
          login(route.query);
        } else {
          ElMessage.error(res.message);
        }
      })
      .catch((err) => {
        // 调用弹窗
        ElMessage.error("服务器繁忙，请稍后再试！");
      });
  };
  // 方法
  const login = async (data) => {
    let params = {
      appId: data.appId,
      fydm: data.fydm,
      userId: data.userId,
    };
    let response = await loginForButtFun(params);
    console.log("🚀 ~ file: index.vue ~ line 57 ~ login ~ response", response);
    if (response.success) {
      let userInfo = {
        userId: response.data.id,
        userName: response.data.userName,
        token: response.data.token,
      };
      setToken(userInfo);
      let meetingResponse = await getMeetingEffectiveApi(data.meetingId);
      if (meetingResponse.success) {
        router.push({
          path: "/meeting",
          query: {
            meetingId: meetingResponse.data,
            source: "tdh",
          },
        });
      }
    }
  };
  // 挂载
  onMounted(() => {
    getAppInfo();
  });
</script>
