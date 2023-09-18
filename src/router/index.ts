import {createRouter, createWebHashHistory, RouterOptions} from "vue-router";
import routes from "~pages";
import {getToken} from "@/utils/auth";
import {UicpSocket} from "@/websocket";
import SERVER_URL from "@/utils/getServerUrl";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import mittBus from "@/utils/mittBus";
import {ElMessageBox} from "element-plus";
import {leaveMeetingApi} from "@/api/modules/mcs";

window.UicpSocket = UicpSocket.getInstance();
const ROUTER_WHITE_LIST: string[] = ['/', '/synthesisStream', '/middle-skip'];
let wsIsOpen: boolean = false;

//导入生成的路由数据
const router = createRouter(<RouterOptions>{
  history: createWebHashHistory(),
  routes,
});
let msgBox = null;
router.beforeEach(async (to, from, next) => {
  // 1.NProgress 开始
  NProgress.start();

  // 2.判断访问页面是否在路由白名单地址(静态路由)中，如果存在直接放行
  if (ROUTER_WHITE_LIST.includes(to.path)) {
    wsIsOpen = false;
    window.UicpSocket.destroySocket();
    return next();
  }
  // 3.判断是否有 Token，没有重定向到 login 页面
  if (!(getToken() && getToken().token)) {
    wsIsOpen = false;
    window.UicpSocket.destroySocket();
    return next('/');
  }
  // 4.正常访问页面
  next();
  // 5.初始化ws
  if (!wsIsOpen)
    window.UicpSocket.createSocket({
      url: SERVER_URL.ws,
      token: getToken().token,
      onOpen: () => {
        wsIsOpen = true;
      },
      messageCb: (e) => {
        console.log("%c::收到消息::", "color:darkred;font-weight:bold", e);
        if (e.type === 'CHAT' || e.type === 'OVER_MEETING') {
          mittBus.emit(e.type, e);
        } else if (e.type === 'MEETING_INIT' && to.path === '/main') {
          const currentUser = e.content.memberInfos.find(item => {
            return item.userId === getToken().userId
          });
          if (!currentUser.online) return false;
          if (msgBox) return;
          msgBox = ElMessageBox.confirm("您当前有正在开启的会议，是否进入会议？", "提醒", {
            confirmButtonText: "进入会议",
            cancelButtonText: "退出会议",
          }).then(() => {
            let url = '';
            switch (e.content.meetingType) {
              case 0:
                url = `/yst/ivc/main.html#/meeting?meetingId=${e.content.id}`;
                break;
              case 1:
                url = `/yst/italk/main.html#/meeting?meetingId=${e.content.id}`;
                break;
              case 3:
                url = `/yst/idr/main.html#/meeting?meetingId=${e.content.id}`;
                break;
            }
            window.location.href = url;
          }).catch(() => {
            msgBox = null;
            leaveMeetingApi(e.content.id);
          });
        } else
          mittBus.emit(e.type, e.content);
      }
    });
});

router.afterEach((_to) => {
  NProgress.done();
});

export default router;
