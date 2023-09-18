<template>
  <aside class="record-wrapper">
    <div class="record-left">
      <div ref="pdfh5" style="max-width: 1000px; margin: 0 auto" v-if="props.info.noteFileId"/>
      <div class="h6 mt10" v-else>暂无谈话笔录</div>
      <div class="btn-download" v-if="props.info.noteFileId">
        <template v-for="button in downloadNoteFileFormat" :key="button">
          <el-button size="small" @click="download(button)">
            <svg-icon :size="14" color="currentColor" name="word1" v-if="button === 'word'"/>
            <svg-icon :size="14" color="currentColor" name="pdf1" v-if="button === 'pdf'"/>
            <svg-icon :size="14" color="currentColor" name="ofd" v-if="button === 'ofd'"/>
            <span class="ml5" style="vertical-align: middle">下载{{ button }}笔录</span>
          </el-button>
        </template>
      </div>
      <img class="cunzheng" src="../assets/images/img-cunzheng.png" alt="" v-if="state.isSaveRecordEvidence"/>
    </div>
    <div class="record-right" v-if="state.foldVideo">
      <div class="video-list" v-if="state.videoList.length">
        <el-button type="primary" :class="state.curVideoIndex === index ? 'active' : ''" size="small"
                   v-for="(item, index) in state.videoList" plain @click="changeVideoUrl(item, index)"
        >第{{ index + 1 }}段
        </el-button>
      </div>
      <div class="video-panel" v-if="state.videoPath">
        <div class="nav-bar">
          <div class="content" @click="state.foldVideo = !state.foldVideo">
            <svg-icon name="icon_zhedieshipin" title="折叠视频" :size="24" color="currentColor"/>
            <span>折叠视频</span>
          </div>
          <div class="content" @click="downloadVideo">
            <svg-icon name="icon_xiazai" title="下载视频" :size="24" color="currentColor"/>
            <span>下载视频</span>
          </div>
        </div>
        <video controls="controls" style="width: 100%;" :src="proxy.prefix + state.videoPath"/>
      </div>
      <div class="video-panel" v-else>
        <img src="../assets/images/img-no-video.png" alt="" style="width: 30%"/>
        <p class="mt10">暂未发现相关视频</p>
      </div>
      <img class="cunzheng" src="../assets/images/img-cunzheng.png" alt="" v-if="state.isSaveVideoEvidence"/>
    </div>
    <div class="right-bar" v-if="!state.foldVideo">
      <div class="content" @click="state.foldVideo = !state.foldVideo">
        <svg-icon name="icon_zhankaishipin" :size="24" color="currentColor"/>
        <span>展开视频</span>
      </div>
    </div>
    <el-dialog v-model="state.dialogVisible" title="下载进度" width="500px" :close-on-click-modal="false"
               :show-close="false">
      <span>正在下载：{{ info.meetingName }}.mp4</span>
      <el-progress :percentage="state.percentage"/>
    </el-dialog>
  </aside>
</template>

