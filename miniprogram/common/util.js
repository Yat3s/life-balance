export const formatDate = (timestamp) => {
  var date = new Date(timestamp);
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  m = m < 10 ? "0" + m : m;
  var d = date.getDate();
  d = d < 10 ? "0" + d : d;
  var h = date.getHours();
  h = h < 10 ? "0" + h : h;
  var minute = date.getMinutes();
  var second = date.getSeconds();
  minute = minute < 10 ? "0" + minute : minute;
  second = second < 10 ? "0" + second : second;
  return m + "/" + d + " " + h + ":" + minute;
};

export const calcDistance = (la1, lo1, la2, lo2) => {
  var La1 = (la1 * Math.PI) / 180.0;
  var La2 = (la2 * Math.PI) / 180.0;
  var La3 = La1 - La2;
  var Lb3 = (lo1 * Math.PI) / 180.0 - (lo2 * Math.PI) / 180.0;
  var s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(La3 / 2), 2) +
          Math.cos(La1) * Math.cos(La2) * Math.pow(Math.sin(Lb3 / 2), 2)
      )
    );
  s = s * 6378.137;
  s = Math.round(s * 10000) / 10000;
  return s.toFixed(2);
};

export const dateDiff = (date1, date2) => {
  return Math.round((date1 - date2) / (1000 * 60 * 60 * 24));
};

export const getWeekdayIndexStr = (date) => {
  const daysOfWeek = ["日", "一", "二", "三", "四", "五", "六"];
  const dayIndex = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
  return daysOfWeek[dayIndex];
};

export const formatTimeAgo = (timestamp) => {
  const now = new Date().getTime();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return "刚刚";
  }

  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }

  if (hours < 24) {
    return `${hours} 小时前`;
  }

  if (days < 7) {
    return `${days} 天前`;
  }

  return "7 天前";
};

export const getDateInEnglish = (date) => {
  const options = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };

  return new Intl.DateTimeFormat("en-US", options).format(new Date(date));
};
