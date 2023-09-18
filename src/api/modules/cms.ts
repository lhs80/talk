import {CMS} from '@/api/config/servicePort'
import http from "@/api";

// 根据token获取用户信息
export const getMeetingInfoByCaseIdApi = async (caseId: string) => {
  return http.get(`${CMS}/user/list/${caseId}`);
};

//谈话材料列表
export function getMaterialListApi(caseId) {
  return http.get(`${CMS}/materials/caseId/${caseId}`);
}

//修改材料--重命名，拖动
export function editFileApi(data) {
  return http.post(`${CMS}/materials/rename`, data);
}

// 根据案件名称查询案件
export const searchCaseByNameApi = async (data: object) => {
  return http.get(`${CMS}/case/byName`,data);
};

//更新案件信息，新增案件人员
export function addCaseAndPersonApi(data) {
  return http.post(`${CMS}/case/edit`, data);
}
//导出全部材料
export function materialsExportApi(caseId) {
  return http.download(`${CMS}/materials/export/${caseId}`);
}