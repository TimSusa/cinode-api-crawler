import { load } from "https://deno.land/std@0.220.1/dotenv/mod.ts";

async function initializeConfig() {
  const env = await load();

  return {
    appId: env["CINODE_APP_ID"],
    appSecret: env["CINODE_APP_SECRET"],
    companyId: env["CINODE_COMPANY_ID"],
    tokenEndpoint: env["CINODE_TOKEN_ENDPOINT"],
    apiEndpoint: env["CINODE_API_ENDPOINT"],
  } as const;
}

export const getConfig = () => initializeConfig();
