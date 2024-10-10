import { generateSignature, getStringBeforeDash } from "~/helpers/hubon";

export type Params = {
  apiKey: string;
  apiUrl: string;
  hubonClientId: string;
};

export interface RegisteredCustomerResponse extends ErrorDetails {
  registered_customer: RegisteredCustomer;
  response: {
    data: {
      error: boolean;
      message: string;
    };
  };
}

export interface RegisteredCustomer {
  id: number;
  phone_number: string;
  type: string;
  links: Link[];
  posts: Link[];
  business_url: null;
  info: Info;
  setting: Setting;
}

export interface Info {
  username: string;
  full_name: string;
  email: string;
  free_transport_credit: number;
  miles_saved: number;
  accepted_agreement_at: Date;
  status: string;
  about_me: null;
  image_url: null;
}

export interface Link {
  url: string;
  note: null;
}

export interface Setting {
  default_hub: DefaultHub;
  default_category: DefaultCategory;
  default_storage_type: DefaultStorageType;
  external_unit_price: string;
  email_subscription: boolean;
  is_private: boolean;
  business_account: boolean;
  cutoff_date: null;
  pickup_days: null;
}

export interface DefaultCategory {
  id: number;
  name: string;
  order: number;
  icon_url: string;
  is_tracking_visible: boolean;
}

export interface DefaultHub {
  id: number;
  name: string;
  status: string;
  contact: string;
  is_warehouse: boolean;
  image_url: string;
  address: Address;
  hub_groups: HubGroup[];
  coupons: Coupon[];
}

export interface Address {
  id: number;
  latitude: string;
  longitude: string;
  city: string;
  province_code: string;
  country_code: string;
  zipcode: string;
  full_address: string;
}

export interface Coupon {
  id: number;
  title: string;
  description: string;
  fine_print: string;
  code: string;
  image_url: string;
  hub_coupon_redeem_info: null;
  redeem_coupon_expiration_days: null;
}

export interface HubGroup {
  id: number;
  name: string;
  delivery_days: string[];
}

export interface DefaultStorageType {
  id: number;
  title: string;
  price: string;
  note: string;
  order: number;
  icon_url: string;
}

export interface ErrorDetails {
  error: boolean;
  details: Details;
  metadata: null;
}

export interface Details {
  name: string;
  message: string;
}

export const getHubonUserApi = async ({
  apiKey,
  apiUrl,
  hubonClientId,
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
        "HubOn-Client-ID": hubonClientId,
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
