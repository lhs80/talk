//根据类型查询字典内容的方法
//type是字典类型
import { getDataDictionaryApi } from "@/api/modules/pbs";
export default function () {
  const getDataDictionary = async (type:string) => {
    let params = {
      type,
      pageSize: 1000,
    };
    let response = await getDataDictionaryApi(params);
    if (response.success) {
      return response.data;
    } else {
      return [];
    }
  };

  return { getDataDictionary };
}
