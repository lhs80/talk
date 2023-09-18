import {SMS} from '@/api/config/servicePort'
import http from "@/api";

//重新发送短信
export function resendSmsApi(data) {
  return http.post(`${SMS}/resend/${data.orderId}/${data.userId}`);
}

//重新发送短信
export function resendApi(data) {
  return http.post(`${SMS}/resend/${data.orderId}/${data.userId}`);
}