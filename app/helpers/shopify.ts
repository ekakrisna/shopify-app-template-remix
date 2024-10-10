export function getShopifyId(id: string): string | null {
  const regex = /\/(\d+)$/;
  const match = id.match(regex);
  return match ? match[1] : null;
}
