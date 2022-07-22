import { cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_NAME = "glossaryFunctions"

export function queryGlossary(acronym) {
  const data = {
    query: acronym
  }
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'queryGlossary', data);
}

