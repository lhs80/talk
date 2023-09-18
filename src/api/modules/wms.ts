import {WMS} from '@/api/config/servicePort'
import http from "@/api";

//入会时获取历史聊天记录
export function historyMessageApi(data) {
  return http.post(`${WMS}/chatHistoryMessages`, data);
}