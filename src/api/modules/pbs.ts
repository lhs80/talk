import {PBS} from '@/api/config/servicePort'
import http from "@/api";
import {Login, IReqApplication, IReqSmsCode, IResLoginByCode, IResLogin} from '@/api/interface'
import {setToken} from "@/utils/auth";

//获取应用信息
export const getServerConfigApi = () => {
  return http.get(`${PBS}/platform/configuration`);
};

// 登录
export const loginApi = (data: Login.ReqLoginAccount) => {
  return http.post(`${PBS}/login`, data);
};

// 根据token获取用户信息
export const getUserInfoApi = async (token: string) => {
  await setToken({token});
  return http.get(`${PBS}/users/getUserInfo`);
};

//获取验证码
export const sendSmsCodeApi = (data: IReqSmsCode) => {
  return http.post(`${PBS}/getLoginCode`, data);
};

//用户手机验证码登录
export const phoneLoginApi = (data: IResLoginByCode) => {
  return http.post(`${PBS}/login/phone`, data);
};

//用户账号+验证码登录
export const loginByAccountAndCodeApi = (data: IResLogin) => {
  return http.post(`${PBS}/login/code`, data);
};

// 字典
export const getDataDictionaryApi = async (data: object) => {
  return http.get(`${PBS}/dictionary/list`, data);
};

//预约谈话时，模糊查询内网人员
export function getUserByFuzzyNameApi(data) {
  return http.post(`${PBS}/users/fuzzy`, data);
}

//参会人员筛选
export function getExternalUserFuzzyApi(params) {
  return http.get(`${PBS}/externalUser/fuzzy`, params);
}

//预约时修改参会人信息
export function updatePersonInfoApi(data) {
  return http.post(`${PBS}/externalUser/update`, data);
}

//新增案件人员
export function addCasePersonApi(data) {
  return http.post(`${PBS}/externalUser/addUser`, data);
}

//共享材料列表
export function getShareMaterialListApi(params) {
  return http.get(`${PBS}/share/list`, params);
}

//能力列表
export function getServiceListApi(params) {
  return http.get(`${PBS}/portalConfig/getServiceList`, params);
}

/**
 * @description 用户上次签名的图片地址
 **/
export function getElectronicSignApi() {
  return http.get(`${PBS}/users/electronicSign`);
}


// 代字
export function getSubstituteCodeApi() {
  return http.get(`${PBS}/users/substituteCode`);
}
