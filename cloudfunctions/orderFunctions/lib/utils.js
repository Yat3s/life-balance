const MAX_LIMIT = 20;

async function getAllData(db, options) {
  const { collection, whereCondition = {}, orderBy = {} } = options;

  const countResult = await db
    .collection(collection)
    .where(whereCondition)
    .count();

  const total = countResult.total;
  const batchTimes = Math.ceil(total / MAX_LIMIT);

  const tasks = [];
  for (let i = 0; i < batchTimes; i++) {
    let promise = db
      .collection(collection)
      .where(whereCondition)
      .skip(i * MAX_LIMIT)
      .limit(MAX_LIMIT);

    if (orderBy.field) {
      promise = promise.orderBy(orderBy.field, orderBy.type || 'desc');
    }

    promise = promise.get();
    tasks.push(promise);
  }

  const allResult = await Promise.all(tasks);

  let result = [];
  allResult.forEach((res) => {
    result = result.concat(res.data);
  });

  return result;
}

module.exports = {
  getAllData,
};
