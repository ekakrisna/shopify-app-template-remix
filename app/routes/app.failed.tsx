import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData, useOutletContext } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { authenticateUser } from "~/helpers/authentication";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { type TabProps } from "@shopify/polaris";

export async function loader({ request }: LoaderFunctionArgs) {
  const HUBON_API_URL = String(process.env.HUBON_API_URL);
  const HUBON_CLIENT_ID = String(process.env.HUBON_CLIENT_ID);
  const { redirect, session } = await authenticate.admin(request);
  const { id } = session;

  const data = {
    sessionId: id,
    apiUrl: HUBON_API_URL,
    clientId: HUBON_CLIENT_ID,
  };

  const user = await authenticateUser(data);

  if (!user) return redirect("/app/hubon");

  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
}

export default function FailedPage() {
  const filters = useOutletContext<TabProps[]>();
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <Outlet context={filters} />
    </AppProvider>
  );
}
