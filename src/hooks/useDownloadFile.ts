//下载或查看材料；
import {getNoteUrlApi} from "@/api/modules/dms";

export default function () {
  const getFileUrl = async (fileId, format = '',sync=false) => {
    if (fileId) {
      let params = {
        fileIds: fileId,
        format,
        sync
      };
      let response = await getNoteUrlApi(params);

      if (response.success)
          return response.data;
      else
        return ''
    }
  };
  return {getFileUrl};
}
