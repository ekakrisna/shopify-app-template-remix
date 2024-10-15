import qs from "qs";
import { generateSignature, getStringBeforeDash } from "~/helpers/hubon";
import type {
  GetTransportApiParams,
  TransportResponse,
} from "~/types/transport.type";
import type {
  Params,
  RegisteredCustomer,
  RegisteredCustomerResponse,
} from "~/types/user.type";

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
    return {
      registered_customer: {} as RegisteredCustomer,
      response: {
        data: {
          error: true,
          message: "An unknown error occurred",
        },
      },
    };
  }
};

export const getTransportApi = async ({
  filter,
  apiKey,
  apiUrl,
  clientId,
}: GetTransportApiParams): Promise<TransportResponse> => {
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
    return error;
  }
};
