interface HubonData {
  id?: number;
  apiKey: string;
  sessionId: string;
  defaultProductId?: string | null;
}

interface ValidationErrors {
  error_message?: string;
  error?: boolean;
}

export function validateHubon(data: HubonData): ValidationErrors | null {
  const errors: ValidationErrors = {};

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
