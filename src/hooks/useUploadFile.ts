//上传材料，要先上传到服务器，使用返回的文件ID，再上传到会议中；
import {uploadFileFun} from "@/api/modules/dms";
import {uploadFileToMeetingFun} from "@/api/modules/mcs";

export default function () {
  const startUploadFile = async (data) => {
    let fileId = await updateFile(data);
    if (fileId) {
      let params = {
        caseId: data.caseId,
        fileId,
        fileType: 3,
        fileName: data.fileName,
        meetingId: data.meetingId
      };
      return await uploadFileToMeetingFun([params]);
    }
  };
  const updateFile = async (data) => {
    const form = new FormData();
    form.append("files", data.file);
    form.append("orderId", data.meetingId);
    let response = await uploadFileFun(form);
    if (response.success) {
      return response.data.fileId
    }
  };
  return {startUploadFile};
}
