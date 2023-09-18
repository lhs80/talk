import {MCS} from '@/api/config/servicePort'
import http from "@/api";
//会议列表
export const getWaitHandleApi = (data: object) => {
  return http.get(`${MCS}/meeting/waitHandle`, data);
};

// 校验会议有效性
export const getMeetingEffectiveApi = (meetingId: string) => {
  return http.get(`${MCS}/meeting/effective/${meetingId}`);
};

//快速预约会议
export const meetingQuickReserveApi = (meetingType: number) => {
  return http.post(`${MCS}/meeting/quickReserve/${meetingType}`);
};

// 创建会议
export const createMeetingApi = async (data: object) => {
  return http.post(`${MCS}/meeting/reserve`, data);
};
//获取应用信息
export const quickReserveFun = (meetingType: string) => {
  return http.post(`${MCS}/meeting/quickReserve/${meetingType}`);
};

//取消谈话
export function deleteMeetingCancelApi(meetingId) {
  return http.delete(`${MCS}/meeting/cancel/${meetingId}`);
}

// 查询会议策略
export function getMeetingConfigApi() {
  return http.get(`${MCS}/security/all/configuration`);
}

// 查询历史谈话列表
export function getMeetingHistoryListApi(params) {
  return http.get(`${MCS}/meeting/history`, params);
}

//查看历史会议详情
export function getMeetingInfoApi(meetingId: string) {
  return http.get(`${MCS}/meeting/info/${meetingId}`);
}

//允许参会人上传材料
export function allowAttendUploadApi(data) {
  return http.post(`${MCS}/meeting/uploadControl`, data);
}

//上传材料到会议
export function uploadFileToMeetingFun(file) {
  return http.post(`${MCS}/file/uploadMaterial`, file);
}

//编辑谈话
export function updateMeetingApi(data) {
  return http.post(`${MCS}/meeting/update`, data);
}

//推送材料列表
export function shareMaterialListApi(data: object, meetingId: string, fileType: number = 4) {
  return http.post(`${MCS}/file/addMaterial/${meetingId}/${fileType}`, data);
}

//加入会议
export function joinMeetingApi(data) {
  return http.post(`${MCS}/scheduling/join`,data);
}

//离开会议
export function leaveMeetingApi(meetingId: string) {
  return http.delete(`/mcs/api/v1/scheduling/leave/${meetingId}`);
}

//开启虚拟背景
export function setVirtualBgStatusApi(data) {
  return http.post(`${MCS}/media/virtualBackground`, data);
}

// 推流成功后，告诉服务器，用户入会了
export function noticeServiceUserJoinApi(meetingId: string) {
  return http.put(`${MCS}/scheduling/inform/${meetingId}`);
}

//获取屏幕共享信息
export function getScreenInfoApi(meetingId: string) {
  return http.get(`${MCS}/media/getScreenSharing/${meetingId}`);
}

//取消屏幕共享信息
export function cancelScreenInfoApi(meetingId: string) {
  return http.delete(`${MCS}/media/delScreenSharing/${meetingId}`);
}

//会议续期
export function meetingRenewApi(meetingId: string) {
  return http.put(`${MCS}/meeting/renew/${meetingId}`);
}

//查询会议详情
export function getSchedulingInfoApi(meetingId: string) {
  return http.get(`${MCS}/scheduling/info/${meetingId}`);
}

//结束会议
export function overMeetingApi(meetingId: string) {
  return http.delete(`${MCS}/scheduling/over/${meetingId}`);
}

//通知服务器开始会议
export function startMeetingApi(meetingId: string) {
  return http.put(`${MCS}/scheduling/start/${meetingId}`);
}

//成员管理---一键禁音
export function syncSetMicroStatusApi(data) {
  return http.post(`${MCS}/media/audioEnable`, data);
}

//开始语音转写
export function receiveDataApi(meetingId) {
  return http.post(`${MCS}/discern/receiveData/${meetingId}`);
}

//停止畅写语音转写
export function stopReceiveDataApi(meetingId) {
  return http.post(`${MCS}/discern/stopReceiveData/${meetingId}`);
}

//屏幕分享
export function screenSharingApi(data) {
  return http.post(`${MCS}/media/screenSharing`, data);
}

//获取屏幕共享信息
export function getScreenSharingApi(meetingId) {
  return http.get(`${MCS}/media/getScreenSharing/${meetingId}`);cameraTurnApi
}

//取消屏幕共享信息
export function delScreenSharingApi(meetingId) {
  return http.delete(`${MCS}/media/delScreenSharing/${meetingId}`);
}

//录像开关
export function recordEnableApi(data) {
  return http.post(`${MCS}/media/recordEnable`, data);
}

//摄像头翻转控制
export function faceRecognitionApi(data) {
  return http.post(`${MCS}/media/faceRecognition`, data);
}

//用户分组静听接口
export function forbidListenApi(data) {
  return http.post(`${MCS}/media/forbidListen`, data);
}

//踢出会议
export function kictOutApi(meetingId, userId) {
  return http.delete(`${MCS}/scheduling/remove/${meetingId}/${userId}`);
}

//成员管理中修改名称
export function changeNameApi(meetingId, data) {
  return http.post(`${MCS}/media/changeName/${meetingId}`, data);
}

//设置显示的主画面
export function setHomeScreenApi(meetingId, userId) {
  return http.put(`${MCS}/media/setHomeScreen/${meetingId}/${userId}`);
}

//成员管理
export function getParticipantApi(meetingId) {
  return http.get(`${MCS}/scheduling/participant/${meetingId}`);
}

//查询谈话被邀约人的列表
export function getMeetingInvitedApi(meetingId) {
  return http.get(`${MCS}/meeting/invited/${meetingId}`);
}

//给被邀请人发送短信
export function sendSmsApi(meetingId, data) {
  return http.post(`${MCS}/meeting/invite/${meetingId}`, data);
}