import { cloudCall, cloudFunctionCall } from "./baseRepo";

const db = wx.cloud.database();

const CLOUD_FUNCTION_NAME = "exploreFunctions"
const COLLECTIONS_TEAM = "teams"

export function joinCircle(circleId, user) {
  console.log(circleId, user);

  const data = {
    id: circleId,
    user
  }

  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'joinCircle', data);
}

export function fetchAllTeams() {
  return cloudCall(db.collection(COLLECTIONS_TEAM).get(), "fetchAllTeams")
}

export function msftBoost() {
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'msftBoost')
}

export function queryAcronym(acronym) {
  console.log(acronym);
  const data = {
    acronym: acronym,
  }

  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'queryAcronym', data);
}