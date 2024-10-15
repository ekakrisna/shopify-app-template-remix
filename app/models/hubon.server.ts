import db from "~/db.server";

export interface HubonData {
  id?: number;
  apiKey: string;
  sessionId: string;
  defaultProductId?: string | null;
  defaultProductVariantId?: string | null;
  additionalProductId?: string | null;
  additionalProductVariantId?: string | null;
  thresholdPrice?: string | null;
  shippingPrice?: string | null;
}

interface GetUser {
  all: () => Promise<HubonData[]>;
  getByid: (id: string) => Promise<HubonData | null>;
  createOrUpdate: (data: HubonData) => Promise<HubonData | null>;
}

async function getUserById(id: string): Promise<HubonData | null> {
  const response: HubonData | null = await db.hubon.findUnique({
    where: {
      sessionId: id,
    },
  });

  return response;
}

async function getAllUsers(): Promise<HubonData[]> {
  const response: HubonData[] = await db.hubon.findMany();
  return response;
}

async function createOrUpdateUser(
  data: HubonData | any,
): Promise<HubonData | null> {
  const response: HubonData | null = await db.hubon.upsert({
    where: { sessionId: data.sessionId },
    update: data,
    create: data,
  });
  return response;
}

export const User: GetUser = {
  all: async (): Promise<HubonData[]> => {
    return await getAllUsers();
  },

  getByid: async (id: string): Promise<HubonData | null> => {
    return await getUserById(id);
  },

  createOrUpdate: async (data: HubonData): Promise<HubonData | null> => {
    return await createOrUpdateUser(data);
  },
};
