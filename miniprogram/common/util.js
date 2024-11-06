export function formatDate(timestamp) {
  var date = new Date(timestamp);
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  m = m < 10 ? '0' + m : m;
  var d = date.getDate();
  d = d < 10 ? '0' + d : d;
  var h = date.getHours();
  h = h < 10 ? '0' + h : h;
  var minute = date.getMinutes();
  var second = date.getSeconds();
  minute = minute < 10 ? '0' + minute : minute;
  second = second < 10 ? '0' + second : second;
  return m + '/' + d + ' ' + h + ':' + minute;
}

export function calcDistance(la1, lo1, la2, lo2) {
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
}

export function dateDiff(date1, date2) {
  return Math.round((date1 - date2) / (1000 * 60 * 60 * 24));
}

export function getWeekdayIndexStr(date) {
  const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
  const dayIndex = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
  return daysOfWeek[dayIndex];
}
