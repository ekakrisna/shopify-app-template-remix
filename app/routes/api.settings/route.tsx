import db from "~/db.server";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getHubDetailApi, getHubonUserApi } from "~/api/hubon";
import type { HubProps } from "~/types/transport.type";

function jsonResponseNotFound(message: string) {
  return json(
    { message },
    {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}

function successJsonHeaders() {
  return {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const HUBON_CLIENT_ID = String(process.env.HUBON_CLIENT_ID);
  const HUBON_API_URL = String(process.env.HUBON_API_URL);

  const url = new URL(request.url);
  const myshopifyDomain = url.searchParams.get("myshopifyDomain");
  const hubId = url.searchParams.get("hubId");

  if (!myshopifyDomain) return jsonResponseNotFound("Not Found");
  const responseSession = await db.session.findFirst({
    where: { OR: [{ shop: myshopifyDomain }, { id: myshopifyDomain }] },
  });
  if (!responseSession?.id) return jsonResponseNotFound("Not Found");

  const responseHubon = await db.hubon.findFirst({
    where: { sessionId: responseSession.id },
  });
  if (!responseHubon?.id) return jsonResponseNotFound("Not Found");

  const getUserHubonApi = await getHubonUserApi({
    apiKey: responseHubon.apiKey,
    apiUrl: HUBON_API_URL,
    clientId: HUBON_CLIENT_ID,
  });
  if (!getUserHubonApi?.registered_customer) jsonResponseNotFound("Not Found");

  let holiday_infos: string[] = [];
  let getHubDetail: { hub: HubProps } = { hub: {} as HubProps };
  let hub_hours: number[] = [];
  const weekdaysMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  if (hubId) {
    getHubDetail = await getHubDetailApi({
      id: hubId,
      apiUrl: HUBON_API_URL,
      apiKey: "",
      clientId: HUBON_CLIENT_ID,
    });
    if (getHubDetail.hub) {
      holiday_infos = (getHubDetail.hub.holiday_infos || []).map(
        (item) => item.date,
      );

      hub_hours = (getHubDetail.hub.hub_hours || [])
        .filter((item) => item.open_hour !== null && item.close_hour !== null)
        .map((item) => weekdaysMap[item.day as keyof typeof weekdaysMap]);
    }
  }

  const setting = getUserHubonApi.registered_customer?.setting;
  const cutoff_date = setting?.cutoff_date;
  const pickup_days = (setting?.pickup_days || []).map(Number);

  return json(
    { settings: { cutoff_date, pickup_days, holiday_infos, hub_hours } },
    successJsonHeaders(),
  );
};
