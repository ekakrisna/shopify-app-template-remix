import { useCallback, useEffect, useState } from "react";
import { Button, Layout, Link, Page, Text } from "@shopify/polaris";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import FirstStep from "~/images/pickup-date-embed.webp";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import { Guide } from "~/models/guide.server";
import { getThemesApi } from "~/api/graphql";
import { getShopifyId } from "~/helpers/shopify";

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

  return json({ setting_url });
};

export async function action({ request }: ActionFunctionArgs) {
  const { redirect, session } = await authenticate.admin(request);
  const { id } = session;
  const formData = await request.formData();
  const isPickupWidget =
    formData.get("isPickupWidget") === "true" ? true : false;
  const createGuide = await Guide.createOrUpdate({
    sessionId: id,
    isPickupWidget: isPickupWidget,
  });
  if (createGuide?.id) return redirect("/app/guides");
  return json({
    errors: {
      error: true,
      error_message: "An error occurred while updating the guide",
    },
  });
}

export default function WidgetPage() {
  const navigation = useNavigation();
  const submit = useSubmit();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  useEffect(() => {
    if (actionData) {
      setShowModal(false);
      shopify.toast.show("Successfully updated guide!");
      if (actionData.errors.error) {
        shopify.toast.show(actionData.errors.error_message, {
          isError: actionData.errors.error,
        });
      }
    }
  }, [actionData]);

  const { setting_url } = loaderData;
  const [showModal, setShowModal] = useState<boolean>(false);
  const isLoading = ["loading", "submitting"].includes(navigation.state);

  const handleConfirm = () => {
    submit({ isPickupWidget: true }, { method: "post" });
  };

  const handleModal = useCallback(() => {
    setShowModal(!showModal);
  }, [showModal]);

  return (
    <Page backAction={{ content: "Guides", url: "/app/guides" }}>
      <div className="space-y-2 mb-8">
        <Text variant="headingXl" as="h1" alignment="center">
          Add HubOn Local Pickup Widget
        </Text>
        <Text variant="bodyLg" as="p" alignment="center" fontWeight="regular">
          To show HubOn Local Pickup Widget at cart, you will need to complete
          the following steps.
        </Text>
      </div>
      <Layout>
        <Layout.Section>
          <div className="space-y-2 mb-4">
            <Text variant="bodyLg" as="p" alignment="center">
              Go to&nbsp;
              <Link monochrome url={setting_url} target="_blank">
                <strong>Theme Editor</strong>
              </Link>
              , then enable <strong>HubOn Local Pickup Widget</strong>, Then
              click save.
            </Text>
          </div>

          <img src={FirstStep} alt="step-1" srcSet={FirstStep} />

          <div className="flex items-center justify-end gap-4 mt-8">
            <Button variant="primary" onClick={handleModal}>
              Finish
            </Button>
          </div>

          <Modal open={showModal}>
            <TitleBar title="Setup Confirmation">
              <button onClick={handleModal}>Cancel</button>
              <button
                variant="primary"
                disabled={isLoading}
                onClick={handleConfirm}
              >
                {isLoading ? "Please wait..." : "Confirm"}
              </button>
            </TitleBar>

            <div className="p-4">
              <Text variant="bodyMd" as="p">
                Please confirm that you have completed all of the steps to add
                a&nbsp;HubOn local pickup widget. These steps allow your
                customers to select their desired pickup dates and select
                closest hub.
              </Text>
            </div>
          </Modal>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
