import {DMS} from '@/api/config/servicePort'
import http from "@/api";

/**
 * 获取笔录和录相的查看/下载地址
 * @param {object} params
 * @param {string} params.fileId 必传
 * @param {string} params.downloadFileType 非必传
 **/
export function getNoteUrlApi(params) {
  return http.get(`${DMS}/file/getDownloadUrl`, params);
}

/**
 * 上传材料文件
 * @param {object} data
 * @param {string} data.files
 * @param {string} data.orderId
 */
export function uploadFileApi(data) {
  return http.post(`${DMS}/file/upload`, data);
}
/**
 * 上传材料文件
 * @param {object} data
 * @param {string} data.files
 * @param {string} data.orderId
 */
export function uploadFileFun(data) {
  return http.post(`${DMS}/file/upload`, data);
}
