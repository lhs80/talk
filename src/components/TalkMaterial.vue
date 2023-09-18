<!--开会时或者从主页预约会议中的上传材料打开页面时，可以显示-->
<template>
  <aside class="material-wrapper">
    <div class="material-left">
      <el-tree class="tree-panel"
               :default-expanded-keys="state.expandFoldList"
               draggable
               node-key="userId"
               :indent="0"
               :props="state.treeOptions"
               :data="state.materialList"
               :allow-drag="allowDrag"
               :allow-drop="allowDrop"
               @node-drop="handleDrop"
               @node-collapse="handleCollapse"
               @node-expand="handleExpand"
      >
        <template #default="{ node, data }">
          <!--文件夹节点-->
          <div v-if="node.level === 1">
            <svg-icon name="wenjianjiadakai" v-if="node.expanded"/>
            <svg-icon name="wenjianjiashouqi" v-else/>
            <el-text class="ml10">{{ node.label }}</el-text>
          </div>
          <!--文件节点-->
          <el-row style="width: 100%" align="middle" v-else>
            <el-col :span="2" v-if="state.type === 'upload'">
              <svg-icon name="icon_tuodong"/>
            </el-col>
            <el-col :span="state.type === 'upload' ? 14 : 16">
              <svg-icon :name="`${getFileIcon(data.extend)}`"/>
              <span class="text-ellipsis" style="vertical-align: middle"
                    @click="checkMaterialContent(data.fileId,data.extend)"
                    v-if="state.renameFileId !== data.id"
                    :title="data.name"
              >
                {{ data.name }}
              </span>
              <el-input size="small" v-model="state.newFileName" v-else/>
            </el-col>
            <el-col :span="8" class="menu">
              <el-icon :size="36">
                <Check title="重命名" @click.stop="rename" v-if="state.renameFileId === data.id"/>
                <EditPen title="重命名" @click.stop="todoRename(data.id, node.label)" v-else/>
                <Download title="导出" @click.stop="downFile(data.fileId,data.name,data.extend)"/>
              </el-icon>
            </el-col>
          </el-row>
        </template>
      </el-tree>
      <!--      <el-upload-->
      <!--        ref="upload"-->
      <!--        class="btn-upload"-->
      <!--        action="#"-->
      <!--        :http-request="uploadFile"-->
      <!--        :show-file-list="false"-->
      <!--        :multiple="true"-->
      <!--        v-if="props.type === 'upload' || props.type === 'beforeUpload'"-->
      <!--      >-->
      <!--        <el-button type="primary" style="width: 100%">导入材料</el-button>-->
      <!--      </el-upload>-->
      <el-row :gutter="10">
        <el-col :span="12">
          <xsy-upload :multiple="true"
                      :show-file-list="false"
                      :on-change="uploadFile"
                      v-if="props.type === 'upload' || props.type === 'beforeUpload'">
            <el-button type="primary" style="width: 100%">导入文件</el-button>
          </xsy-upload>
        </el-col>
        <el-col :span="props.type === 'upload' || props.type === 'beforeUpload'?12:24">
          <el-button type="primary" @click="exportALL" style="width: 100%">导出全部</el-button>
        </el-col>
      </el-row>

      <!--只有开会时，可以显示-->
      <div class="text-center" v-if="props.type === 'upload'">
        <span class="mr5 h6" style="vertical-align: middle">允许参与人上传材料</span>
        <el-switch v-model="state.allowUpload" @change="toggleAllowUpload"/>
      </div>
    </div>
    <div class="material-right">
      <div ref="panzoomBox" v-show="state.fileUrl" @wheel="pdfOnWheel">
        <div ref="pdfh5" style="max-width: 1000px; margin: 0 auto" v-show="state.fileSuffix === 'pdf'"/>
        <div class="img-preview" :style="{backgroundImage:`url(${state.fileUrl})`}"
             v-if="state.fileSuffix === 'img'"/>
        <video :src="state.fileUrl" style="width: 100%" v-if="state.fileSuffix === 'video'" controls/>
        <audio :src="state.fileUrl" style="width: 100%" v-if="state.fileSuffix === 'audio'" controls/>
      </div>
      <!--      <svg-icon :size="100" name="empty" v-else/>-->
      <el-empty description="当前没有显示材料" :image="getAssetsImage('no-content.png')" :image-size="160"
                v-if="!state.fileUrl"/>
      <div class="zoom-bar" v-if="state.fileUrl">
        <svg-icon size="large" name="suoxiao" @click="pdfScale('sub')"/>
        <el-text class="scale-num"> {{ state.scaleNum }}%</el-text>
        <svg-icon size="large" name="fangda" @click="pdfScale('add')"/>
      </div>
      <img class="cunzheng" src="../assets/images/img-cunzheng.png" alt="" v-if="state.isSaveRecordEvidence"/>
    </div>
  </aside>
</template>

