import { createHmac } from "crypto";
import { encode } from "url-safe-base64";

interface SignatureProps {
  method: string;
  url: string;
  body: string;
  timestamp: string;
  apiKey: string;
}

export function getStringBeforeDash(inputString: string): string {
  return inputString.split("-")[0];
}

export function generateSignature({
  method,
  url,
  body,
  timestamp,
  apiKey,
}: SignatureProps): string {
  const trimmedBody = body.replaceAll(/\s+/g, "");
  const data = `${method}:${url}:${trimmedBody}`.toUpperCase();
  const payload = `${data}:${timestamp}`;
  const hmac = createHmac("sha512", apiKey);
  const signature = encode(hmac.update(payload).digest("base64"));
  return signature;
}
