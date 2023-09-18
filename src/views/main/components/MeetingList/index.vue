0.
<template>
  <div v-if="state.sortMeetingList.length">
    <div class="meeting-list" v-for="item in state.sortMeetingList" :key="item.title">
      <div class="date" v-html="getDateDesc(item.meetingStartTime)"></div>
      <div class="item" v-for="subItem in item.list" :key="subItem.id">
        <el-row>
          <el-col :span="12" class="topic">{{ subItem.meetingName }}</el-col>
          <el-col :span="12" class="meeting-id">谈话ID:{{ subItem.meetingCode }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="8">
            <p class="h4">{{ subItem.createUserName }}创建</p>
          </el-col>
        </el-row>
        <el-row>
          <el-col class="h4" :span="24"> {{ dayjs(subItem.planStartTime).format("HH:mm") }}-{{
            dayjs(subItem.planEndTime).format("HH:mm") }}
          </el-col>
        </el-row>
        <div class="menu">
          <el-dropdown size="small">
            <el-button type="primary" plain size="small">更多
              <el-icon>
                <ArrowDown/>
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="showMeetingInfo(subItem)">复制链接</el-dropdown-item>
                <el-dropdown-item @click="editMeeting(subItem.id)" :disabled="state.userId !== subItem.createUser">编辑谈话
                </el-dropdown-item>
                <el-dropdown-item :disabled="state.userId !== subItem.createUser"
                                  @click="cancelMeeting(subItem.meetingStatus, subItem.id)">取消谈话
                </el-dropdown-item>
                <el-dropdown-item @click="goToMaterial(subItem.id)">上传材料</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button class="ml10" size="small" type="primary" @click="beginMeeting(subItem.id)">
            {{ subItem.createUser !== state.userId ? "加入谈话" : "开始谈话" }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
  <el-empty description="暂无待办" :image-size="100" v-else/>
</template>

<script setup lang="ts">
  import {getWaitHandleApi} from "@/api/modules/mcs";
  import {deleteMeetingCancelApi} from "@/api/modules/mcs";
  import {getToken} from "@/utils/auth";
  import {ElMessage, ElMessageBox, dayjs} from "element-plus";
  import {ArrowDown} from "@element-plus/icons-vue";
  import {useClipboard} from "@vueuse/core";
  import mittBus from "@/utils/mittBus";
  import 'dayjs/locale/zh-cn'

  const router = useRouter();
  const {copy, isSupported} = useClipboard();
  let state = reactive({
    meetingList: [],
    sortMeetingList: [],
    curMenu: ref(""),
    userId: getToken().userId,
  });
  //谈话列表
  const getMeetingList = async () => {
    let params = {
      pageIndex: 1,
      pageSize: 1000,
      meetingType: 1
    };
    let response = await getWaitHandleApi(params);
    if (response.success) {
      state.meetingList = response.data;
      groupDataByStartDate()
    } else {
      ElMessage.error(response.message);
    }
  };
  //转为自定义日期格式
  const getDateDesc = (datetime) => {
    if (dayjs().isSame(datetime, "day")) {
      return `<span class="day">今天</span>`;
    } else {
      return `<span class="day">${dayjs(datetime).format("DD")}</span><span>${dayjs(datetime).locale('zh-cn').format("日MM月 dddd")}</span>`;
    }
  };
  //把数据按开会日期进行分组
  const groupDataByStartDate = () => {
    state.sortMeetingList = [];
    if (state.meetingList.length === 0) return false;
    let newItem = {
      meetingStartTime: state.meetingList[0].planStartTime,
      list: [state.meetingList[0]],
    };

    state.sortMeetingList.push(newItem);

    state.meetingList.forEach((oldItem, index) => {
      if (index === 0) return false; //过滤掉第一条数据
      let oldItemStart = dayjs(oldItem.planStartTime); //格式化日期格式
      let hasItem = state.sortMeetingList.filter((newItem) => {
        let newItemStart = dayjs(newItem.meetingStartTime); //格式化日期格式
        return newItemStart.isSame(oldItemStart, "day"); //判断和已有的数据是不是同一天开的会
      });
      //已有数据中没有这个日期的数据，新增一条谈话数据
      if (!hasItem.length) {
        state.sortMeetingList.push({
          meetingStartTime: oldItem.planStartTime,
          list: [oldItem],
        });
      } else {
        //已有数据中有这个日期的数据，向这个日期的list新增一条数据
        hasItem[0].list.push(oldItem);
      }
    });
  };
  //取消谈话
  const cancelMeeting = (status, id) => {
    ElMessageBox.confirm("确定取消当前谈话?", "提醒", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(async () => {
        let response = await deleteMeetingCancelApi(id);
        if (response.success) {
          ElMessage.success("取消成功！");
          await getMeetingList();
        }
      })
  };
  //复制谈话链接
  const showMeetingInfo = (meetingInfo) => {
    let {createUserName, caseName, meetingCode, planStartTime, planEndTime} = meetingInfo;
    let content = `${createUserName}邀请您参加视频谈话\n谈话名称：${caseName}\n谈话时间：${dayjs(planStartTime).format("YYYY-MM-DD HH:mm")}-${dayjs(planEndTime).format(
      "HH:mm"
    )}\n谈话ID：${meetingCode} `;
    ElMessageBox({
      title: "复制邀请",
      message: `<div style="white-space: pre-line">${content}</div>`, //为了让页面识别\n在外面的div中加上样式
      dangerouslyUseHTMLString: true,
      confirmButtonText: "复制邀请",
      showCancelButton: false,
      type: "info",
      iconClass: "display:none",
    }).then(() => {
      //复制链接
      if (!isSupported) {
        console.log("您的浏览器不支持Clipboard API");
        return;
      }
      copy(content);
      ElMessage.success("复制成功");
    });
  };
  //开始谈话
  const beginMeeting = async (meetingId) => {
    router.replace({
      path: "/meeting",
      query: {
        meetingId,
      },
    });
  };
  //编辑谈话
  const editMeeting = async (meetingId) => {
    router.push({
      path: "/order/edit",
      query: {
        meetingId,
      },
    });
  };
  const goToMaterial = (meetingId) => {
    router.push({
      path: "/material",
      query: {
        meetingId,
        type: "beforeUpload", //查看
      },
    });
  };
  onMounted(() => {
    getMeetingList();
    mittBus.on("MEETING_INFO", getMeetingList); //预约通知
  });
  onBeforeUnmount(() => {
    mittBus.off("MEETING_INFO", getMeetingList); //预约通知
  })
</script>

<style lang="scss" scoped>
  .meeting-list {
    .date {
      border-bottom: solid 1px #4d4d4d;
      line-height: 2.5;
      color: #666;
      font-size: 16px;
      margin-left: 15px;
    }

    &:not(:first-child) {
      .date {
        margin-top: 40px;
      }
    }

    .item {
      position: relative;
      padding: 10px 10px 10px 20px;

      &:after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 20px;
        width: calc(100% - 20px);
        height: 1px;
        background: white;
        z-index: 0;
      }

      .el-row {
        z-index: 1;
        line-height: 2.5;
        color: #555555;
      }

      .topic {
        color: #3985d7;
        font-size: 18px;
        font-family: "element-icons";
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .meeting-id {
        color: #555;
        font-size: 16px;
        text-align: right;
      }

      &:hover {
        background: #e2efff;
      }

      .menu {
        position: absolute;
        bottom: 18px;
        right: 10px;
        z-index: 9;
        text-align: right;
      }
    }
  }
</style>
<style lang="scss">
  .meeting-list {
    .day {
      color: #333;
      font-size: 24px;
    }
  }
</style>
