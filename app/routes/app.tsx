import type {
  HeadersFunction,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import stylesheet from "../tailwind.css?url";
import Header from "~/components/header";
import Footer from "~/components/footer";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: stylesheet },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const HUBON_WEB_URL = String(process.env.HUBON_WEB_URL);
  const SHOPIFY_API_KEY = String(process.env.SHOPIFY_API_KEY);

  return json({
    apiKey: SHOPIFY_API_KEY || "",
    hubon_web_url: HUBON_WEB_URL,
  });
};

export default function App() {
  const { apiKey, hubon_web_url } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/guides">Guides</Link>
        <Link to="/app/faq">FAQ</Link>
        <Link to="/app/settings">Settings</Link>
      </NavMenu>

      <Header />

      <div className="pt-4 pb-16 mx-auto min-h-[80vh]">
        <Outlet />
      </div>

      <Footer hubon_web_url={hubon_web_url} />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
