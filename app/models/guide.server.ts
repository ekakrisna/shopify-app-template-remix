import db from "~/db.server";

interface GuideDetail {
  id: number;
  sessionId: string;
  isCarrier: boolean;
  isButtonBuy: boolean;
  isPickupWidget: boolean;
}

interface GuideData {
  sessionId: string;
  isCarrier?: boolean;
  isButtonBuy?: boolean;
  isPickupWidget?: boolean;
}

interface GetGuide {
  //   all: () => Promise<GuideDetail[]>;
  getByid: (id: string) => Promise<GuideDetail | null>;
  createOrUpdate: (data: GuideData) => Promise<GuideDetail | null>;
}

async function createOrUpdateGuide({
  sessionId,
  isCarrier,
  isButtonBuy,
  isPickupWidget,
}: GuideData): Promise<GuideDetail> {
  const response: GuideDetail = await db.guide.upsert({
    where: { sessionId: sessionId },
    update: { isPickupWidget, isButtonBuy, isCarrier },
    create: { sessionId, isPickupWidget, isButtonBuy, isCarrier },
  });

  return response;
}

async function getGuideById(id: string): Promise<GuideDetail | null> {
  const response: GuideDetail | null = await db.guide.findUnique({
    where: {
      sessionId: id,
    },
  });

  return response;
}

export const Guide: GetGuide = {
  //   all: async (): Promise<GuideData[]> => {
  //     return await getAllUsers();
  //   },

  getByid: async (id: string): Promise<GuideDetail | null> => {
    return await getGuideById(id);
  },

  createOrUpdate: async (data: GuideData): Promise<GuideDetail | null> => {
    return await createOrUpdateGuide(data);
  },
};
