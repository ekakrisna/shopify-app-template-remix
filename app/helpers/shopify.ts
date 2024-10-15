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
