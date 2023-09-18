<template>
  <section class="chat-panel" v-if="show">
    <!-- 标题-->
    <aside class="chat-panel-header">
      <span class="title">聊天({{ members.length }})</span>
      <svg-icon name="quxiao" class="btn-close" :size="20" @click="close"/>
    </aside>
    <!--内容-->
    <aside class="chat-panel-main">
      <!--左侧群组-->
      <div class="group">
        <div class="group-item" :class="state.curGroup.groupId === group.groupId ? 'active' : ''"
             v-for="(group, index) in messageGroup" :key="index" @click="changeGroup(group)">
          <span class="flag">{{ group.groupName.substring(0, 1) }}</span>
          <span class="h6">{{ group.groupName }}</span>
        </div>
      </div>
      <!--群组名称、消息、组员-->
      <div class="content-wrapper" v-if="state.curGroup && state.curGroup.groupId">
        <!--群组名称-->
        <div class="top">{{ state.curGroup.groupName }}</div>
        <!--消息、组员-->
        <div class="content">
          <!--消息-->
          <div class="message-panel">
            <div class="tips" v-if="state.copyTips">复制成功!</div>
            <div class="message" ref="chatContent">
              <div class="chat-item" v-for="message in state.curGroup.chatMessages">
                <div class="mine" v-if="message.sendUserId === state.userId">
                  <span class="name">{{ message.sendUserName }}</span>
                  <span class="text" @click="copyMessage(message.content)">
                        {{ message.content }}
                    <!--<i class="text-primary" v-if="message.receiveUserId">(私聊{{ message.receiveUserName }})</i>-->
                    </span>
                </div>
                <div class="other" v-else>
                <span class="name">
                    <i>{{ message.sendUserName }}</i>
                    <i v-if="message.sendRoleId"
                       v-text="`(${getLitigationDesc(message.sendRoleId)})`"/>
                </span>
                  <span class="text" @click="copyMessage(message.content)">
                        {{ message.content }}
                    <!--                        <i class="text-primary" v-if="message.receiveUserId">(私聊)</i>-->
                    </span>
                </div>
              </div>
            </div>
            <div class="send">
              <div class="input-message">
                <el-input v-model="state.sendMessage" :rows="3" :maxlength="100" type="textarea"
                          placeholder="请输入消息..." @keydown="handleInputKeyDown"/>
                <span class="send-tips">Enter键发送，Ctrl+Enter换</span>
                <el-popover placement="top-end" trigger="click" content="不能发送空白信息" :visible="state.showTips">
                  <template #reference>
                    <el-button size="small" type="primary" @click="send">发送</el-button>
                  </template>
                </el-popover>
              </div>
            </div>
          </div>
          <!--组员-->
          <div class="group-member">
            <ul class="group-member-list">
              <li v-for="member in members" :key="member.userId" :title="member.alias">
                <template v-if="member.memberType===0">
                  <svg-icon name="yonghu" :size="16" color="#148afe"
                            v-if="member.interior || state.curGroup.groupName === '全部'"/>
                  <span class="name"
                        v-if="member.interior || state.curGroup.groupName === '全部'">{{ member.alias }}</span>
                </template>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
  import {getToken} from "@/utils/auth";
  import useDict from "@/hooks/useDict";
  import mittBus from "@/utils/mittBus";
  import {useDebounceFn, useClipboard} from '@vueuse/core'
  import {v4 as uuidv4} from "uuid";
  import {historyMessageApi} from "@/api/modules/wms";

  const {copy, isSupported} = useClipboard();
  const props = defineProps(["show"]);
  const emits = defineEmits(["close", "send"]);
  const chatContent = ref(null);
  const members = inject("attendList");
  // const messageGroup = inject("messageGroup");
  const meetingInfo = inject("meetingInfo");
  const {getDataDictionary} = useDict();
  const {proxy} = getCurrentInstance();
  const messageGroup = ref([]); //聊天消息
  const getLitigationDesc = computed(() => (id) => {
    const result = state.litigationList.find((item) => {
      return item.id === id;
    });
    return result.value;
  });
  const state = reactive({
    guestMembers: [],
    sendMessage: "",
    userId: getToken().userId,
    showTips: false,
    copyTips: false,
    receiveUserId: "-1", //接收人，当是所有人时为-1
    curGroup: {}, //当前选中的聊天群组
    litigationList: [], //诉讼地位字典
  });
  const getMyName = () => {
    const name = members.value.find((item) => state.userId === item.userId || item.linkUserId === state.userId);
    return name.alias;
  };
  // 回车发送
  const handleInputKeyDown = (event) => {
    const {ctrlKey, keyCode} = event;
    if (keyCode === 13) {
      event.preventDefault();
      ctrlKey ? (state.sendMessage += "\r\n") : send();
    }
  };
  // 点击发送按钮发送消息
  const send = () => {
    if (!state.sendMessage) {
      state.showTips = true;
      let timer = setInterval(() => {
        state.showTips = false;
        timer = null;
      }, 3000);
      return false;
    }
    let receiveArray = [];

    if (state.receiveUserId !== "-1") {
      receiveArray = state.receiveUserId.split("|");
    }

    let msgObj = {
      type: "CHAT",
      requestId: uuidv4,
      sender: state.userId,
      groupId: state.curGroup.groupId,
      receipt: 0,
      content: {
        sendUserName: getMyName(),
        chatType: state.receiveUserId === "-1" ? 1 : 3, //1 - 全部 2 - 群组 3 - 私聊
        content: state.sendMessage,// type: 1,//1 - 文本  2 - 图片 3 - 文件
        receiveUserId: state.receiveUserId === "-1" ? "" : receiveArray[0],
        orderId: meetingInfo.value.id,
        // receiveUserName: state.receiveUserId === "-1" ? "" : receiveArray[1],
        sendUserId: state.userId,
        groupId: state.curGroup.groupId,
        // receiveUserName: state.receiveUserId === "-1" ? "" : receiveArray[1],
      },
    };
    // const curGroup = messageGroup.value.find((item) => {
    //   return item.groupId === state.curGroup.groupId;
    // });
    // curGroup.chatMessages.push({
    //   ...msgObj.content,
    // });
    // messageGroup.value.map(item => {
    //   console.log(item, state.curGroup.groupId);
    //   if (item.groupId === state.curGroup.groupId) {
    //     item.chatMessages.push({
    //       ...msgObj.content
    //     })
    //   }
    // });
    window.UicpSocket.sendMessage(msgObj);
    emits("send", msgObj);
    state.sendMessage = "";
    scrollToBottom();
  };
  // 接收消息
  const receiveMessage = (e) => {
    if (state.curGroup.groupId === e.groupId) {
      state.curGroup.chatMessages.push(e.content)
    }

    if (chatContent.value !== null) {
      scrollToBottom();
    }
  };
  // 滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      const scrollHeight = chatContent.value.scrollHeight; //里面div的实际高度
      const height = chatContent.value.clientHeight; //网页可见高度
      const maxScrollTop = scrollHeight - height;
      chatContent.value.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }, 300);
  };
  // 复制消息内容
  const copyMessage = useDebounceFn((content) => {
    copy(content);
    state.copyTips = true;
    setTimeout(() => {
      state.copyTips = false;
    }, 1000);
  }, 1000);
  // 获取诉讼地位字典列表
  const getLitigationRole = async () => {
    state.litigationList = await getDataDictionary(proxy.constant.DICT.ssdw.value);
  };
  const close = () => {
    // mittBus.off("CHAT", receiveMessage); //接收消息成功
    emits("close");
  };
  //初始化聊天消息列表
  const chatInit = async () => {
    let params = {
      internet: false,
      orderId: meetingInfo.value.id
    };
    let response = await historyMessageApi(params);
    if (response.success) {
      messageGroup.value = response.data;
    }
  };
  const changeGroup = (group) => {
    state.curGroup = group;
    scrollToBottom()
  };
  watch(
    () => props.show,
    (value, oldValue) => {
      if (value) {
        chatInit();
        getLitigationRole();
      }
    }
  );
  onMounted(() => {
    mittBus.on("CHAT", receiveMessage); //接收消息成功
  });
