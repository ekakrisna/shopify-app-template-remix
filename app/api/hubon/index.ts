import qs from "qs";
import { generateSignature, getStringBeforeDash } from "~/helpers/hubon";
import type {
  ParamProps,
  HubProps,
  TransportResponse,
  TransportProps,
  MetaResponse,
} from "~/types/transport.type";
import type { Params, RegisteredCustomerResponse } from "~/types/user.type";

export const getHubonUserApi = async ({
  apiKey,
  apiUrl,
  clientId,
}: Params): Promise<Partial<RegisteredCustomerResponse>> => {
  try {
    const encodedUser = getStringBeforeDash(apiKey);
    const dataSignature = {
      method: "GET",
      url: `${apiUrl}/external/v1/customers/info`,
      body: "",
      timestamp: String(new Date().toUTCString()),
      apiKey: apiKey,
    };

    const generatedSignature = generateSignature(dataSignature);

    const response = await fetch(`${apiUrl}/external/v1/customers/info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Request-Date": dataSignature.timestamp,
        "HubOn-Signature": generatedSignature,
        "Encoded-User-ID": encodedUser,
        "HubOn-Client-ID": clientId,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const getTransportApi = async ({
  filter,
  apiKey,
  apiUrl,
  clientId,
}: ParamProps): Promise<TransportResponse> => {
  try {
    const encodedUser = getStringBeforeDash(apiKey);
    const dataSignature = {
      method: "GET",
      url: `${apiUrl}/external/v1/transports?${qs.stringify(filter, { arrayFormat: "brackets" })}`,
      body: "",
      timestamp: String(new Date().toUTCString()),
      apiKey: apiKey,
    };

    const generatedSignature = generateSignature(dataSignature);

    const response = await fetch(
      `${apiUrl}/external/v1/transports?${qs.stringify(filter, { arrayFormat: "brackets" })}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "HubOn-Client-ID": clientId,
          "Request-Date": dataSignature.timestamp,
          "HubOn-Signature": generatedSignature,
          "Encoded-User-ID": encodedUser,
        },
      },
    );
    const data = await response.json();
    return data;
  } catch (error: any) {
    throw error;
  }
};

export const getHubsApi = async ({
  search,
  filter,
  apiUrl,
}: ParamProps): Promise<{ hubs: HubProps[] }> => {
  try {
    const url = `${apiUrl}/external/v1/hubs?${qs.stringify({ search, ...filter }, { arrayFormat: "brackets" })}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    throw error;
  }
};

export const getHubDetailApi = async ({
  apiUrl,
  id,
}: ParamProps): Promise<{ hub: HubProps }> => {
  try {
    const url = `${apiUrl}/api/v1/hubs/${id}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  } catch (error: any) {
    throw error;
  }
};

export const createTrasportApi = async ({
  params,
  apiKey,
  apiUrl,
  clientId,
}: ParamProps): Promise<TransportResponse> => {
  try {
    const encodedUser = getStringBeforeDash(apiKey);

    const dataSignature = {
      method: "POST",
      url: `${apiUrl}/external/v1/transports`,
      body: JSON.stringify(params),
      timestamp: String(new Date().toUTCString()),
      apiKey: apiKey,
    };

    const generatedSignature = generateSignature(dataSignature);

    const response = await fetch(`${apiUrl}/external/v1/transports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "HubOn-Client-ID": clientId,
        "Request-Date": dataSignature.timestamp,
        "HubOn-Signature": generatedSignature,
        "Encoded-User-ID": encodedUser,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (data.error)
      return {
        meta: {} as MetaResponse,
        transport: {} as TransportProps,
        transports: [],
        errors: { ...data, errors: {} },
      };
    console.log("DATA", data);
    return data;
  } catch (error) {
    console.log("ERROR", error);
    throw error;
  }
};
