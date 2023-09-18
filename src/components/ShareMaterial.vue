<!--开会时或者从主页预约会议中的上传材料打开页面时，可以显示-->
<template>
  <aside class="material-wrapper">
    <div class="material-left">
      <el-checkbox-group class="tree-panel" v-model="state.checkShareMaterialList">
        <el-checkbox style="width:90%" :label="item" v-for="item in state.shareMaterialList" :key="item.id"
                     @change="checkMaterialContent(item.fileId,item.suffix)">
          <span>{{item.fileName}}</span>
        </el-checkbox>
      </el-checkbox-group>

      <div class="mt10 text-center">
        <el-button type="primary" @click="send" :disabled="!state.shareMaterialList.length">推送给当事人</el-button>
      </div>
    </div>
    <div class="material-right">
      <div ref="panzoomBox" v-show="state.fileUrl" @wheel="pdfOnWheel">
        <div ref="pdfh5" style="max-width: 1000px; margin: 0 auto" v-show="state.fileSuffix === 'pdf'"/>
        <img :src="state.fileUrl" style="width: 100%" alt="图片" v-if="state.fileSuffix === 'img'"/>
        <video :src="state.fileUrl" style="width: 100%" v-if="state.fileSuffix === 'video'" controls/>
        <audio :src="state.fileUrl" style="width: 100%" v-if="state.fileSuffix === 'audio'" controls/>
      </div>
      <!--      <el-empty description="当前没有显示材料" :image="`${require('@/assets/img/no-content.png')}`" :image-size="160"-->
      <!--                v-if="!state.fileUrl"/>-->
      <div class="zoom-bar" v-if="state.fileUrl">
        <svg-icon :size="40" name="suoxiao" @click="pdfScale('sub')"/>
        <span class="scale-num"> {{ state.scaleNum }}% </span>
        <svg-icon :size="40" name="fangda" @click="pdfScale('add')"/>
      </div>
      <img class="cunzheng" src="../assets/images/img-cunzheng.png" alt="" v-if="state.isSaveRecordEvidence"/>
    </div>
  </aside>
</template>