<script setup lang="ts">
  import {dayjs} from 'element-plus'
  import useDownloadFile from '@/hooks/useDownloadFile'
  import useMeetingConfig from "@/hooks/useMeetingConfig";
  import Pdfh5 from "pdfh5";
  import "pdfh5/css/pdfh5.css";

  const props = defineProps(["info"]);
  const {proxy} = getCurrentInstance();
  const {getFileUrl} = useDownloadFile();
  const {downloadNoteFileFormat} = useMeetingConfig();
  const pdfh5 = ref(null);
  const state = reactive({
    noteImageList: [],
    videoList: [],
    foldVideo: true,
    videoPath: "",
    recordPath: {
      pdfUrl: "",
      docUrl: "",
      ofdUrl: "",
    },
    curVideoIndex: 0,
    dialogVisible: false, // 下载显示框
    percentage: 0, // 下载进度百分比
    isSaveRecordEvidence: false, //笔录是否存证
    isSaveVideoEvidence: false, //录像是否存证
  });
  /**
   * 谈话笔录
   * **/
  const getNoteImageList = async () => {
    if (props.info.noteFileId) {
      let response = await getFileUrl(props.info.noteFileId, 'pdf', true);
      if (response.length) {
        pdfh5.value = new Pdfh5(pdfh5.value, {
          pdfurl: proxy.prefix + response[0].formatFileUrl + "?v=" + dayjs().format(),
          cMapUrl: './cmaps/',
        });
      }
    }
  };
  /**
   * 谈话视频
   * **/
  const getVideoPath = async () => {
    if (props.info.recordFileId) {
      let response = await getFileUrl(props.info.recordFileId);
      if (response.length) {
        state.videoPath = response[0].fileUrl;
        state.videoList = response;
        state.isSaveVideoEvidence = !!response[0]?.recordBlockchainId;
      }
    }
  };
  /**
   * 下载文件
   * **/
  const download = async (type) => {
    let formatType = type === 'word' ? 'docx' : type;
    let response = await getFileUrl(props.info.noteFileId, formatType, true);
    let x = new XMLHttpRequest(),
      fullFileName = "";
    //判断文件类型，给文件名加上后缀。
    if (type === "word") {
      x.open("GET", proxy.prefix + response[0].fileUrl, true);
      fullFileName = props.info.meetingName + "." + formatType;
    } else if (type === "pdf") {
      x.open("GET", proxy.prefix + response[0].formatFileUrl, true);
      fullFileName = props.info.meetingName + ".pdf";
    } else if (type === "ofd") {
      x.open("GET", proxy.prefix + response[0].formatFileUrl, true);
      fullFileName = props.info.meetingName + ".ofd";
    }
    x.responseType = "blob";
    x.onload = function (e) {
      //会创建一个 DOMString，其中包含一个表示参数中给出的对象的URL。这个 URL 的生命周期和创建它的窗口中的 document 绑定。这个新的URL 对象表示指定的 File 对象或 Blob 对象。
      let url = window.URL.createObjectURL(x.response);
      let a = document.createElement("a");
      a.href = url;
      a.download = fullFileName; //props.info.meetingName;20220517 lvhs THX-875
      a.click();
    };
    x.send();
  };
  /**
   * 下载视频
   * **/
  const downloadVideo = () => {
    let x = new XMLHttpRequest();
    x.open("GET", proxy.prefix + state.videoPath, true);
    x.responseType = "blob";
    state.dialogVisible = true;
    x.onload = function (e) {
      //会创建一个 DOMString，其中包含一个表示参数中给出的对象的URL。这个 URL 的生命周期和创建它的窗口中的 document 绑定。这个新的URL 对象表示指定的 File 对象或 Blob 对象。
      let url = window.URL.createObjectURL(x.response);
      let a = document.createElement("a");
      a.href = url;
      a.download = props.info.meetingName + ".mp4";
      a.click();
    };
    //监听进度事件
    x.addEventListener(
      "progress",
      function (evt) {
        if (evt.lengthComputable) {
          let percentComplete = evt.loaded / evt.total;
          // percentage是当前下载进度，可自行处理
          let percentage = percentComplete * 100;
          state.percentage = Math.round(percentage);
          if (percentage === 100) {
            state.dialogVisible = false;
            state.percentage = 0;
          }
        }
      },
      false
    );
    x.send();
  };
  /**
   * 切换当前显示视频
   * **/
  const changeVideoUrl = (item, index) => {
    state.videoPath = item.fileUrl;
    state.isSaveVideoEvidence = !!item?.recordBlockchainId;
    state.curVideoIndex = index;
  };
  watch(
    () => props.info,
    () => {
      getNoteImageList();
      getVideoPath();
    }
  );
</script>

<style lang="scss" scoped>
  .record-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    box-sizing: border-box;
    justify-content: space-between;

    .record-left,
    .record-right {
      flex: 1;
      height: 99.5%;
      min-height: 99.5%;
      background: white;
      text-align: center;

      .cunzheng {
        position: absolute;
        top: 50px;
        right: 10px;
      }
    }

    .record-left {
      overflow: auto;
      position: relative;

      .pdf-page {
        border-bottom: solid 2px #bbb;
      }

      .btn-download {
        position: absolute;
        bottom: 10px;
        right: 20px;
        z-index: 20;
        width: 450px;
        height: 47px;

        button {
          width: 140px;
          height: 34px;
          background: white;
          border-radius: 4px;
          font-size: 13px;
          border: solid 1px #148afe;
          color: #148afe;
        }
      }
    }

    .record-right {
      position: relative;
      margin-left: 10px;
      display: flex;
      flex-direction: column;

      &:hover {
        .nav-bar {
          width: 96px;
        }
      }

      &.fold {
        flex: 0;
      }

      .nav-bar {
        width: 0;
        height: 36%;
        position: absolute;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        z-index: 9;
        background: rgba(255, 255, 255, 0.8);
        transition: all 0.1s;
        overflow-x: hidden;
        border-radius: 0 5px 5px 0;

        .content {
          color: var(--el-color-primary);
          text-align: center;
          height: 50%;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: center;
          justify-items: center;
          align-items: center;

          span {
            width: 100%;
            font-size: 14px;
            text-align: center;
            margin-top: 5px;
          }

          * {
            display: block;
          }
        }
      }

      .no-video {
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .video-list {
        padding: 10px;
        text-align: left;
        width: 100%;

        button:nth-child(8) {
          margin-left: 0;
          margin-top: 1rem;
        }

        .el-button--primary.is-plain {
          background: white;
          border: 1px solid #488edb;
          color: #488edb;
          width: 96px;

          &:hover {
            color: #488edb;
          }

          &.active {
            background: var(--el-color-primary);
            color: white;
          }
        }
      }

      .video-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }

    .right-bar {
      width: 96px;
      height: 100%;
      transition: all 0.1s;
      overflow-x: hidden;
      background: white;
      position: relative;
      margin-left: 10px;
      box-shadow: -3px 0px 6px 0px rgba(48, 116, 204, 0.28);

      .content {
        color: var(--el-color-primary);
        text-align: center;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        span {
          width: 70px;
          font-size: 16px;
        }

        * {
          display: block;
        }
      }
    }
  }
</style>
