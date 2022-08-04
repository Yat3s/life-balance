import { cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_NAME = "glossaryFunctions"

export function queryGlossary(query) {
  const data = {
    query: query
  }
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'queryGlossary', data);
}

export function proposeTerm(term) {
  const data = {
    term: term
  }
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'proposeTerm', data);
}