<script setup lang="ts">
  import {getShareMaterialListApi} from "@/api/modules/pbs";
  import {shareMaterialListApi} from "@/api/modules/mcs";
  import {ElMessage,dayjs} from "element-plus";
  import Pdfh5 from "pdfh5";
  import "pdfh5/css/pdfh5.css";
  import Panzoom from "@panzoom/panzoom";
  import {useThrottleFn} from '@vueuse/core';
  import useDownloadFile from "@/hooks/useDownloadFile";
  import useDict from "@/hooks/useDict";

  const props = defineProps(["info", "type", "materialType"]);
  const {proxy} = getCurrentInstance();
  const {getFileUrl} = useDownloadFile();
  const panzoomBox = ref(null);
  const pdfh5 = ref(null);
  const {getDataDictionary} = useDict();
  const state = reactive({
    panzoom: null,
    scaleNum: 100, // 当前pdf缩放比例
    shareMaterialList: [],//共享给当事人的材料
    fileUrl: "",
    fileSuffix: "",
    checkShareMaterialList: [],
    materialFormatList: [],
    imageFormatList: [],
    fileFormatList: [],
    audioFormatList: [],
    videoFormatList: [],
  });
  /**
   * 查询共享文件列表
   * **/
  const getShareMaterialList = async () => {
    let params = {
      pageIndex: 1,
      pageSize: 1000
    };
    let response = await getShareMaterialListApi(params);
    if (response.success) {
      state.shareMaterialList = response.data;
    }
  };
  const send = async () => {
    let params = [];
    state.checkShareMaterialList.map(item => {
      params.push({
        fileId: item.fileId,
        fileName: item.fileName
      })
    });
    let response = await shareMaterialListApi(params, props.info.id);
    if (response.success) {
      ElMessage.success('推送成功!');
      state.checkShareMaterialList = [];
    }
  };
  /**
   * 查看文件详情
   * **/
  const checkMaterialContent = useThrottleFn(async (fileId, fileType) => {
    let fileInfoArr = await getFileUrl(fileId, 'pdf', true);
    state.fileUrl = proxy.prefix+fileInfoArr[0].formatFileUrl;

    if (state.fileFormatList.indexOf(fileInfoArr[0].formatSuffix.toLowerCase()) >= 0) {
      state.fileSuffix = 'pdf';
      state.isSaveRecordEvidence = !!state.fileUrl.blockchainId; //文件是否存证
      pdfh5.value = new Pdfh5(pdfh5.value, {
        pdfurl: state.fileUrl + "?v=" + dayjs().format(),
        cMapUrl: './cmaps/',
      });
    } else if (state.imageFormatList.indexOf(fileInfoArr[0].formatSuffix.toLowerCase()) >= 0) {
      state.fileSuffix = "img";
    } else if (state.videoFormatList.indexOf(fileInfoArr[0].formatSuffix.toLowerCase()) >= 0) {
      state.fileSuffix = "video";
    } else if (state.audioFormatList.indexOf(fileInfoArr[0].formatSuffix.toLowerCase()) >= 0) {
      state.fileSuffix = "audio";
    } else {
      ElMessage.error("文件格式有误！");
    }
  }, 800);
  /**
   * 根据扩展名匹配图标
   * **/
  const getFileIcon = (extend) => {
    console.log("audioFormatList", state.audioFormatList);
    console.log("videoFormatList", state.videoFormatList);
    if (!extend) return false;
    let className = "";
    if (state.imageFormatList.indexOf(extend.toLowerCase()) >= 0) {
      className = 'tupian';
    } else if (state.fileFormatList.indexOf(extend.toLowerCase()) >= 0) {
      className = 'pdf'
    } else if (state.audioFormatList.indexOf(extend.toLowerCase()) >= 0) {
      className = "yinpin";
    } else if (state.videoFormatList.indexOf(extend.toLowerCase()) >= 0) {
      className = "shipin";
    }
  };
  /**
   * @description 获取要缩放对象
   * */
  const getPanzoomElement = () => {
    // 增加最大和最小缩放限制
    state.panzoom = Panzoom(panzoomBox.value, {
      // origin: "0 0",
      maxScale: 2,
      minScale: 1,
      overflow: "auto",
      canvas: true,
    });
  };
  /**
   * @description ctrl+滚轮缩放
   * */
  const pdfOnWheel = (event) => {
    // 修改为根据鼠标位置缩放，一次放大显示去掉
    if (event.ctrlKey) {
      const scaleResult = state.panzoom.zoomWithWheel(event);
      state.scaleNum = parseInt(scaleResult.scale * 100);
    }
  };
  /**
   * @description 缩放pdf
   * @param {string} type  add:放大 sub:缩小
   * */
  const pdfScale = (type) => {
    if (type === "add") {
      if (state.scaleNum >= 200) return false;
      state.scaleNum += 1;
    } else if (type === "sub") {
      if (state.scaleNum > 100) {
        state.scaleNum = state.scaleNum <= 0.1 ? state.scaleNum : state.scaleNum - 1;
      }
    }
    state.panzoom.zoom(state.scaleNum / 100);
  };
  /**
   * 查询可上传材料列表
   * **/
  const getMaterialFormat = async () => {
    let formatArr = [];
    formatArr = await getDataDictionary(proxy.constant.DICT.wdgs.value);//文档格式
    formatArr.map(item => {
      state.fileFormatList.push(item.value)
    });
    formatArr = await getDataDictionary(proxy.constant.DICT.tpgs.value);//图片格式
    formatArr.map(item => {
      state.imageFormatList.push(item.value)
    });
    formatArr = await getDataDictionary(proxy.constant.DICT.ypgs.value);//音频格式
    formatArr.map(item => {
      state.audioFormatList.push(item.value)
    });
    formatArr = await getDataDictionary(proxy.constant.DICT.spgs.value);//视频格式
    formatArr.map(item => {
      state.videoFormatList.push(item.value)
    });
    state.materialFormatList = [...state.fileFormatList, ...state.imageFormatList, ...state.audioFormatList, ...state.videoFormatList];
  };
  watch(
    () => state.fileUrl,
    (newValue, oldValue) => {
      if (newValue) getPanzoomElement();
    }
  );
  onMounted(() => {
    getShareMaterialList();
    getMaterialFormat();
  });
</script>

<style lang="scss" scoped>
  .material-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;

    .material-left {
      width: 30%;
      background: white;
      padding: 10px;
      display: flex;
      flex-direction: column;

      .tree-panel {
        flex: 1;
        height: 100%;
        overflow-y: auto;
      }
    }

    .material-right {
      flex: 1;
      overflow-y: hidden;
      background: white;
      margin-left: 10px;
      position: relative;

      img {
        max-width: 100%;
        margin: 0 auto;
      }

      .cunzheng {
        position: absolute;
        top: 50px;
        right: 10px;
      }

      .zoom-bar {
        position: fixed;
        bottom: 55px;
        right: 30px;
        z-index: 5;

        .scale-num {
          font-size: 20px;
          vertical-align: middle;
        }
      }
    }
  }
</style>
