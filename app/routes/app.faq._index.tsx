import { Layout, Page, Text } from "@shopify/polaris";
import { Link, useLoaderData } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getThemesApi } from "~/api/graphql";
import { getShopifyId } from "~/helpers/shopify";
import { json } from "@remix-run/node";
import FirstStep from "../images/pickup-date-embed.webp";
import Accordion from "~/components/accordion";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const THEME_EXTENSION_ID = String(
    process.env.SHOPIFY_HUBON_LOCAL_PICKUP_THEME_ID,
  );

  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const themes = await getThemesApi(request, 5, ["MAIN"]);
  const { id } = themes.themes[0];
  const themeId = getShopifyId(id);

  const setting_url = `https://${shop}/admin/themes/${themeId}/editor?context=apps&previewPath=/cart&appEmbed=${THEME_EXTENSION_ID}/hubon_pickup_date`;
  const hubon_url = String(process.env.HUBON_WEB_URL);

  return json({ setting_url, hubon_url });
};

export default function GuidesPage() {
  const { setting_url, hubon_url } = useLoaderData<typeof loader>();

  const accordionItems = [
    {
      id: "item-1",
      trigger: (
        <Text variant="bodyLg" as="p" fontWeight="semibold">
          Can I charge my customer a local pickup fee?
        </Text>
      ),
      content: (
        <Text variant="bodyLg" as="p">
          `We recommend making local pickup free for your customers but include
          a minimum order. Yes, you can adjust the prices of the hub options
          directly through your account settings on{" "}
          <Link
            to={`${hubon_url}/accounts/integration`}
            target="_blank"
            className="underline"
          >
            letshubon.com
          </Link>
          . This allows for more flexibility in how you charge for local pickup
          depending on your specific business needs and strategies.`
        </Text>
      ),
    },
    {
      id: "item-2",
      trigger: (
        <Text variant="bodyLg" as="p" fontWeight="semibold">
          How do I add a cut off date for my preorder?
        </Text>
      ),
      content: (
        <Text variant="bodyLg" as="p">
          You can adjust the cut off date through your account settings on{" "}
          <Link
            to={`${hubon_url}/accounts/integration`}
            target="_blank"
            className="underline"
          >
            letshubon.com
          </Link>
          . This is particularly useful when determining the cut off order date,
          as you will need to account for order preparation and fulfillment
          time.
        </Text>
      ),
    },
    {
      id: "item-3",
      trigger: (
        <Text variant="bodyLg" as="p" fontWeight="semibold">
          Can I require customers to pick up their orders on certain days of the
          week?
        </Text>
      ),
      content: (
        <Text variant="bodyLg" as="p">
          Yes, you can customize pickup days for your customers through your
          account settings on{" "}
          <Link
            to={`${hubon_url}/accounts/integration`}
            target="_blank"
            className="underline"
          >
            letshubon.com
          </Link>
          . This feature is particularly useful if you offer weekly preorders
          and have a dedicated day for customers to pick up their orders.
        </Text>
      ),
    },
    {
      id: "item-4",
      trigger: (
        <Text variant="bodyLg" as="p" fontWeight="semibold">
          How do I change the button label and other elements on the HubOn Local
          Pickup widget?
        </Text>
      ),
      content: (
        <div className="space-y-4">
          <Text variant="bodyLg" as="p">
            You can adjust it on the theme cart URL (
            <Link to={setting_url} target="_blank" className="underline">
              here
            </Link>
            ) according to the image below.
          </Text>
          <img src={FirstStep} alt="step-1" srcSet={FirstStep} />
        </div>
      ),
    },
  ];

  return (
    <Page>
      <div className="space-y-2 mb-8">
        <Text variant="headingXl" as="h1" alignment="center">
          Frequently Asked Questions
        </Text>
      </div>
      <Layout>
        <Layout.Section>
          <div className="space-y-4">
            {accordionItems.map((item) => (
              <Accordion
                key={item.id}
                id={item.id}
                title={item.trigger}
                content={item.content}
              />
            ))}
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
