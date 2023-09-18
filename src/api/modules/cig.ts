import {CIG} from '@/api/config/servicePort'
import http from "@/api";

/**
 * @description 网页拉起客户端时，用户登录
 * **/
export function loginForButtFun(data) {
  return http.post(`${CIG}/login`, data);
}
