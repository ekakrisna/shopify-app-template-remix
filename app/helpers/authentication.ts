import { getHubonUserApi } from "~/api/hubon";
import { User } from "~/models/hubon.server";

interface AuthenticateProps {
  sessionId: string;
  apiUrl: string;
  clientId: string;
}

export async function authenticateUser({
  sessionId,
  apiUrl,
  clientId,
}: AuthenticateProps) {
  // Fetch the user by sessionId
  const user = await User.getByid(sessionId);

  // Check if user exists and has an API key
  if (!user) return null;
  // Fetch user data from Hubon API using the apiUrl and clientId
  else {
    const getUserHubonApi = await getHubonUserApi({
      apiUrl,
      apiKey: user.apiKey,
      hubonClientId: clientId,
    });

    // Check if user is registered with Hubon
    if (!getUserHubonApi.registered_customer) return null;

    // Return the Hubon user data if authenticated and registered
    return getUserHubonApi;
  }
}
