import { ref } from "vue";
import { useRoute } from "vue-router";
import { recordEnableApi } from "@/api/modules/mcs";
import {getToken} from "../utils/auth";

let isDisable = ref(false);
export default function () {
  const route = useRoute();
  /**
   * 开启录像，调用接口，发送websocket通知
   */
  const beginVideoTap = async () => {
    console.log("beginVideoTap");
    if (isDisable.value) return false;
    isDisable.value = true;
    let params={
      enable: true,
      meetingId: route.query.meetingId,
      users: [getToken().userId]
    };
    let response = await recordEnableApi(params);
    if (response.success) {
      isDisable.value = false;
    }
  };
  /**
   * 结束录像，调用接口，发送websocket通知
   */
  const stopVideoTap = async () => {
    if (isDisable.value) return false;
    isDisable.value = true;
    let params={
      enable: false,
      meetingId: route.query.meetingId,
      users: [getToken().userId]
    };
    let response = await recordEnableApi(params);
    if (response.success) {
      isDisable.value = false;
    }
  };
  return { beginVideoTap, stopVideoTap };
}
