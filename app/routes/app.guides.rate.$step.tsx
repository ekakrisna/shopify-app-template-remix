import React, { useCallback, useEffect, useState } from "react";
import { Button, Layout, Link, Page, Text } from "@shopify/polaris";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import FirstStep from "../images/step-1.webp";
import SecondStep from "~/images/step-2.webp";
import ThirdStep from "~/images/step-3.webp";
import ForthStep from "~/images/step-4.webp";
import FifthStep from "~/images/step-5.webp";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { Guide } from "~/models/guide.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { redirect, session } = await authenticate.admin(request);
  const { shop } = session;

  const setting_url = `https://${shop}/admin/settings`;

  const step = params.step;
  if (step) return json({ step, setting_url });
  return redirect("/app/guides");
};

export async function action({ request }: ActionFunctionArgs) {
  const { redirect, session } = await authenticate.admin(request);
  const { id } = session;
  const formData = await request.formData();
  const isCarrier = formData.get("isCarrier") === "true" ? true : false;
  const createGuide = await Guide.createOrUpdate({
    sessionId: id,
    isCarrier: isCarrier,
  });
  if (createGuide?.id) return redirect("/app/guides");
  return json({
    errors: {
      error: true,
      error_message: "An error occurred while updating the guide",
    },
  });
}

export default function RatePage() {
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const submit = useSubmit();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  useEffect(() => {
    if (actionData) {
      setShowModal(false);
      if (actionData.errors.error) {
        shopify.toast.show(actionData.errors.error_message, {
          isError: actionData.errors.error,
        });
      } else {
        shopify.toast.show("Successfully updated guide!");
      }
    }
  }, [actionData, shopify]);

  const { step, setting_url } = loaderData;
  const [showModal, setShowModal] = useState<boolean>(false);
  const isLoading = ["loading", "submitting"].includes(navigation.state);

  const handleConfirm = () => submit({ isCarrier: true }, { method: "post" });

  const navigate = useNavigate();

  const handleMove = (id: string) => {
    const ID = Number(id);
    if (ID < 5) {
      let url = `/app/guides/rate/${ID + 1}`;
      navigate(url);
    }
    if (ID === 5) handleModal();
  };

  const handleBack = (id: string) => {
    const url = `/app/guides/rate/${Number(id) - 1}`;
    navigate(url);
  };

  const handleModal = useCallback(() => {
    setShowModal(!showModal);
  }, [showModal]);

  return (
    <Page backAction={{ content: "Guides", url: "/app/guides" }}>
      <div className="space-y-2 mb-8">
        <Text variant="headingXl" as="h1" alignment="center">
          Add HubOn Local Pickup Rate
        </Text>
        <Text variant="bodyLg" as="p" alignment="center" fontWeight="regular">
          To show HubOn Local Pickup option at checkout, you will need to
          complete the following steps.
        </Text>
      </div>
      <Layout>
        <Layout.Section>
          {step === "1" && (
            <React.Fragment>
              <div className="space-y-2 mb-4">
                <Text variant="headingLg" as="h2" alignment="center">
                  Step 1
                </Text>
                <Text variant="bodyLg" as="p" alignment="center">
                  Login to your Shopify store's admin panel and go to&nbsp;
                  <Link monochrome url={setting_url} target="_blank">
                    <strong>Settings</strong>
                  </Link>
                  .
                </Text>
              </div>
              <img src={FirstStep} alt="step-1" srcSet={FirstStep} />
            </React.Fragment>
          )}
          {step === "2" && (
            <React.Fragment>
              <div className="space-y-2 mb-4">
                <Text variant="headingLg" as="h2" alignment="center">
                  Step 2
                </Text>
                <Text variant="bodyLg" as="p" alignment="center">
                  Change <strong>Shipping address phone number</strong> to&nbsp;
                  <strong>required</strong> on the&nbsp;
                  <Link
                    monochrome
                    url={`${setting_url}/checkout`}
                    target="_blank"
                  >
                    <strong>Checkout Setting</strong>
                  </Link>
                  .
                </Text>
              </div>
              <img
                src={SecondStep}
                alt="step-1"
                srcSet={SecondStep}
                className="mx-auto lg:h-[380px]"
                height={100}
              />
            </React.Fragment>
          )}

          {step === "3" && (
            <React.Fragment>
              <div className="space-y-2 mb-4">
                <Text variant="headingLg" as="h2" alignment="center">
                  Step 3
                </Text>
                <Text variant="bodyLg" as="p" alignment="center">
                  Go to&nbsp;
                  <Link
                    monochrome
                    url={`${setting_url}/shipping`}
                    target="_blank"
                  >
                    <strong>Shipping and delivery</strong>
                  </Link>
                  , then click on the <strong>General shipping section</strong>
                </Text>
              </div>
              <img
                src={ThirdStep}
                alt="step-3"
                className="mx-auto lg:h-[380px]"
              />
            </React.Fragment>
          )}

          {step === "4" && (
            <React.Fragment>
              <div className="space-y-2 mb-4">
                <Text variant="headingLg" as="h2" alignment="center">
                  Step 4
                </Text>
                <Text variant="bodyLg" as="p" alignment="center">
                  Select the shipping zone where you want to add a rate in the
                  fulfillment locations section, then click{" "}
                  <strong>Add Rate</strong>.
                </Text>
              </div>
              <img
                src={ForthStep}
                alt="step-4"
                className="mx-auto lg:h-[380px]"
              />
            </React.Fragment>
          )}

          {step === "5" && (
            <React.Fragment>
              <div className="space-y-2 mb-4">
                <Text variant="headingLg" as="h2" alignment="center">
                  Step 5
                </Text>
                <Text variant="bodyLg" as="p" alignment="center">
                  Then name the rate as <strong>HubOn Local Pickup</strong> and
                  set the cost to 0. After that, click{" "}
                  <strong>Add conditions</strong> and select{" "}
                  <strong>Based on item weight</strong>.<br /> Set the minimum
                  weight to 210,000 lbs (95,000 kgs) and the maximum weight to
                  220,000 lbs (99,000 kgs). Click <strong>Done</strong> and then
                  save.
                </Text>
              </div>
              <img
                src={FifthStep}
                alt="step-5"
                className="mx-auto lg:h-[380px]"
              />
            </React.Fragment>
          )}

          <div
            className={`mt-4 flex items-center gap-4 ${
              step === "1" ? "justify-end" : "justify-between"
            }`}
          >
            {step !== "1" && (
              <Button variant="secondary" onClick={() => handleBack(step)}>
                Back
              </Button>
            )}
            <Button variant="primary" onClick={() => handleMove(step)}>
              {`${Number(step) >= 5 ? "Finish" : "Continue"}`}
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
                Please confirm if you have completed all the necessary steps to
                integrate HubOn Local Pickup into your store checkout process.
              </Text>
            </div>
          </Modal>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
