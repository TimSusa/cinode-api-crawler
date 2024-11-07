import { getConfig } from "./config.ts";
import { Logger } from "./logger.ts";
import * as base64url from "https://deno.land/std@0.217.0/encoding/base64url.ts";

const logger = new Logger("Auth");

const headers = {
  "Content-Type": "application/json",
  Authorization: "",
};

let token:
  | {
      access_token: string;
      refresh_token: string;
    }
  | undefined;

async function getAuthHeaders() {
  const config = await getConfig();
  return {
    ...headers,
    Authorization: "Basic " + btoa(config.appId + ":" + config.appSecret),
  };
}

export async function getHeaders() {
  if (!token) {
    token = await getToken();
  }
  if (token && isTokenExpired(token.access_token)) {
    token = await getRefreshToken(token.refresh_token);
  }
  return {
    Authorization: `Bearer ${token?.access_token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function getToken() {
  try {
    const config = await getConfig();
    const resp = await fetch(config.tokenEndpoint, {
      method: "GET",
      headers: await getAuthHeaders(),
    });
    const data = await resp.json();
    const { access_token, refresh_token } = data;
    return { access_token, refresh_token };
  } catch (e) {
    logError("Error getting token", e);
  }
}

async function getRefreshToken(refreshToken: string | undefined) {
  try {
    const config = await getConfig();
    const resp = await fetch(`${config.tokenEndpoint}/refresh`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ refreshToken }),
    });
    const data = await resp.json();
    return data;
  } catch (error) {
    logError("Error getting refresh token", error);
  }
}

function isTokenExpired(token: string = "") {
  const payloadBase64 = token.split(".")[1];
  const decodedJson = new TextDecoder().decode(
    base64url.decodeBase64Url(payloadBase64)
  );
  const decoded = JSON.parse(decodedJson);
  const exp = decoded.exp;
  const expired = Date.now() >= exp * 1000;
  return expired;
}

function logError(msg: string, err: any) {
  if (err instanceof Error) {
    logger.error(err.message);
    throw new Error(msg);
  }
  logger.error("Unexpected error");
  return msg;
}
