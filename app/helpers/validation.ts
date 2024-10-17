import type { ParamsCreateTransport } from "~/types/transport.type";
import type { ErrorDetails } from "~/types/user.type";

interface HubonData {
  id?: number;
  apiKey: string;
  sessionId: string;
  defaultProductId?: string | null;
}

export interface TransportWithArray {
  [key: string]: string | number | string[];
}

export function validateHubon(data: HubonData): ErrorDetails | null {
  const errors: ErrorDetails = {
    error: false,
    details: {
      name: "",
      message: "",
    },
    error_message: "",
    metadata: null,
    errors: {},
  };

  if (!data.sessionId.trim()) {
    errors.error_message = "Session ID is required.";
  }

  if (!data.apiKey.trim()) {
    errors.error_message = "API key is required.";
  }

  if (Object.keys(errors).length) {
    return { ...errors, error: true };
  }

  return null;
}

export function validateTransport(
  data: ParamsCreateTransport,
): ErrorDetails | null {
  const errors: ErrorDetails = {
    error: false,
    details: {
      name: "",
      message: "",
    },
    error_message: "",
    metadata: null,
    errors: {},
  };

  if (!data.recipient_name) {
    errors.errors["recipient_name"] = "This field is required.";
  }

  if (!data.recipient_phone_number) {
    errors.errors["recipient_phone_number"] = "This field is required.";
  }

  if (!data.destination_hub_id) {
    errors.errors["destination_hub_id"] = "This field is required.";
  }

  if (!data.pickup_date) {
    errors.errors["pickup_date"] = "This field is required.";
  }

  if (!data.payer_type) {
    errors.errors["payer_type"] = "This field is required.";
  }

  if (Object.keys(errors.errors).length) {
    return { ...errors, error: true };
  }

  return null;
}
