const fetchAllActivities = require('./actions/fetchAllActivities')
const fetchActivitiesByIds = require('./actions/fetchActivitiesByIds')
const signupActivity = require('./actions/signupActivity')
const quitActivity = require('./actions/quitActivity')
const updateActivity = require('./actions/updateActivity')
const fetchUserActivities = require('./actions/fetchUserActivities')


exports.main = async (event, context) => {
  const data = event.data;
  switch (event.action) {
    case 'fetchAllActivities':
      return await fetchAllActivities.main(data, context);
    case 'fetchActivitiesByIds':
      return await fetchActivitiesByIds.main(data, context);
    case 'signupActivity':
      return await signupActivity.main(data, context);
    case 'updateActivity':
      return await updateActivity.main(data, context);
    case 'quitActivity':
      return await quitActivity.main(data, context);
      case 'fetchUserActivities':
        return await fetchUserActivities.main(data, context);
      
  }
}