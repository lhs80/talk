import {screenSharingApi, delScreenSharingApi} from '@/api/modules/mcs'

let shareStatus = ref(false);

export default function () {
  const route = useRoute();
  const toggleShareScreen = async (enable) => {
    let params = {
      meetingId: route.query.meetingId,
      enable,
    };
    let response = await screenSharingApi(params);
    shareStatus.value = enable;
  };
  const startShare = async () => {
    let params = {
      meetingId: route.query.meetingId,
      enable: true,
    };
    let response = await screenSharingApi(params);
    if (response.success) {
      shareStatus.value = true;
    }
  };
  const endShare = async () => {
    let params = {
      meetingId: route.query.meetingId,
      enable: false,
    };
    let response = await screenSharingApi(params);
    if (response.success) {
      shareStatus.value = false;
    }
  };
  const cancelShare = async () => {
    let response = await delScreenSharingApi(route.query.meetingId);
    // if (response.success) {
    //   shareStatus.value = false;
    // }
  };
  /**
   * 浏览器分享弹窗中点击"分享"或"取消"的回调；
   **/
  const onBrowserClick = async (e) => {
    console.log("onBrowserClick", e);
    if (e) {
      await startShare();
    }
  };
  onUnmounted(() => {
    shareStatus.value = false;
  });
  return {toggleShareScreen, shareStatus, startShare, endShare, cancelShare, onBrowserClick};
}
