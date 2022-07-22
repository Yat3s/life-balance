const cloud = require('wx-server-sdk');

cloud.init({
  env: 'life-6go5gey72a61a773'
});
const db = cloud.database();

exports.main = async (query, context) => {

  const _ = db.command

  const MAX_LIMIT = 100
  // 先取出集合记录总数
  const countResult = await db.collection('glossaries').count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / MAX_LIMIT)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    if (query === "" || query === null) {
      const result = await db.collection('glossaries').skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
      tasks.push(result.data)
    }
    else {
      const result = await db.collection('glossaries').skip(i * MAX_LIMIT).limit(MAX_LIMIT).where(_.or([
        {
          synonyms: {
            $regex: '.*' + query,
            $options: 'i'
          }
        },
        {
          fullname: {
            $regex: '.*' + query,
            $options: 'i'
          }
        }])).field({
          _id: true,
          synonyms: true,
          fullname: true,
          description: true
        }).get()
        tasks.push(result.data)
    }

  }
  // 等待所有
  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data)
    }
  })
}
