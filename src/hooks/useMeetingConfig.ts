//查询会议相关的配置信息
import { getMeetingConfigApi } from "@/api/modules/mcs";

let faceValidate=ref(false);//是否开启了人脸识别
let downloadNoteFileFormat=ref([]);//可下载的笔录类型
export default function () {
  const { proxy } = getCurrentInstance();
  const getIds = async () => {
    let response = await getMeetingConfigApi();
    if (response.success) {
      faceValidate.value=await response.data.find(item=>{
        return item.id===proxy.constant.IDS.rlsb.value
      })?.value === 'true';
      downloadNoteFileFormat.value=await response.data.find(item=>{
        return item.id===proxy.constant.IDS.bllx.value
      })?.value.split(',');
    }
  };

  onMounted(async ()=>{
    await getIds()
  });
  return { downloadNoteFileFormat,faceValidate };
}
