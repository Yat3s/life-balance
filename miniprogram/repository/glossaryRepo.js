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

export function adminQuery() {
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'adminQuery');
}

export function adminUpdate(term_id) {
  const data = {
    term_id: term_id
  }
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'adminUpdate', data);
}