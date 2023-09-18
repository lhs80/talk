import {ElMessage} from "element-plus";
import {clearToken} from "@/utils/auth";

let msgBox = null;
/**
 * @description: 校验网络请求状态码
 * @param {Number} status
 * @param {String} message
 * @return void
 */
export const checkStatus = (status: number, message: string) => {
  switch (status) {
    case 401:
    case 113 :
    case 403 :
    case 110 :
      if (msgBox) return;
      msgBox = ElMessage({
        message: message,
        type: 'info',
        onClose: () => {
          msgBox = null
        }
      });
      setTimeout(() => {
        window.location.href = '/';
        clearToken();
      }, 1000);
      break;
    default:
      if (msgBox) return;
      msgBox = ElMessage({
        message: message,
        type: 'error',
        onClose: () => {
          msgBox = null
        }
      });
  }
};
