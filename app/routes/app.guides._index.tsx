import { Layout, Page, Text, Card } from "@shopify/polaris";
import {
  DeliveryIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarCheckIcon,
} from "@shopify/polaris-icons";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import type { LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "@remix-run/react";
import { Guide } from "~/models/guide.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { id } = session;

  const guideData = await Guide.getByid(id);

  return json({
    guide_data: guideData,
  });
}

export default function GuidesPage() {
  const { guide_data } = useLoaderData<typeof loader>();
  return (
    <Page>
      <div className="space-y-2 mb-8">
        <Text variant="headingXl" as="h1" alignment="center">
          Setup Guide
        </Text>
        <Text variant="bodyLg" as="p" alignment="center" fontWeight="regular">
          Please complete all of the steps below before publishing your store.
        </Text>
      </div>
      <Layout>
        <Layout.Section variant="oneThird">
          <Link to="/app/guides/rate/1" className="hover:underline">
            <Card>
              <div className="w-full flex items-center justify-center">
                <div className="relative space-y-4">
                  <div className="absolute right-4">
                    <div className="w-8 h-8">
                      {guide_data?.isCarrier ? (
                        <CheckCircleIcon className="fill-current text-green-700" />
                      ) : (
                        <XCircleIcon className="fill-current text-destructive" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center text-center">
                    <DeliveryIcon width={42} />
                  </div>
                  <Text
                    variant="headingMd"
                    fontWeight="regular"
                    as="h3"
                    alignment="center"
                  >
                    Add HubOn Local Pickup Rate
                  </Text>
                </div>
              </div>
            </Card>
          </Link>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Link to="/app/guides/widget" className="hover:underline">
            <Card>
              <div className="w-full flex items-center justify-center">
                <div className="relative space-y-4">
                  <div className="absolute right-4">
                    <div className="w-8 h-8">
                      {guide_data?.isPickupWidget ? (
                        <CheckCircleIcon className="fill-current text-green-700" />
                      ) : (
                        <XCircleIcon className="fill-current text-destructive" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center text-center">
                    <CalendarCheckIcon width={42} />
                  </div>
                  <Text
                    variant="headingMd"
                    fontWeight="regular"
                    as="h3"
                    alignment="center"
                  >
                    Add HubOn Local Pickup Widget
                  </Text>
                </div>
              </div>
            </Card>
          </Link>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Link to="/app/guides/button" className="hover:underline">
            <Card>
              <div className="w-full flex items-center justify-center">
                <div className="relative space-y-4">
                  <div className="absolute right-4">
                    <div className="w-8 h-8">
                      {guide_data?.isButtonBuy ? (
                        <CheckCircleIcon className="fill-current text-green-700" />
                      ) : (
                        <XCircleIcon className="fill-current text-destructive" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center text-center">
                    <CalendarCheckIcon width={42} />
                  </div>
                  <Text
                    variant="headingMd"
                    fontWeight="regular"
                    as="h3"
                    alignment="center"
                  >
                    Hide Buy It Now Button
                  </Text>
                </div>
              </div>
            </Card>
          </Link>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
