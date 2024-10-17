import type { TransportProps } from "~/types/transport.type";

export function getShopifyId(id: string): string | null {
  const regex = /\/(\d+)$/;
  const match = id.match(regex);
  return match ? match[1] : null;
}
export function obfuscateString(input: string): string {
  const totalLength = input.length;
  const visibleCount = 4;
  if (totalLength <= visibleCount * 2) return input;
  const start = input.slice(0, visibleCount);
  const end = input.slice(-visibleCount);
  const middle = "*".repeat(totalLength - visibleCount * 2);
  return `${start}${middle}${end}`;
}

export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export function replaceSemicolonsWithBreaks(input: string): string {
  return input.replace(/;/g, "<br/>");
}

export function extractValueAfterOrderId(text: string): string | null {
  if (text) {
    const regex = /Order ID:\s*(\d+)/;
    const match = text.match(regex);
    return match ? match[1] : text;
  }
  return text;
}

// export function formatDate(inputDate: string): string {
//   const options: Intl.DateTimeFormatOptions = {
//     weekday: "short",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   };
//   const date = new Date(inputDate);
//   return date.toLocaleDateString("en-US", options);
// }

export function formatDate(inputDate: string): string | null {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const date = new Date(inputDate);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", options);
}

export function formatTimeTo12HourFormat(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export const handleUrlOrder = (domain: string, transport: TransportProps) => {
  if (domain && transport?.sender_info) {
    return `https://${domain}/admin/orders/${extractValueAfterOrderId(
      stripHtmlTags(transport?.sender_info?.memo),
    )}`;
  } else {
    return `https://${domain}/admin/orders`;
  }
};

export const formatPhoneNumber = (
  phoneNumberString?: string | null,
): string => {
  if (!phoneNumberString) return "";
  const cleaned: string = phoneNumberString.replace(/\D/g, "");
  const match: RegExpMatchArray | null = cleaned.match(
    /^(1|)?(\d{3})(\d{3})(\d{4})|(\d{4})$/,
  );
  if (match) {
    const intlCode: string = match[1] ? "+1 " : "";
    return [intlCode, "(", match[2], ") ", match[3], " - ", match[4]].join("");
  }
  return "";
};
