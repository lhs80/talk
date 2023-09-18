import {ref, onMounted, getCurrentInstance} from "vue";

let presentationConnection = null;
let presentationRequest = null;
let projectionScreenStatus = ref(false);
export default function () {
  const {proxy} = getCurrentInstance();
  const createProjectScreen = (data) => {
    const {rtcUrl, mcMixId, meetingName, stunServer, startTime, serverTime} = data;
    const baseUrl = window.location.href;
    // 创建投屏页面采用url传参
    const urlPrefix = baseUrl.substring(0, baseUrl.indexOf("main.html"));//process.env.NODE_ENV === "development" ? "" : baseUrl.substring(0, baseUrl.indexOf("main.html"));
    const url = `${urlPrefix}/main.html#/synthesisStream?rtcUrl=${rtcUrl}&mcMixId=${mcMixId}&meetingId=${meetingName}&stunServer=${stunServer}&startTime=${startTime}&serverTime=${serverTime}`;
    // 创建个投屏对象
    presentationRequest = new PresentationRequest(url);
    navigator.presentation.defaultRequest = presentationRequest;
    presentationRequest
      .start()
      .then((connection) => {
        setStatus(true);
      })
      .catch((error) => {
        setStatus(false);
      });
    // 监听连接
    presentationRequest.addEventListener("connectionavailable", function (event) {
      presentationConnection = event.connection;
    });
  };
  const closeProjectScreen = () => {
    if (presentationConnection) {
      presentationConnection.terminate();
      setStatus(false);
    }
  };
  const setStatus = (status) => {
    projectionScreenStatus.value = status;
    // localStorage.setItem("projectionScreenStatus", projectionScreenStatus.value ? "true" : "");
  };
  return {projectionScreenStatus, closeProjectScreen, createProjectScreen};
}