</script>

<style lang="scss" scoped>
  .chat-panel {
    display: flex;
    flex-direction: column;
    width: 560px;
    height: 540px;
    bottom: 56.5px;
    left: 0;
    position: absolute;
    background: white;
    z-index: 9999;

    &-header {
      position: relative;
      height: 32px;
      box-shadow: 0 1px 2px 0 rgba(204, 204, 204, 0.5);
      text-align: center;

      .title {
        color: #051c33;
        font-size: 12px;
        font-weight: bold;
        height: 32px;
        line-height: 32px !important;
        vertical-align: middle;
      }

      .btn-close {
        position: absolute;
        top: 50%;
        right: 10px;
        color: #000;
        font-size: 18px;
        margin-top: -9.6px;
        cursor: pointer;
      }
    }

    &-main {
      display: flex;
      flex-direction: row;
      background: #fafbfc;
      width: 100%;
      flex: 1;
      box-sizing: border-box;
      overflow-y: auto;

      .group {
        width: 100px;
        height: 100%;
        background: white;
        box-shadow: 1px 0 0 0 rgba(204, 204, 204, 0.5);
        text-align: center;

        .group-item {
          margin-top: 16px;
          background: white;
          padding: 6px 0;

          .flag {
            display: inline-block;
            width: 28px;
            height: 28px;
            line-height: 28px;
            border-radius: 50%;
            color: white;
            font-size: 12px;
            margin-right: 6px;
            background: #148afe;
          }

          &.active {
            background: #f0f5fa;
          }
        }
      }

      .content-wrapper {
        display: flex;
        flex-direction: column;
        flex: 1;
        height: 100%;
        overflow: hidden;

        .top {
          height: 33px;
          line-height: 33px;
          color: #333333;
          border-bottom: solid 1px #e6e6e6;
          padding-left: 16px;
          font-size: 12px;
        }

        .content {
          display: flex;
          flex-direction: row;
          flex: 1;
          width: 100%;
          height: 0;

          .message-panel {
            position: relative;
            display: flex;
            flex-direction: column;
            flex: 1;

            .tips {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              text-align: center;
              font-size: 12px;
              padding: 2px 0;
              background: #eefdec;
            }

            .message {
              flex: 1;
              padding: 14px;
              overflow: auto;

              .chat-item {
                width: 100%;
                height: auto;
                margin-bottom: 24px;

                .mine,
                .other {
                  width: 100%;

                  .name {
                    display: block;
                    overflow: hidden;
                    color: #3d3d3d;
                    font-size: 12px;
                  }

                  .text {
                    display: inline-block;
                    max-width: 80%;
                    width: auto;
                    height: auto;
                    font-size: 12px;
                    white-space: pre-wrap;
                    word-break: break-all;
                    padding: 8px;
                    margin-top: 4px;
                    border-radius: 2px;
                  }
                }

                .mine {
                  overflow: hidden;

                  .name {
                    text-align: right;
                  }

                  .text {
                    color: #fff;
                    background: #148afe;
                    float: right;
                  }
                }

                .other {
                  text-align: left;

                  .text {
                    color: rgba(0, 0, 0, 0.9);
                    background: #f4f7fc;
                  }
                }
              }
            }

            .send {
              width: 100%;
              height: 77px;
              border-top: 1px solid #e6e6e6;
              box-sizing: border-box;

              .input-message {
                font-size: 12px;

                .el-textarea__inner {
                  vertical-align: middle;
                  border: none;
                  resize: none;
                  background: transparent !important;
                  padding: 0;
                  box-shadow: none;
                }

                .send-tips {
                  display: inline-block;
                  color: #b3b3b3;
                  transform: scale(0.9);
                }
              }
            }
          }

          .group-member {
            min-width: 85px;
            height: 100%;
            border-left: solid 1px #e6e6e6;
            overflow-y: auto;

            &-list {
              padding: 0 14px;
              margin: 0;

              li {
                color: rgba(0, 0, 0, 0.6);
                font-size: 12px;
                margin-top: 16px;

                .iconfont {
                  color: #148afe;
                  margin-right: 6px;
                  vertical-align: middle;
                  font-size: 18px;
                }

                .name {
                  display: inline-block;
                  vertical-align: middle;
                  margin-left: 5px;
                  font-size: 12px;
                  width: 50px;
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                }


                .flag {
                  padding: 20px 50px;
                  background: #148afe;
                  border-radius: 1px;
                  color: white;
                  font-size: 12px;
                }

                /*离线*/
                &.offline {
                  .userName {
                    color: #d9d9d9;
                  }

                  .flag {
                    background: #d9d9d9;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
</style>
<style lang="scss">
  .send {
    .input-message {
      text-align: right;

      .el-textarea__inner {
        height: 47px;
        font-size: 12px;
        vertical-align: middle;
        border: none;
        resize: none;
        background: transparent !important;
        box-shadow: none;
      }

      button {
        width: 50px;
        height: 22px;
        min-height: auto;
        padding: 0;
        margin-right: 8px;
      }
    }
  }
</style>
