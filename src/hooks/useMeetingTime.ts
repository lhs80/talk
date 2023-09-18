import dayjs from "dayjs";

import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);
let keepTimer = null;
let onLineTime = ref<string>("00:00:00");
export default function () {
  const getOnlineTime = (meetingInfo) => {
    const {startTime, serverTime} = meetingInfo;
    clearInterval(keepTimer); //刷新前清空计时器
    let mStartTime = dayjs(startTime);
    let mEndTime = dayjs(serverTime);
    let seconds = Math.abs(mEndTime.diff(mStartTime, "seconds"));
    dayjs.extend(duration);
    keepTimer = setInterval(() => {
      // console.log(dayjs.duration(++seconds * 1000).format('HH:mm:ss'));
      onLineTime.value = dayjs.duration(++seconds * 1000).format('HH:mm:ss');
    }, 1000);
  };

  onUnmounted(() => {
    clearInterval(keepTimer); //刷新前清空计时器
  });
  return {onLineTime, getOnlineTime};
}
