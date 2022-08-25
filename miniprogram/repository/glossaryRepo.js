import { cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_NAME = "glossaryFunctions"

export function queryGlossary(query) {
  const data = query;
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'queryGlossary', data);
}

export function proposeTerm(term) {
  const data = {
    term: term
  }
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'proposeTerm', data);
}

export function admin(term_id) {
  const data = {
    term_id: term_id
  }
  if(!term_id && term_id !== 0)
    return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'adminQuery', data);
  else
    return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'updateGlossary', data);
}