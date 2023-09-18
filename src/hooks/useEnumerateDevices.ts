let machineList = ref([]);
let currentDevice = ref({
  videoId: "",
  audioInId: "default",
});
export default function () {
  const getList = async () => {
    machineList.value = await KConference.enumerateDevices();
    currentDevice.value = {
      videoId: "",
      audioInId: "default",
    };
    currentDevice.value.videoId = machineList.value.find((item) => {
      return item.kind === "videoinput";
    })?.deviceId;
    currentDevice.value.audioInId = machineList.value.find((item) => {
      return item.kind === "audioinput";
    })?.deviceId;
  };
  const changeDevice = (data) => {
    currentDevice.value = {
      ...data,
    };
  };
  const isHaveCamera = () => {
    return machineList.value.filter(item => {
      return item.kind === "videoinput";
    });
  };
  onMounted(async () => {
    await getList();
  });

  return {
    isHaveCamera, machineList, currentDevice, changeDevice, getList
  };
}
