import React, { useCallback, useEffect, useState } from "react";
import { Button, Layout, Link, Page, Text } from "@shopify/polaris";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { json, redirect } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import FirstStep from "~/images/buyitnow.webp";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import { Guide } from "~/models/guide.server";
import { getProductApi, getThemesApi } from "~/api/graphql";
import { getShopifyId } from "~/helpers/shopify";
import { User } from "~/models/hubon.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const hubonUser = await User.getByid(session.id);
  if (!hubonUser || !hubonUser?.defaultProductId) redirect("/app/hubon");

  const hubonProductId = String(hubonUser?.defaultProductId);
  const hubOnProduct = await getProductApi(request, hubonProductId);
  const handleHubonProduct = hubOnProduct.product?.handle;
  console.log("HUBON PRODUCT", hubOnProduct);

  const themes = await getThemesApi(request, 5, ["MAIN"]);
  const { id } = themes.themes[0];
  const themeId = getShopifyId(id);

  const setting_url = `https://${shop}/admin/themes/${themeId}/editor?previewPath=/products/${handleHubonProduct}`;

  return json({ setting_url });
};

export async function action({ request }: ActionFunctionArgs) {
  const { redirect, session } = await authenticate.admin(request);
  const { id } = session;
  const formData = await request.formData();
  const isButtonBuy = formData.get("isButtonBuy") === "true" ? true : false;
  const createGuide = await Guide.createOrUpdate({
    sessionId: id,
    isButtonBuy: isButtonBuy,
  });
  if (createGuide?.id) return redirect("/app/guides");
  return json({
    errors: {
      error: true,
      error_message: "An error occurred while updating the guide",
    },
  });
}

export default function HideButtonPage() {
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
    submit({ isButtonBuy: true }, { method: "post" });
  };

  const handleModal = useCallback(() => {
    setShowModal(!showModal);
  }, [showModal]);

  return (
    <Page backAction={{ content: "Guides", url: "/app/guides" }}>
      <div className="space-y-2 mb-8">
        <Text variant="headingXl" as="h1" alignment="center">
          Hide Buy It Now Button
        </Text>
        <Text variant="bodyLg" as="p" alignment="center" fontWeight="regular">
          Follow the following guide to hide the 'Buy It Now' button, this
          ensures customers not skipping the pickup date selection step.
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
              , click <strong>Buy buttons</strong>, then uncheck{" "}
              <strong>Show dynamic checkout buttons</strong>, Then click save.
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
                Please confirm that you have completed all of the steps to hide
                Buy It Now Button. These steps allow your customers to select
                their desired HubOn Local Pickup via cart page.
              </Text>
            </div>
          </Modal>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
