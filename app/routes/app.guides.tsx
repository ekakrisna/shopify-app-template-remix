import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Outlet, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticateUser } from "~/helpers/authentication";

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

export default function GuidesPage() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <Outlet />
    </AppProvider>
  );
}
