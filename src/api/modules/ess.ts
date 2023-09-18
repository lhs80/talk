import {ESS} from '@/api/config/servicePort'
import http from "@/api";

//初始化畅写
export function noteCreateApi(data) {
  return http.post(`${ESS}/note/create`, data);
}

export function noteSignApi(data) {
  return http.post(`${ESS}/note/sign`, data);
}

export function getRecordStatusApi(data) {
  return http.get(`${ESS}/record/status`, data);
}

//查询签名二维码
export function getSignQrcodeApi(taskId, materialId) {
  return http.get(`${ESS}/user/getSignQrcode/${taskId}/${materialId}`);
}

//使用上次签名图片进行签名
export function lastSignApi(data) {
  return http.post(`${ESS}/user/lastSign`, data);
}

//结束笔录，暂时无用
export function noteFinishApi(taskId) {
  return http.post(`${ESS}/note/finish/${taskId}`);
}
//结束笔录，暂时无用
export function noteImportApi(data) {
  return http.post(`${ESS}/note/import`,data);
}