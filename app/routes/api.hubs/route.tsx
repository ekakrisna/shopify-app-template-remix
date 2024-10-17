import db from "~/db.server";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getHubonUserApi, getHubsApi } from "~/api/hubon";
import type { HubProps, ParamProps } from "~/types/transport.type";

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
  const search = url.searchParams.get("search");
  const myshopifyDomain = url.searchParams.get("myshopifyDomain");

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

  const setting = getUserHubonApi?.registered_customer?.setting;
  const category_id = String(setting?.default_category?.id);
  const storage_type_id = String(setting?.default_storage_type?.id);

  let hubs: { hubs: HubProps[] } = { hubs: [] };
  const params: ParamProps = {
    apiKey: "",
    clientId: HUBON_CLIENT_ID,
    apiUrl: HUBON_API_URL,
    search: search || "",
    filter: {
      category: category_id,
      storage_types: storage_type_id ? [storage_type_id] : [],
    },
  };

  hubs = await getHubsApi(params);

  return json(hubs, successJsonHeaders());
};
