<template>
  <el-dialog v-model="props.show" title="成员管理" width="400px" :before-close="close">
    <div class="member-list">
      <!--法庭席位,如果后台没有配置就不显示-->
      <div v-if="state.canUseCourt">
        <el-row align="middle">
          <el-col :span="12">
            <h6>
              法庭席位<span class="ml5" v-if="state.currentCourtInfo.id !== -1">({{ currentCourtInfo.name }})</span>
            </h6>
          </el-col>
          <el-col :span="12" class="text-right">
            <el-popover ref="courtListRef" :show-arrow="false" placement="right-start"
                        :width="courtList.length > 1 ? 90 : 250" trigger="click" style="width: 90px">
              <template #reference>
                <span class="h6">选择法庭<svg-icon name="icon-prev1"/></span>
              </template>
              <ul class="court-list" v-if="courtList.length > 1">
                <li :title="court.name" class="court-list-item" v-for="court in courtList" :key="court.id"
                    @click="changeCourt(court)">
                  <svg-icon name="xuanze" v-if="court.id === state.currentCourtInfo.id ? 'active' : ''"/>
                  <span class="name">{{ court.name }}</span>
                </li>
              </ul>
              <div class="text-center h6" v-else>尚未配置法庭视频流，请联系管理员</div>
            </el-popover>
          </el-col>
        </el-row>
        <template v-for="seat in courtSeatList" :key="seat.userId">
          <MemberItem userType="seat" :userInfo="seat" :onLine="seat.enable" @submit="getMeetingStats"/>
        </template>
        <div class="text-center h6 mt10 text-danger"
             v-if="!courtSeatList.length && state.currentCourtInfo.id && state.currentCourtInfo.id !== -1">
          该法庭尚未配置视频流，请联系管理员
        </div>
        <el-divider style="margin: 10px 0"/>
      </div>
      <template v-for="(memberList, index) in state.members" :key="index">
        <h6 :class="index > 0 ? 'mt10' : ''">{{ memberList.title }}</h6>
        <member-item userType="attend" :userInfo="attend" :onLine="attend.online" v-for="attend in memberList.subList"
                     :key="attend.userId" @submit="getMeetingStats"/>
      </template>
    </div>
    <div class="footer" v-if="state.members.length">
      <el-button size="small" type="primary" plain @click="submit('all', false)">一键禁言</el-button>
      <el-button size="small" type="primary" plain @click="submit('all', true)">取消禁言</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
  import MemberItem from './MemberItem.vue'
  import {getParticipantApi, syncSetMicroStatusApi} from "@/api/modules/mcs";
  // import {getCourtListFun, getCourtListByRoomIdFun, joinCourtFun, cancelCourtFun} from "@/api/court";
  import {getToken} from "@/utils/auth";
  import {getAppInfo} from "@/utils/appConfig";
  import mittBus from "@/utils/mittBus";

  const props = defineProps<{
    show: boolean
  }>();
  const emits = defineEmits<{
    (e: "close"): void
  }>();
  const meetingInfo = inject("meetingInfo");
  const courtSeatList = inject("courtSeatList");
  const attendList = inject("attendList");
  const courtListRef = ref(null);
  let state = reactive({
    canUseCourt: getAppInfo().courtHearing === "true", //法庭席位开关
    members: [],
    isEditUserName: "", //修改姓名
    newUserName: "", //修改后的姓名
    courtList: [], //法院列表
    currentCourtInfo: {
      id: -1,
      name: "",
    }, //当前选中的法庭信息
  });
  /**
   * 设置全员发言/全员静音
   * **/
  const submit = async (member, status) => {
    let params = {
      meetingId: meetingInfo.value.id,
      enable: status,
      users: []
    };
    if (typeof member === "object") {
      params.users = [member.userId];
    } else {
      attendList.value.map(item => {
        if (item.userId === getToken().userId) return false;
        params.users.push(item.userId)
      })
    }

    let response = await syncSetMicroStatusApi(params);
    if (response.success) {
      getMeetingStats();
    }
  };
  /**
   * 参会人列表
   * **/
  const getMeetingStats = async () => {
    let closeVideoUserId = "";
    let response = await getParticipantApi(meetingInfo.value.id);
    if (response.success) {
      let userList = response.data;
      courtSeatList.value.forEach((item) => {
        if (item.linkUserId && item.enable) closeVideoUserId = item.linkUserId;
      });
      //过滤掉被接入法庭用户关联的用户；
      state.members = userList.filter((item) => {
        return item.userId !== closeVideoUserId || !item.userId.memberType;
      });
      state.members.sort(function (a, b) {
        if (a.online === b.online) return Number(b.interior) - Number(a.interior);
        else return a.online > b.online ? -1 : 1;
      });
      state.members = memberGroup(state.members, "interior");
    }
  };
  /**
   * 将人员分组
   * **/
  const memberGroup = (array, key) => {
    //定义一个空数组
    let newArr = [];
    //通过forEach循环数组
    array.forEach((item, i) => {
      let index = -1;
      //然后在跑到这里筛选 根据不同的mediaId放置不同的数组
      let isExists = newArr.some((newItem, j) => {
        if (item[key] === newItem[key]) {
          index = j;
          return true;
        }
      });
      //代码是先跑这里的if条件判读
      if (!isExists) {
        newArr.push({
          [key]: item[key],
          title: item[key] ? "远程办案人员" : "远程诉讼参与人",
          subList: [item],
        });
      } else {
        newArr[index].subList.push(item);
      }
    });
    return newArr;
  };
  /**
   * 法庭列表
   * **/
  const getCourtList = async () => {
    let depId = getToken().depId;
    let roomId = meetingInfo.value.roomId;
    let response = await getCourtListFun(depId);
    if (response.success) {
      state.courtList = response.data.filter((item) => {
        return item.enable;
      });
      state.courtList.unshift({
        name: "不选择",
        id: -1,
      });
      //选择了法院后,页面退出或刷新,重新进入的时候默认选中上次选择的法院;
      if (roomId && state.currentCourtInfo.id === -1) {
        let result = await getCourtListByRoomIdFun(roomId);
        if (result.success) {
          state.currentCourtInfo = {
            id: result.data.id,
            name: result.data.name,
          };
        }
      }
    }
  };
  /**
   * 切换法庭,加载席位
   * **/
  const changeCourt = async (court) => {
    //手动关闭弹出菜单
    if (courtListRef.value) courtListRef.value.hide();
    if (court.id !== -1) {
      const response = await joinCourtFun(meetingInfo.value.meetingId, court.id);
      if (response.success) {
        //保存选中的法庭,改变选中的样式；
        state.currentCourtInfo = court;
      }
    } else {
      const response = await cancelCourtFun(meetingInfo.value.meetingId);
      if (response.success) {
        //保存选中的法庭,改变选中的样式；
        state.currentCourtInfo = court;
      }
    }
  };
  /**
   * 关闭弹窗
   * **/
  const close = () => {
    state.isEditUserName = "";
    // mittBus.off("JOIN_MEETING", getMeetingStats); //成员加入,更新列表
    // mittBus.off("LEAVE_MEETING", getMeetingStats); //成员退出,更新列表
    emits("close");
  };
  watch(
    () => props.show,
    (newValue, oldValue) => {
      if (props.show) {
        getMeetingStats();
        mittBus.on("JOIN_MEETING", getMeetingStats); //成员加入,更新列表
        mittBus.on("LEAVE_MEETING", getMeetingStats); //成员退出,更新列表
      }
    }
  );
  watch(
    () => courtSeatList.value,
    (newValue) => {
      courtSeatList.value = newValue.sort((a, b) => {
        return a.enable > b.enable ? -1 : 1;
      });
    },
    {
      deep: true,
    }
  );
  watch(
    () => attendList.value,
    (newValue) => {
      if (props.show) getMeetingStats();
    },
    {
      deep: true,
    }
  );
  watch(
    //如果被关联的参会人ID发生变化，重新加载参会人列表
    () => meetingInfo.value,
    async (newValue, oldValue) => {
      if (newValue.roomId) {
        let result = await getCourtListByRoomIdFun(newValue.roomId);
        if (result.success) {
          state.currentCourtInfo = {
            id: result.data.id,
            name: result.data.name,
          };
        }
      } else {
        state.currentCourtInfo = {
          id: -1,
          name: "",
        };
      }
    },
    {
      deep: true,
    }
  );
</script>

<style lang="scss" scoped>
  .court-list {
    width: 100%;
    padding: 0;
    margin: 0;

    .court-list-item {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      color: #051c33;
      line-height: 2;
      position: relative;

      svg {
        position: absolute;
        left: -1px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
      }

      .name {
        padding-left: 12px;
      }
    }
  }

  .member-list {
    height: 380px;
    overflow-y: auto;
    box-sizing: border-box;
    position: relative;
  }

  .footer {
    text-align: center;

    button {
      width: 48%;
      background: white;
      color: #148afe;
      border: solid 1px #148afe;
    }
  }
</style>