<script setup lang="ts">
  import {getMaterialListApi, editFileApi, materialsExportApi} from "@/api/modules/cms";
  import {allowAttendUploadApi} from "@/api/modules/mcs";
  import {ElMessage, dayjs} from "element-plus";
  import Pdfh5 from "pdfh5";
  import "pdfh5/css/pdfh5.css";
  import Panzoom from "@panzoom/panzoom";
  import {useThrottleFn} from "@vueuse/core";
  import useDict from "@/hooks/useDict";
  import useUploadFile from "@/hooks/useUploadFile";
  import useDownloadFile from "@/hooks/useDownloadFile";
  import {getToken} from "@/utils/auth";
  import {FolderOpened, Folder, Download, Check, EditPen} from "@element-plus/icons-vue";
  import getAssetsImage from '@/utils/getAssetsImage'
  import mittBus from '@/utils/mittBus'

  let materialListTimer = null; //定时查询材料列表
  const props = defineProps(["info", "type", "materialType"]);
  const {proxy} = getCurrentInstance();
  const {getDataDictionary} = useDict();
  const {startUploadFile} = useUploadFile();
  const {getFileUrl} = useDownloadFile();
  const panzoomBox = ref(null);
  const pdfh5 = ref(null);
  const state = reactive({
    panzoom: null,
    scaleNum: 100, // 当前pdf缩放比例
    allowUpload: false, //允许参会人上传材料
    materialList: [],
    fileUrl: "",
    fileSuffix: "",
    renameFileId: "",
    newFileName: "",
    materialFormatList: [],
    expandFoldList: [], //默认打开的文件夹列表
    canRefreshExpandFoldList: true, //是否可更新展开文件夹列表
    isSaveRecordEvidence: false, //是否存证
    treeOptions: {
      label: function (data, node) {
        return data.groupName || data.name;
      },
      children: "caseMaterialList",
    },
    imageFormatList: [],
    fileFormatList: [],
    audioFormatList: [],
    videoFormatList: [],
  });
  /**
   * 查询文件列表
   * **/
  const getMaterialList = async () => {
    let response = await getMaterialListApi(props.info.caseId);
    if (response.success) {
      state.materialList = response.data;
      if (state.canRefreshExpandFoldList) {
        state.materialList.forEach((item) => {
          if (item.caseMaterialList.length) state.expandFoldList.push(item.userId);
        });
      }
    }
  };
  /**
   * 查看文件详情
   * **/
  const checkMaterialContent = useThrottleFn(async (fileId, fileType) => {
    state.scaleNum = 100;
    //图片不使用PDF查看；
    const isImage = state.imageFormatList.indexOf(fileType.toLowerCase()) >= 0;
    let fileInfoArr = await getFileUrl(fileId, isImage ? '' : 'pdf', true);
    let {fileSuffix, formatSuffix, formatFileUrl, fileUrl} = fileInfoArr[0];
    state.fileUrl = proxy.prefix + (isImage ? fileUrl : formatFileUrl);

    if (formatSuffix && state.fileFormatList.indexOf(formatSuffix.toLowerCase()) >= 0) {
      state.fileSuffix = 'pdf';
      state.isSaveRecordEvidence = !!state.fileUrl.blockchainId; //文件是否存证
      pdfh5.value = new Pdfh5(pdfh5.value, {
        pdfurl: state.fileUrl + "?v=" + dayjs().format(),
        cMapUrl: './cmaps/',
      });
    } else if (fileSuffix && state.imageFormatList.indexOf(fileSuffix.toLowerCase()) >= 0) {
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
   * 上传材料
   * **/
  const uploadFile = async (file) => {
    console.log(file);
    let name = file.name.split(".");
    if (file.name.length > 50) return ElMessage.error("您上传的文件名称过长");
    //如果文件类型符合要求
    if (state.materialFormatList.indexOf(name[name.length - 1].toLowerCase()) >= 0) {
      let datas = {
        caseId: props.info.caseId,
        fileType: 3,
        fileName: file.name,
        meetingId: props.info.id,
        file
      };
      let response = startUploadFile(datas);
      if (response.success) {
        await getMaterialList();
      }
    } else {
      ElMessage.error("您选择的文件格式不支持上传!");
    }
  };
  /**
   * 查询可上传材料列表
   * **/
  const getMaterialFormat = async () => {
    let formatArr: unknown = [];
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
  /**
   * 只有子级节点可以拖动
   * 开会时或者主页点击预约会议中的“上传材料”时，可以拖动；
   * **/
  const allowDrag = (draggingNode) => {
    return draggingNode.level > 1 && (props.type === "upload" || props.type === "beforeUpload");
  };
  /**
   * 节点只能被放置到父节点中
   * **/
  const allowDrop = (draggingNode, dropNode, type) => {
    return type === "inner" && dropNode.level < draggingNode.level;
  };
  /**
   * 拖动文件后，提交数据，保存位置
   * **/
  const handleDrop = async (draggingNode, dropNode, dropType, ev) => {
    let params = {
      id: draggingNode.data.id,
      userId: dropNode.data.userId,
    };
    let response = await editFileApi(params);
  };
  /**
   * 用户动手关闭文件夹
   * **/
  const handleCollapse = async (data, node, treeNode) => {
    //用户手机关闭文件夹时，从展开文件夹列表中删除
    let index = state.expandFoldList.findIndex((item) => {
      return item === data.userId;
    });
    state.expandFoldList.splice(index, 1);
  };
  /**
   * 用户动手打开文件夹
   * **/
  const handleExpand = async (data, node, treeNode) => {
    //用户手机打开文件夹时，把ID追加到展开文件夹列表中删除
    state.expandFoldList.push(data.userId);
  };
  /**
   * 是否允许参会人上传文件
   * **/
  const toggleAllowUpload = async (value) => {
    let params = {
      meetingId: props.info.id,
      enable: value,
      users: [getToken().userId]
    };
    let response = await allowAttendUploadApi(params);
  };
  /**
   * 根据扩展名匹配图标
   * **/
  const getFileIcon = (extend) => {
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
    return className;
  };
  /**
   * 准备文件重命名
   * **/
  const todoRename = (fileId, fileName) => {
    state.renameFileId = fileId;
    state.newFileName = fileName;
  };
  /**
   * 文件重命名
   * **/
  const rename = async () => {
    let params = {
      id: state.renameFileId,
      name: state.newFileName,
    };
    let response = await editFileApi(params);
    if (response.success) {
      state.renameFileId = "";
      state.newFileName = "";
      await getMaterialList();
    }
  };
  /**
   * @description 下载文件
   * **/
  const downFile = async (fileId, fileName, fileType) => {
    let fileUrl = await getFileUrl(fileId);
    let url = proxy.prefix + fileUrl[0].fileUrl;
    console.log(url);
    let fullFileName = fileName + "." + fileType;
    let x = new XMLHttpRequest();
    x.open("GET", url, true);
    x.responseType = "blob";
    x.onload = function (e) {
      //会创建一个 DOMString，其中包含一个表示参数中给出的对象的URL。这个 URL 的生命周期和创建它的窗口中的 document 绑定。这个新的URL 对象表示指定的 File 对象或 Blob 对象。
      let url = window.URL.createObjectURL(x.response);
      let a = document.createElement("a");
      a.href = url;
      a.download = fullFileName;
      a.click();
    };
    x.send();
  };
  //导出全部材料
  const exportALL = async () => {
    const response = await materialsExportApi(props.info.caseId);
    if (response) {
      let url = window.URL.createObjectURL(new Blob([response], {type: 'application/octet-stream'}));
      let link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', `${props.info.meetingName}.zip`);// 文件名
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);// 下载完成移除元素
      window.URL.revokeObjectURL(url); // 释放掉blob对象
    }
  };
  // 获取要缩放对象
  const getPanzoomElement = () => {
    // 增加最大和最小缩放限制
    state.panzoom = Panzoom(panzoomBox.value, {
      maxScale: 2,
      minScale: 0.7,
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
  const allowFileUpload = (e) => {
    state.allowUpload = e;
  };
  watch(() => props.info, (newValue, oldValue) => {
    clearInterval(materialListTimer); //清空定时器
    if (Object.keys(props.info).length && props.info.id) {
      state.allowUpload = props.info.upLoadFile;
      getMaterialList();
      // 定时查询材料列表，保持各方同步
      // 会议中根据ws通知进行刷新
      // 会前上传材料时，定时查询
      if (props.type === 'beforeUpload')
        materialListTimer = setInterval(() => {
          getMaterialList();
        }, 10000);
    }
  });
  watch(
    () => state.fileUrl,
    (newValue, oldValue) => {
      if (newValue) getPanzoomElement();
    }
  );
  onMounted(() => {
    getMaterialFormat();
    mittBus.on("FILE_UPLOAD", allowFileUpload); //允许上传材料
    mittBus.on("NEW_MATERIAL", getMaterialList); //允许上传材料
  });
  onBeforeRouteLeave(() => {
    window.clearInterval(materialListTimer); //清空定时器
    mittBus.off("FILE_UPLOAD", allowFileUpload); //允许
    mittBus.off("NEW_MATERIAL", getMaterialList); //允许
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
      box-sizing: border-box;
      display: flex;
      flex-direction: column;

      .tree-panel {
        flex: 1;
        overflow-y: auto;
      }
    }

    .material-right {
      flex: 1;
      overflow-y: hidden;
      background: white;
      margin-left: 10px;
      position: relative;

      & > div:first-child {
        height: 100%;
      }

      img {
        max-width: 100%;
        margin: 0 auto;
      }

      .img-preview {
        width: 100%;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center center;
        /*padding-top: 70%;*/
        height: 100%;
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
          display: inline-block;
          vertical-align: middle;
        }
      }
    }
  }
</style>
<style lang="scss">
  .btn-upload {
    .el-upload {
      width: 100%;
      margin-top: 10px;
    }
  }

  .material-left {
    .el-tree-node__content {
      &:hover {
        background: #e4f2ff;

        .menu {
          color: #409eff;
          display: inline-block;
          text-align: right;
        }
      }

      .menu {
        display: none;
      }
    }

    .el-tree-node__content {
      .el-tree-node__expand-icon {
        display: none;
      }
    }
  }

  .pinch-zoom-container {
    height: 100% !important;
  }
</style>
