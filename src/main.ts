import {createApp} from "vue";
import App from "./App.vue";
import router from "./router/index";
import "virtual:svg-icons-register";
import infiniteScroll from "vue-infinite-scroll";
import "element-plus/dist/index.css";
import "./assets/style/common/index.less";
import "./assets/style/common/reset.less";
import "./assets/fonts/iconfont.js";
import "./assets/fonts/iconfont.css";
import '@xsykj/base-ui/dist/style.css'
import {constant} from '@/constant'
import SERVER_URL from '@/utils/getServerUrl'

const app = createApp(App);

app.config.globalProperties.constant = constant;//全局常量
app.config.globalProperties.prefix = SERVER_URL.prefix;
app.config.globalProperties.cx = SERVER_URL.cx;

app.use(router);
app.use(infiniteScroll);
app.mount("#app");
