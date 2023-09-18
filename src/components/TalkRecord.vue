<template>
  <div>
    <div class="office">
      <!-- 笔录页面 -->
      <div id="placeholder"/>
      <!-- 语音转写弹出框 -->
      <div class="voice-transfer" v-show="state.voiceTransfer">
        <span class="voice-transfer-user">
          <i style="color: #2893ed" v-if="state.speakUserName">{{ state.speakUserName }}：</i>
          {{ state.voiceTransferText }}
        </span>
      </div>
      <!-- 笔录签名的用户列表 -->
      <!--      <div class="sign-name-panel" v-show="state.signNameCheck">-->
      <!--        <div class="sign-title">笔录签名</div>-->
      <!--        <div class="sign-person-list">-->
      <!--          <el-table ref="signNameTabRef" :data="state.checkWordUserList" :show-header="false"-->
      <!--                    @select="selectUser">-->
      <!--            <el-table-column type="selection" width="35"/>-->
      <!--            <el-table-column label="用户" :show-overflow-tooltip="true">-->
      <!--              <template #default="scope">{{ scope.row.alias }}</template>-->
      <!--            </el-table-column>-->
      <!--            <el-table-column label="状态">-->
      <!--              <template #default="scope">-->
      <!--                <span class="no_send" v-if="scope.row.signStatus===-1">未签名</span>-->
      <!--                <span :class="scope.row.signStatus?'confirm_sign':'no_sign'"-->
      <!--                      v-else>{{scope.row.signStatus?'已签名':'已发送'}}</span>-->
      <!--              </template>-->
      <!--            </el-table-column>-->
      <!--          </el-table>-->
      <!--        </div>-->
      <!--        <div class="sign-name-btn">-->
      <!--          <el-button size="small" @click="state.signNameCheck = false">取消</el-button>-->
      <!--          <el-button size="small" @click="sendSignNameWord">发送</el-button>-->
      <!--        </div>-->
      <!--      </div>-->
      <el-drawer modal-class="sign-panel-modal"
                 title="笔录签名"
                 :show-close="false"
                 :append-to-body="true"
                 :modal="false"
                 size="210px"
                 v-model="state.signNameCheck"
      >
        <el-table ref="signNameTabRef" :data="state.checkWordUserList" :show-header="false" @select="selectUser">
          <el-table-column type="selection" width="35"/>
          <el-table-column label="用户" :show-overflow-tooltip="true">
            <template #default="scope">{{ scope.row.alias }}</template>
          </el-table-column>
          <el-table-column label="状态">
            <template #default="scope">
              <el-text v-if="scope.row.signStatus===-1">未签名</el-text>
              <el-text :type="scope.row.signStatus?'success':'primary'" v-else>{{scope.row.signStatus?'已签名':'已发送'}}
              </el-text>
            </template>
          </el-table-column>
        </el-table>
        <template #footer>
          <el-button block @click="state.signNameCheck = false">取消</el-button>
          <el-button block type="primary" @click="sendSignNameWord">发送</el-button>
        </template>
      </el-drawer>
      <div class="signNameDialog" :class="state.signNameCheck === true ? 'right' : ''" v-if="state.signNameDialog">
        <el-popover width="200px" popper-class="tips_popover" placement="left" trigger="hover"
                    v-if="state.historySignInfo.fileUrl">
          <template #reference>
            <el-button @click="sendSignNameFun">使用上次签名</el-button>
          </template>
          <div class="signNameDialog_body" style="width:150px;" @click="sendSignNameFun">
            <!-- 图片加个时间戳防止不刷新 -->
            <el-image :src="proxy.prefix+state.historySignInfo.fileUrl + '?' + new Date().getTime()"
                      fit="fill"/>
          </div>
        </el-popover>
        <el-popover width="180px" popper-class="tips_popover" placement="left" trigger="hover">
          <template #reference>
            <el-button>扫码签名</el-button>
          </template>
          <div>
            <el-image :src="state.signNameQRCode" fit="fill"></el-image>
            <h5 class="mt5 text-center">手机扫码进行签名</h5>
          </div>
        </el-popover>
      </div>
      <!-- 导入文件弹出框-->
      <el-dialog v-model="state.showImportFileDlg" title="导入文件" width="420px" append-to-body="true"
                 :close-on-click-modal="false">
        <!--        :action="`${proxy.prefix}/ess/api/v1/note/import`"-->
        <!--        :data="{taskId:state.documentParams.taskId}"-->
        <!--        <el-upload-->
        <!--          class="upload-panel"-->
        <!--          ref="uploadRef"-->
        <!--          drag-->
        <!--          accept=".doc,.docx,.wps"-->
        <!--          :headers="{ token: state.token }"-->
        <!--          multiple-->
        <!--          :limit="1"-->
        <!--          :on-exceed="onFileExceed"-->
        <!--          :on-change="onFileChange"-->
        <!--          :before-upload="beforeFileUpload"-->
        <!--          :on-remove="onFileRemove"-->
        <!--          :on-success="onFileSuccess"-->
        <!--          :on-error="onFileError"-->
        <!--          :file-list="state.uploadFileList"-->
        <!--          :auto-upload="false"-->
        <!--          name="noteFile"-->
        <!--        >-->
        <!--          <svg-icon :size="60" name="shangchuan"></svg-icon>-->
        <!--          <div class="el-upload__text">将文件拖到此处，或<i class="text-primary">点击上传</i></div>-->
        <!--          <template #tip>-->
        <!--            <div class="h6 mt10 text-lightgray">提示</div>-->
        <!--            <div class="h6 mt10">·导入文件后，当前笔录将会自动转存，可至<i class="text-danger">[谈话材料-法院材料]</i>处查阅</div>-->
        <!--            <div class="h6">·只支持导入doc/docx/wps文件</div>-->
        <!--          </template>-->
        <!--        </el-upload>-->
        <xsy-upload
          ref="uploadRef"
          accept=".doc,.docx,.wps"
          :drag="true"
          :on-change="onFileChange"
          :before-upload="beforeFileUpload"
          :on-remove="onFileRemove"
          :file-list="state.uploadFileList"
        >
          <svg-icon :size="60" name="shangchuan"></svg-icon>
          <div class="el-upload__text">将文件拖到此处，或<i class="text-primary">点击上传</i></div>
          <template #tip>
            <div class="h6 mt10 text-lightgray">提示</div>
            <div class="h6 mt10">·导入文件后，当前笔录将会自动转存，可至<i class="text-danger">[谈话材料-法院材料]</i>处查阅</div>
            <div class="h6">·只支持导入doc/docx/wps文件</div>
          </template>
        </xsy-upload>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="info" plain size="small" @click="closeUploadFile">取消</el-button>
            <el-button type="primary" size="small" @click="uploadFile" :disabled="!state.uploadFileList.length">
              确定
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {ElMessage} from 'element-plus'
  import {useDebounceFn} from "@vueuse/core";
  import {getToken} from "@/utils/auth";
  import {
    noteSignApi,
    getRecordStatusApi,
    getSignQrcodeApi,
    lastSignApi,
    noteCreateApi,
    noteFinishApi,
    noteImportApi
  } from '@/api/modules/ess'
  import {receiveDataApi, stopReceiveDataApi} from "@/api/modules/mcs";
  import {getServiceListApi, getElectronicSignApi,} from '@/api/modules/pbs'
  import useDownloadFile from "../hooks/useDownloadFile";
  import mittBus from "@/utils/mittBus";

  let docEditor;
  const props = defineProps({
    fullType: {
      //是否显示用户信息
      type: String,
      default: "",
    },
  });
  const emits = defineEmits(['setRecordFull']);
  const {proxy} = getCurrentInstance();
  const route = useRoute();
  const uploadRef = ref(null);
  const signNameTabRef = ref(null);
  let mineInfo = inject("mineInfo"); //当前用户信息
  let meetingInfo = inject("meetingInfo"); //当前用户信息
  let attendList = inject("attendList"); //当前用户信息
  let {getFileUrl} = useDownloadFile();
  const state = reactive({
    showDrawer: true,
    token: getToken().token,
    selectUserList: [],//"", // 选中的用户
    voiceTransferText: "", // 语音转写的文本框
    showImportFileDlg: false, //导入笔录文件弹窗
    voiceTransfer: false, // 语言转写弹出框显示与否
    signNameCheck: false, // 签名弹出框显示与否
    confirmDialog: false, // 笔录确定弹出框
    historySignInfo: {
      fileUrl: '',
      fileId: ''
    }, // 历史签名图片
    historySignName: false, // 历史签名是否存在
    signNameQRCode: "", // 签名二维码
    signNameDialog: false, // 笔录签名确定弹出框
    checkActiveName: "signName", // 签名弹出框中-选中的tab默认是哪个
    checkWordUserList: [], // 签字用户列表
    allUserListData: [], // 所有用户，用于转写重新谁在说话
    speakUserName: "", // 说话的人名字
    userSignNameImg: [], // 用户签名图片用于插入文档
    userSignNameImgName: [], // 存放用户签名截取的图片名称，用于去重的
    documentParams: {},
    uploadFileList: [], //上传的文件列表
    historySignData: []
  });
  // 初始化畅写服务器参数
  const initCxServer = async () => {
    if (!meetingInfo.value.id) return false;
    let params = {
      caseId: meetingInfo.value.caseId,
      orderId: meetingInfo.value.id
    };
    let response = await noteCreateApi(params);
    if (response.success) {
      state.documentParams = response.data;
      initCxDocument();
    }
  };
  // 初始化畅写文档
  const initCxDocument = async () => {
    let fileInfo = await getFileUrl(state.documentParams.fileVisitUrl);
    if (docEditor) docEditor.destroyEditor();
    // const isHaveRole = mineInfo.value.userId === meetingInfo.value.recorder; //当前用户是不是主持人
    const pageType = "desktop";
    // 编辑的文档类型，写死（模板都是docx，暂不支持用户自定义上传文件），该参数也可以从fileVisitUrl路由后缀切割动态获取
    const docType = "docx";
    const documentType = "word";
    // 编辑控件的 document 权限 暂时写死，ui 控件样式设置 可以去除tab
    const officePermission = {
      edit: true, //编辑模式
      download: false, //是否开启下载权限
      modifyContentControl: true,
      changeHistory: true,
      fillForms: true,
      print: true,
      comment: true,
      review: true, // 开启修订模式
    };
    // 初始化创建畅写office
    docEditor = new window.CXO_API.CXEditor("placeholder", {
      type: pageType,
      width: "100%",
      height: "100%",
      documentType: documentType,
      document: {
        title: state.documentParams.docKey + "." + docType, // 这个决定下载名称
        url: `${proxy.prefix}${fileInfo[0].fileUrl}`,
        fileType: docType,
        key: state.documentParams.docKey,
        permissions: officePermission,
      },
      events: {
        onError: onError,
        onDownloadAs: onDownloadAs, // 这个事件的触发是 调用 downloadAs check
      },
      editorConfig: {
        mode: "edit",
        user: {
          id: state.documentParams.userId, //userId,
          name: state.documentParams.username, // username
        },
        lang: "zh",
        callbackUrl: `${proxy.prefix}/ess/api/v1/note/uploadForCX`,
        customization: {
          chat: false,
          comments: true, // todo 竟然是这个参数 决定了 协作tab中 是否出现协作模式的调整选择 批准和删除也在这里
          zoom: 100,
          leftMenu: false, // 开启左侧菜单
          rightMenu: false, // 开启右侧菜单
          toolbar: true, // 开启菜单栏
          header: true, // false
          about: true,
          toolbarNoTabs: true,
          statusBar: true,
          autosave: true,
          // plugins: isHaveRole, // 是否显示扩展菜单--只有主持人可以显示扩展菜单
          displayTitle: false,
          pluginMenuTitle: "笔录",
          activePlugins: true, //是否激活插件菜单
        },
        plugins: {
          // 是否显示扩展菜单
          pluginsData: setCustomToolBar(),
        },
      },
    });
  };
  const setCustomToolBar = () => {
    // const isHaveRole = mineInfo.value.userId === meetingInfo.value.recorder; //当前用户是不是主持人
    let canUseTranscribe = {}, menuList = [];
    menuList = [`${proxy.cx}/cxApi/check_sign_api/config.json`, `${proxy.cx}/cxApi/upload_api/config.json`];

    getServiceListApi({type: 1}).then(response => {
      if (response.success) {
        canUseTranscribe = response.data.find(item => {
          return item.id === proxy.constant.IDS.yyzx.id
        });
        if (canUseTranscribe && canUseTranscribe.enableSee) {
          menuList.unshift(`${proxy.cx}/cxApi/stop_voice_api/config.json`);
          menuList.unshift(`${proxy.cx}/cxApi/voice_api/config.json`);
        }
      }
    });
    return menuList;
  };
  // 畅写报错回调
  const onError = (event) => {
    if (event) console.log(event.data);
  };
  // 是前端的下载
  const onDownloadAs = (event) => {
    window.open(event.data); // 直接下载即可
  };
  // 重要的方法 获取文档组件 和 文档相关内容都通过这里回调
  const onGetDocumentContent = (event) => {
    console.log("onGetDocumentContent", event);
    if (event.data) {
      if (event.data.object === "content" && event.data.type === 'image') {
        event.data.image.map(image => {
          state.historySignData.push(`{"img":[${JSON.stringify(image.img[0])},${JSON.stringify(image.img[1])},${JSON.stringify(image.img[2])}]}`);
        });
      } else if (event.data.object == "content" && event.data.type == "text") {
        // 增量替换逻辑 不能使用全量 文档会卡死的，但是在畅写提供新版本之前，先这样处理
        let currentAstRes = event.data.text[0].text;
        currentAstRes += astResOneTalk;

        // 全量覆盖 - 不可取，临时方法  todo 畅写的方案有两种 1. 文字域内容后追加  2. 富文本域 内容后追加
        var nrobject = {
          object: "content", //表示操作对象为内容域，必填项
          type: "replace", //表示操作行为是替换内容，必填项
          name: contentAstRes, //内容域的标签，可以是英文数字，优先级高于ID
          id: astResContentId, //内容域的ID，name和id必须有一
          value: currentAstRes,
        };
        docEditor.setDocumentContent(nrobject);
      }
    }
  };
  // 获取选中的人
  const selectUser = (selection, row) => {
    state.selectUserList = [];
    console.log("selectUser", selection);
    // state.selectUserList = selection.map((item) => item.userId).toString();
    selection.forEach((item) =>
      state.selectUserList.push({
        userId: item.userId,
        userRole: item.userRole
      })
    )
  };
  // 发送笔录签名
  const sendSignNameWord = () => {
    // 发送用户不能为空
    if (!state.selectUserList.length) {
      ElMessage.warning("请选择要发送的用户！");
      return;
    }
    noteSignApi({
      materialId: state.documentParams.materialId,
      userList: state.selectUserList,
      taskId: state.documentParams.taskId
    }).then((res) => {
      if (res.success) {
        // 清除用户选中
        signNameTabRef.value.clearSelection();
        // 清空处理的数据
        state.selectUserList = [];
      }
    });
    state.signNameCheck = false;
  };
  // 获取核对签名状态信息
  const sendCheckWordInfoList = async () => {
    state.checkWordUserList = attendList.value.filter((item) => {
      return !item.memberType;
    });
    let params = {
      materialId: state.documentParams.materialId,
      taskId: state.documentParams.taskId
    };
    let response = await getRecordStatusApi(params);
    if (response.success) {
      state.checkWordUserList.map(user => {
        const userStatus = response.data.find(item => {
          return item.userId === user.userId
        });
        if (userStatus)
          Object.assign(user, {signStatus: userStatus.signStatus});
        else
          Object.assign(user, {signStatus: -1});
      });
    }
    signNameTabRef.value.toggleAllSelection();
    signNameTabRef.value.toggleAllSelection();
    // 笔录校验全选的数据
    let checkWordsTabList = signNameTabRef.value;
    // 延迟点给数据点时间
    setTimeout(() => {
      selectUser(checkWordsTabList.data);
    }, 500);
  };
  // 点击签名核对按钮
  const signName = () => {
    // 停止转写
    state.voiceTransfer = false;
    // 获取核对签名状态信息
    sendCheckWordInfoList();
    // 点击签名按钮的时候把签名相关按钮做不显示
    if (state.signNameDialog) {
      state.signNameDialog = false;
    }
    // 获取核对签名状态信息列表
    // console.log("开始核对签名！");
    state.signNameCheck = !state.signNameCheck;
  };
  // 光标处插入文本
  const insertText = (content) => {
    // 插入文本
    let object = {
      object: "text", //表示是文字，必填项
      type: "insert", //表示是插入操作必填项
      text: content, //插入的文字内容，必填项
    };
    docEditor.setDocumentContent(object);
  };
  // 语音转写
  const astMockStartBtn = async (enable) => {
    if (!enable) {
      let response = await stopReceiveDataApi(meetingInfo.value.id);
      if (response.success) {
        // 关闭语音转写输入框
        state.voiceTransfer = false;
        // 清空转写的显示
        state.voiceTransferText = "";
      }
    } else {
      // 打开语音识别输入框
      let response = await receiveDataApi(meetingInfo.value.id);
      if (response.success) {
        state.voiceTransfer = true;
        // astMockStart();
      }
    }
  };
  // 获取用户历史签名
  const getUserHistorySignImg = async () => {
    let response = await getElectronicSignApi();
    if (response.success && response.data) {
      state.historySignName = true;
      const fileUrl = await getFileUrl(response.data, 'png');
      state.historySignInfo.fileId = fileUrl[0].fileId;
      state.historySignInfo.fileUrl = fileUrl[0].fileUrl;
    } else {
      state.historySignName = false;
    }
  };
  // 获取签名二维码
  const sendGetSignNameQRCode = async () => {
    let response = await getSignQrcodeApi(state.documentParams.taskId, state.documentParams.materialId)
    if (response.success) {
      state.signNameQRCode = "data:image/png;base64," + response.data;
    }
  };
  // 使用上次签名图片
  const sendSignNameFun = async () => {
    let params = {
      fileId: state.historySignInfo.fileId,
      interior: true,
      materialId: state.documentParams.materialId,
      taskId: state.documentParams.taskId,
      userId: getToken().userId
    };
    const response = await lastSignApi(params);
    if (response.success) {
      state.signNameDialog = false;
    }
  };
  // 笔录签名
  const recordSignCheck = (e) => {
    ElMessage.info("主持人发起笔录签名");
    // 打开确认笔录的弹出框
    state.signNameDialog = true;
    // 关闭笔录发送弹出框
    state.signNameCheck = false;
    // 获取历史签名
    getUserHistorySignImg();
    // 获取签名二维码
    sendGetSignNameQRCode();
  };
  // 笔录签名完成
  const recordSignConfirm = async (e) => {
    if (e) {
      const {fileId, userId} = e;
      //如果是自己的签名，提示用户，并隐藏签名按钮；
      if (userId === mineInfo.value.userId) {
        ElMessage.success("签名完成");
        state.signNameDialog = false;
      }
      // }
      let params = {
        materialId: state.documentParams.materialId,
        taskId: state.documentParams.taskId
      };
      let response = await getRecordStatusApi(params);
      if (response.success) {
        let fileIds = [];//所有已签名用户的图片ID；
        response.data.forEach(item => {
          fileIds.push(item.fileId);
        });
        const fileUrls = await getFileUrl(fileIds.toString());
        let imgStr = [];
        for (let i = 0; i < fileUrls.length; i++) {
          imgStr.push(`{"img":[{"@src":"${proxy.prefix}${fileUrls[i].fileUrl}"},{"@width":"100px"},{"@height":"60px"}]}`);
        }

        insetSignNmeImg(imgStr)
      }
    }
  };
  /**
   * 页脚设置签名图片
   * **/
  const insetSignNmeImg = (imgStr) => {
    //需要插入文本域的内容
    let nrobject = {
      object: "content", //表示是文档控制域，必填项
      type: "html", //表示添加内容为 html
      name: state.documentParams.contentSign, // 内容域的名称
      jsonStr: `{"body":[${imgStr}]}`, //必填项,添加到内容域的 json 对象或字符串,格式模拟 html，详见
      id: "sign-img",
      bClear: true, //是否清空指定内容域的内容，默认为 false 不清除.
    };
    docEditor.setDocumentContent(nrobject);
  };
  // 超过上传限量数量时提示用户
  const onFileExceed = (files) => {
    ElMessage.error("只能上传一个文件！");
  };
  // 用户选择了文件
  const onFileChange = (file, files) => {
    state.uploadFileList = files;
  };
  // 上传前判断文件类型是否被允许
  const beforeFileUpload = (rawFile) => {
    console.log(rawFile);
    let name = rawFile.name.split(".");
    if (
      rawFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      rawFile.type === "application/msword" ||
      rawFile.type === "application/wps-office.docx" ||
      rawFile.type === "application/wps-office.doc" ||
      rawFile.type === "application/eio-x-docx" ||
      rawFile.type === "application/eio-x-doc" ||
      name[name.length - 1] === "wps" ||
      name[name.length - 1] === "doc" ||
      name[name.length - 1] === "docx"
    ) {
      return true;
    } else {
      ElMessage.error("只支持doc/docx/wps类型的文件");
      return false;
    }
  };
  // 删除文件时，清空文件列表
  const onFileRemove = (file, uploadFiles) => {
    state.uploadFileList = uploadFiles
  };
  // 上传成功后，给文件列表赋值
  const onFileSuccess = (response, uploadFile) => {
    //手动上传文件成功后，使用新的参数，初始化畅写文档
    if (response.success) {
      state.documentParams = response.data;
      initCxDocument();
      state.showImportFileDlg = false;
      state.signNameCheck = false;
      uploadRef.value.clearFiles();
    }
  };
  // 上传失败，提示用户
  const onFileError = (error, response, uploadFile) => {
    console.log(error);
    //手动上传文件成功后，使用新的参数，初始化畅写文档
    // ElMessage.error(error.message)
    ElMessage.error("导入笔录失败!")
  };
  // 导入文件
  const uploadFile = async (file) => {
    // state.uploadFileList.push(file);
    // uploadRef.value.submit();
    const form = new FormData();
    form.append("noteFile", state.uploadFileList[0]);
    form.append("taskId", state.documentParams.taskId);
    const response = await noteImportApi(form);
    if (response.success) {
      state.documentParams = response.data;
      initCxDocument();
      state.showImportFileDlg = false;
      state.signNameCheck = false;
      uploadRef.value.clearFiles();
    }
  };
  const closeUploadFile = () => {
    state.showImportFileDlg = false;
    uploadRef.value.clearFiles();
  };
  // 把导入文件内容放到畅写文档
  const confirmImportToCX = () => {
    if (!state.uploadFileList.length) {
      ElMessage.info("请选择要导入的文件！");
      return;
    }
    state.showImportFileDlg = false;
    uploadRef.value.clearFiles();
  };
  // 畅写自定义插件的回调方法
  const cxHandle = (e) => {
    if (e && e.data && typeof e.data === "string") {
      let messageJson = JSON.parse(e.data);
      if (messageJson.type === "stopVoiceTransfer") {
        //全屏
        astMockStartBtn(false);
      } else if (messageJson.type === "checkSign") {
        //核对签名
        signName();
      } else if (messageJson.type === "voiceTransfer") {
        //语音转写
        astMockStartBtn(true);
      } else if (messageJson.type === "upload") {
        state.showImportFileDlg = true;
        state.signNameCheck = false;
      }
    }
  };
  /**
   * 语音转写
   * */
  const astMockStart = useDebounceFn((e) => {
    console.log("astMockStart", e);
    let content = "";
    // 筛选说话的人名字
    if (e) {
      let {messageMap} = e;

      // 这里是后端对接处理数据0表示转写,1表示转写一段话完成可以插入
      // 并且加了个判断,用户关闭转写框的时候不插入转写
      if (messageMap.pgs === 0) {
        // console.log("正在转写中...");
      } else if (messageMap.pgs === 1 && state.voiceTransfer === true) {
        let speakUserName = attendList.value.find((item) => item.userId === messageMap.lineId);
        if (speakUserName.alias === state.speakUserName) {
          content = messageMap.text;
        } else {
          state.speakUserName = speakUserName.alias;
          content = "\r\n" + speakUserName.alias + ":" + messageMap.text;
        }
        state.voiceTransferText = messageMap.text;
        // 插入转写结果的方法
        insertText(content);
      }
    }
    // });
    // };
    // client.connect(MqUserName, MqPassWord, onconnect);
  });
  const setRecordFull = () => {
    emits("setRecordFull");
  };
  const finishCxOffice = async () => {
    console.log("finishCxOffice");
    // if (state.documentParams?.taskId)
    //   await noteFinishApi(state.documentParams.taskId);
  };
  //导入笔录后重新初始化畅写
  const afterImportFileInitCX = (event) => {
    // console.log(event);
    if (event) {
      state.documentParams = event;
      initCxDocument();
    }

    // if (state.documentParams?.taskId)
    //   await noteFinishApi(state.documentParams.taskId);
  };
  const sendNoteMessageFail = () => {
    ElMessage.error("签名发送失败")
  };
  onMounted(() => {
    mittBus.on("NOTE_SIGN", recordSignCheck); // 笔录签名
    mittBus.on("SIGN", recordSignConfirm); // 笔录签名完成
    mittBus.on("NOTE_INIT", afterImportFileInitCX); // 笔录初始化
    mittBus.on("TRANSLITERATION_RESULT", astMockStart); //语音转写
    mittBus.on("NOTE_SIGE_FAIL", sendNoteMessageFail); //发起签名失败
    window.addEventListener("message", cxHandle); //监听畅写自定义插件的消息通知
  });
  onBeforeRouteLeave(() => {
    mittBus.off("NOTE_SIGN", recordSignCheck); // 笔录签名
    mittBus.off("SIGN", recordSignConfirm); // 笔录签名完成
    mittBus.off("NOTE_INIT", afterImportFileInitCX); // 笔录初始化
    mittBus.off("TRANSLITERATION_RESULT", astMockStart); //语音转写
    mittBus.off("NOTE_SIGE_FAIL", sendNoteMessageFail); //发起签名失败
    window.removeEventListener("message", cxHandle); //监听畅写自定义插件的消息通知
  });
  watch(
    () => meetingInfo.value,
    (newValue, oldValue) => {
      if (meetingInfo.value.textReceiver === getToken().userId) {
        astMockStartBtn(true)
      }
      if (newValue.meetingCode !== oldValue.meetingCode) {
        initCxServer();
      }
    }
  );

