<template>
  <x-header :userName="state.userName" @back="back" @loginOut="loginOut">
    <template #right>
      <x-notice ref="noticeRef" @read="read"/>
    </template>
  </x-header>
</template>

<script setup lang="ts">
  import {getToken, clearToken} from '@/utils/auth'
  import mittBus from "@/utils/mittBus";
  import {useBlockBackward} from '@/hooks/useBlockBackward'

  const emits = defineEmits('back');
  const router = useRouter();
  const noticeRef = ref<any>();
  const {proxy} = getCurrentInstance();
  const state = reactive({
    userName: getToken().userName,
  });
  const read = (item) => {
    console.log(item);
    window.location.href = item.content.uri;
  };
  const back = () => {
    emits('back')
  };
  //退出
  const loginOut = () => {
    clearToken();
    window.location.href = '/yst/uicp/main.html#/main';
  };
  onMounted(() => {
    useBlockBackward();
    mittBus.on('NOTICE', noticeRef.value.update);
    // mittBus.on('ERROR', loginOut());
  });
  onBeforeUnmount(()=>{
    // mittBus.off('NOTICE', noticeRef.value.update);
  })
</script>
