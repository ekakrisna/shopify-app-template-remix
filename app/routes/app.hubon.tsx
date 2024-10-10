import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  Form,
  useNavigation,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Button,
  Text,
  TextField,
  Link,
  BlockStack,
  Card,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { useState } from "react";
import { validateHubon } from "~/helpers/validation";
import { getHubonUserApi } from "~/api/hubon";
import {
  createProductApi,
  getAllLocationsApi,
  createProductVariantApi,
  getPublicationsApi,
  getProductApi,
  updateProductApi,
  updateProductVariantApi,
} from "~/api/graphql";
import { DESCRIPTION, MEDIA_SRC } from "~/helpers/const";
import type { ProductInput, ProductVariantInput } from "~/types/product.type";
import type { Location } from "~/types/location.type";
import { User } from "~/models/hubon.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  let hubon_web_url = String(process.env.HUBON_WEB_URL);
  hubon_web_url += `/accounts/integration`;
  return json({
    hubon_web_url: hubon_web_url,
    session: session,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { redirect, session } = await authenticate.admin(request);
  const HUBON_API_URL = String(process.env.HUBON_API_URL);
  const HUBON_CLIENT_ID = String(process.env.HUBON_CLIENT_ID);
  const HUBON_PRODUCT_NAME = String(process.env.HUBON_SHIPPING_NAME);

  const formData = await request.formData();
  const apiKey = String(formData.get("apiKey"));
  const errors = validateHubon({
    apiKey: apiKey,
    sessionId: session.id,
  });

  if (errors) return json({ errors }, { status: 500 });

  const { error, details, registered_customer } = await getHubonUserApi({
    apiUrl: HUBON_API_URL,
    apiKey: apiKey,
    hubonClientId: HUBON_CLIENT_ID,
  });

  if (error) {
    return json(
      { errors: { error_message: details?.message, error: true } },
      { status: 500 },
    );
  }

  if (!registered_customer) {
    return json(
      { errors: { error_message: details?.message, error: true } },
      { status: 500 },
    );
  }

  const setting = registered_customer.setting;

  const user = await User.getByid(session.id);

  let productId = null;
  if (user && user.defaultProductId) {
    const productData = await getProductApi(request, user.defaultProductId);
    if (productData.product.id) productId = productData.product.id;
  }

  const publicationData = await getPublicationsApi(request, 250);
  const publications = publicationData.publications || [];
  const getLocations = await getAllLocationsApi(request, 250);
  const locations = getLocations.locations || [];

  const productInput: ProductInput = {
    ...(productId && { id: productId }),
    title: HUBON_PRODUCT_NAME,
    descriptionHtml: DESCRIPTION,
    handle: HUBON_PRODUCT_NAME.toLocaleLowerCase().replace(/ /g, "-"),
    vendor: HUBON_PRODUCT_NAME,
    status: "ACTIVE",
    media: productId
      ? []
      : [
          {
            alt: HUBON_PRODUCT_NAME,
            mediaContentType: "IMAGE",
            originalSource: MEDIA_SRC,
          },
        ],
    ...(!productId && {
      productOptions: [
        {
          name: "Note",
          values: [{ name: "Pick up from a hub near you" }],
        },
      ],
    }),
    ...(!productId && {
      productPublications: publications.map((item) => ({
        publicationId: item.id,
      })),
    }),
    productType: "Shipping",
  };

  let productData = null;
  if (productId) {
    console.log("UPDATE PRODUCT");
    productData = await updateProductApi(productInput, request);
  } else {
    console.log("CREATE PRODUCT");
    productData = await createProductApi(productInput, request);
  }

  const product = productData.product;
  const variants = productData.variants;

  const variantInput: ProductVariantInput = {
    media: productId
      ? []
      : [
          {
            alt: HUBON_PRODUCT_NAME,
            mediaContentType: "IMAGE",
            originalSource: MEDIA_SRC,
          },
        ],
    productId: product.id!,
    strategy: "REMOVE_STANDALONE_VARIANT",
    variants: !productId
      ? [
          {
            optionValues: [
              {
                name: "Pick up from a hub near you",
                optionName: "Note",
              },
            ],
            compareAtPrice: setting.external_unit_price,
            price: setting.external_unit_price,
            barcode: HUBON_CLIENT_ID.toString(),
            mediaSrc: MEDIA_SRC,
            inventoryPolicy: "CONTINUE",
            inventoryItem: {
              cost: setting.external_unit_price,
              countryCodeOfOrigin: "US",
              measurement: {
                weight: {
                  unit: "KILOGRAMS",
                  value: 96000,
                },
              },
              requiresShipping: true,
              sku: HUBON_CLIENT_ID.toString(),
              tracked: true,
            },
            inventoryQuantities: locations.map((location: Location) => ({
              availableQuantity: 99999,
              locationId: location.id,
            })),
          },
        ]
      : (variants || []).map((variant) => ({
          id: variant.id,
          optionValues: [
            {
              name: "Pick up from a hub near you",
              optionName: "Note",
            },
          ],
          compareAtPrice: setting.external_unit_price,
          price: setting.external_unit_price,
          barcode: HUBON_CLIENT_ID.toString(),
          mediaSrc: MEDIA_SRC,
          inventoryPolicy: "CONTINUE",
          inventoryItem: {
            cost: setting.external_unit_price,
            countryCodeOfOrigin: "US",
            measurement: {
              weight: {
                unit: "KILOGRAMS",
                value: 96000,
              },
            },
            requiresShipping: true,
            sku: HUBON_CLIENT_ID.toString(),
            tracked: true,
          },
        })),
  };

  let variantData = null;
  if (productId) {
    console.log("UPDATE PRODUCT VARIANT");
    variantData = await updateProductVariantApi(variantInput, request);
  } else {
    console.log("CREATE PRODUCT VARIANT");
    variantData = await createProductVariantApi(variantInput, request);
  }

  const data = {
    apiKey: apiKey,
    sessionId: session.id,
    defaultProductId: variantData.product.id,
    defaultProductVariantId: variantData.variants?.[0]?.id,
  };

  const result = await User.createOrUpdate(data);

  if (!result) {
    return json({
      errors: {
        error_message: "Failed to creating or updating user.",
        error: true,
      },
    });
  }

  return redirect("/app/guides/rate/1");
};

export default function HubOnPage() {
  const navigation = useNavigation();

  const loaderData = useLoaderData<typeof loader>();
  const { hubon_web_url } = loaderData;

  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;

  const isLoading = ["loading", "submitting"].includes(navigation.state);

  const [value, setValue] = useState<string>("");

  const handleChange = (newValue: string) => setValue(newValue);

  return (
    <section className="flex items-center justify-center h-[80vh]">
      <div className="w-full max-w-md">
        <Card>
          <div className="p-8 space-y-8">
            <Text variant="headingXl" as="h2" alignment="center">
              Enter Your API Key
            </Text>
            <Text variant="bodyLg" as="p" alignment="center">
              You must create a HubOn account to get this API key. Keep this key
              confidential.
            </Text>

            <Form action="/app/hubon" method="post" className="space-y-6">
              <TextField
                label="API Key:"
                type="password"
                error={errors && errors?.error ? errors.error_message : ""}
                placeholder="Input API key"
                autoComplete="off"
                name="apiKey"
                helpText={
                  <>
                    Don't have an API key? You can obtain one by visiting your
                    account settings page{" "}
                    <Link url={hubon_web_url} target="_blank">
                      here
                    </Link>
                    .
                  </>
                }
                value={value}
                onChange={handleChange}
                autoSize
              />

              <BlockStack align="center">
                <Button
                  loading={isLoading}
                  fullWidth
                  size="large"
                  submit
                  variant="primary"
                >
                  {isLoading ? "Please wait..." : "Continue"}
                </Button>
              </BlockStack>
            </Form>
          </div>
        </Card>
      </div>
    </section>
  );
}