</script>

<style lang="less" scoped>
  // 清除一些默认样式
  ::v-deep(.el-textarea__inner) {
    font-size: 18px;
    background-color: rgba(226, 239, 255, 1);
  }

  ::v-deep(.el-tabs__content) {
    background-color: #fff !important;
  }

  ::v-deep(#tab-check),
  ::v-deep(#tab-signName) {
    border: 0;
    color: #148afe !important;
    background-color: #fff !important;
  }

  ::v-deep(.el-tabs__nav) {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  ::v-deep(.is-active) {
    border-bottom: 1px solid #148afe !important;
  }

  ::v-deep(.tips_popover) {
    min-width: 10px !important;
    height: 500px;
  }

  ::v-deep(#tab-signName) {
    width: 100%;
  }

  ::v-deep(.el-upload) {
    width: 395px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .office {
    width: 100%;
    height: 100%;
    position: relative;

    // 转写弹出框
    .voice-transfer {
      position: absolute;
      z-index: 99;
      width: 85%;
      max-height: 150px;
      min-height: 90px;
      overflow-y: auto;
      background-color: #e2efff8c;
      color: #148afe;
      bottom: 30px;
      left: 6.6%;

      .voice-transfer-user {
        display: block;
        padding: 10px;
        font-size: 23px;

        & > i {
          font-weight: bold;
        }
      }
    }

    // 签名弹出框
    .sign-name-panel {
      position: absolute;
      top: 0;
      right: 0;
      z-index: 20;
      width: 210px;
      height: 100%;
      background: #ffffff;
      box-shadow: -1px 2px 4px 0px rgba(161, 161, 161, 0.5);
      border-radius: 0 0 0 10px;
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      align-items: center;

      .sign-title {
        width: 100%;
        color: #226eed;
        font-size: 16px;
        text-align: center;
        padding: 10px 0;
        border-bottom: solid 1px #ebeef5;
      }

      .sign-person-list {
        flex: 1;
        height: 0;
        overflow: auto;

        .no_send {
          color: #000;
        }

        .no_sign {
          color: #226EED;
        }

        .confirm_sign {
          color: #0DAA20;
        }
      }

      .sign-name-btn {
        width: 100%;
        text-align: center;
        padding: 20px 0;

        .el-button {
          width: 74px;
          height: 33px;
          color: #fff;
          background-color: rgba(209, 209, 209, 1);
        }

        .el-button:nth-child(2) {
          background-color: rgba(34, 110, 237, 1);
        }
      }
    }

    //  笔录确定弹出框
    .confirmDialog {
      position: absolute;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 122;
      width: 100%;
      height: 80px;
      background-color: #148afe;
      bottom: 30px;
      left: 0;

      & > span {
        display: block;
      }

      .confirmDialog_content {
        margin-left: 40px;
        font-size: 17px;
        color: #fff;
      }

      .confirmDialog_btn {
        margin-right: 40px;

        & > .el-button {
          width: 90px;
          height: 30px;
          color: #fff;
          border-radius: 6px;
          border: 1px solid #ffffff;
          background-color: white;
        }

        & > .el-button:nth-child(1) {
          color: #cccccc;
          border: 1px solid #cccccc;
          background-color: transparent;
        }
      }
    }

    .signNameDialog {
      position: absolute;
      z-index: 122;
      bottom: 80px;
      right: 39px;

      & > .el-button {
        display: block;
        width: 120px;
        height: 30px;
        margin: 10px;
        font-size: 12px;
      }

      & > .el-button:nth-child(1) {
        color: #fff;
        background-color: #2893ed;
      }

      & > .el-button:nth-child(2) {
        color: #2893ed;
        border: 1px solid #2893ed;
        background-color: transparent;
      }
    }

    .right {
      right: 239px;
    }
  }
</style>
<style lang="less">
  .sign-panel-modal {
    height: calc(100% - 90px) !important;
    top: 90px !important;
  }
</style>
