import { getHubonUserApi } from "~/api/hubon";
import { User } from "~/models/hubon.server";
import type { RegisteredCustomerResponse } from "~/types/user.type";

interface AuthenticateProps {
  sessionId: string;
  apiUrl: string;
  clientId: string;
}

export async function authenticateUser({
  sessionId,
  apiUrl,
  clientId,
}: AuthenticateProps): Promise<Partial<RegisteredCustomerResponse | null>> {
  const user = await User.getByid(sessionId);
  if (!user) return null;
  else {
    const getUserHubonApi = await getHubonUserApi({
      apiUrl,
      apiKey: user.apiKey,
      clientId: clientId,
    });
    if (!getUserHubonApi.registered_customer) return null;
    return {
      registered_customer: getUserHubonApi.registered_customer,
      user: user,
      response: getUserHubonApi.response,
    };
  }
}
