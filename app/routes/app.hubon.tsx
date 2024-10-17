import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  Form,
  useNavigation,
  useNavigate,
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
import { useEffect, useState } from "react";
import { validateHubon } from "~/helpers/validation";
import { getHubonUserApi } from "~/api/hubon";
import {
  createProductApi,
  getLocationsApi,
  createProductVariantApi,
  getPublicationsApi,
  getProductApi,
  publishProductApi,
  updateProductOptionsApi,
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
  const { session } = await authenticate.admin(request);
  const { id } = session;
  const HUBON_API_URL = String(process.env.HUBON_API_URL);
  const HUBON_CLIENT_ID = String(process.env.HUBON_CLIENT_ID);
  const HUBON_PRODUCT_NAME = String(process.env.HUBON_SHIPPING_NAME);

  const formData = await request.formData();
  const apiKey = String(formData.get("apiKey"));
  const errors = validateHubon({
    apiKey: apiKey,
    sessionId: id,
  });

  if (errors) return json({ errors });

  const { error, registered_customer } = await getHubonUserApi({
    apiUrl: HUBON_API_URL,
    apiKey: apiKey,
    clientId: HUBON_CLIENT_ID,
  });

  if (error || !registered_customer) {
    return json({ errors: { error_message: "Invalid API Key.", error: true } });
  }

  const setting = registered_customer.setting;

  const user = await User.getByid(id);

  const publicationData = await getPublicationsApi(request, 250);
  const publications = publicationData.publications || [];
  console.log("PUBLICATIONS", publications);
  const getLocations = await getLocationsApi(request, 250);
  const locations = getLocations.locations || [];

  const productInput: ProductInput = {
    title: HUBON_PRODUCT_NAME,
    descriptionHtml: DESCRIPTION,
    handle: HUBON_PRODUCT_NAME.toLocaleLowerCase().replace(/ /g, "-"),
    vendor: HUBON_PRODUCT_NAME,
    status: "ACTIVE",
    productType: "Shipping",
  };

  if (user) {
    const optionValueName = user?.shippingPrice
      ? `with a minimum order of $${user.shippingPrice}`
      : "Pick up from a hub near you.";
    // -----------------------------
    // DEFAULT PRODUCT
    // -----------------------------
    if (user.defaultProductId) {
      const productData = await getProductApi(request, user.defaultProductId);
      const product = productData.product;
      console.log("DEFAULT PRODUCT", product, product?.options);
      if (product) {
        const productId = product.id;
        const defaultOption = product.options?.[0];

        if (productId && defaultOption) {
          const optionInput = {
            productId: String(productId),
            option: { id: String(defaultOption.id) },
            optionValuesToUpdate: defaultOption.optionValues?.map((item) => ({
              id: String(item.id),
              name: optionValueName,
            })),
          };

          console.log("OPTION INPUT", optionInput);
          const productOptionUpdate = await updateProductOptionsApi(
            optionInput,
            request,
          );
          console.log("PRODUCT OPTION UPDATE", productOptionUpdate);
        }
      } else {
        productInput.media = [
          {
            alt: HUBON_PRODUCT_NAME,
            mediaContentType: "IMAGE",
            originalSource: MEDIA_SRC,
          },
        ];
        productInput.productOptions = [
          { name: "Note", values: [{ name: optionValueName }] },
        ];
        console.log("PRODUCT INPUT", productInput);

        console.log("CREATING DEFAULT PRODUCT NULL");
        const productData = await createProductApi(productInput, request);
        console.log("CREATING DEFAULT NULL DONE");
        console.log("DEFAULT PRODUCT DATA NULL", productData);
        const productId = productData.product?.id;
        const variants = productData.variants;
        if (productId) {
          const publishProduct = await publishProductApi(request, {
            id: productId,
            input: publications.map((item) => ({ publicationId: item.id })),
          });
          console.log("PUBLISH DEFAULT PRODUCT", publishProduct);

          if (variants?.length) {
            console.log("CREATING DEFAULT VARIANT");
            const variantInput: ProductVariantInput = {
              media: [
                {
                  alt: HUBON_PRODUCT_NAME,
                  mediaContentType: "IMAGE",
                  originalSource: MEDIA_SRC,
                },
              ],
              productId: productId,
              strategy: "REMOVE_STANDALONE_VARIANT",
              variants: [
                {
                  optionValues: [
                    {
                      name: optionValueName,
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
              ],
            };
            console.log("VARIANT INPUT", variantInput);
            const variantData = await createProductVariantApi(
              variantInput,
              request,
            );
            console.log("VARIANT DATA", variantData);
            const result = await User.createOrUpdate({
              apiKey: apiKey,
              sessionId: id,
              defaultProductId: productId,
              defaultProductVariantId: variantData.variants?.[0].id,
            });
            console.log("RESULT", result);
            if (!result) {
              return json({
                errors: {
                  error_message: "Failed to creating or updating user.",
                  error: true,
                },
              });
            }
          }
        }
      }
    } else {
      productInput.media = [
        {
          alt: HUBON_PRODUCT_NAME,
          mediaContentType: "IMAGE",
          originalSource: MEDIA_SRC,
        },
      ];
      productInput.productOptions = [
        {
          name: "Note",
          values: [{ name: optionValueName }],
        },
      ];
      console.log("PRODUCT INPUT", productInput);

      console.log("CREATING DEFAULT PRODUCT");
      const productData = await createProductApi(productInput, request);
      console.log("CREATING DEFAULT DONE");
      console.log("DEFAULT PRODUCT DATA", productData);
      const productId = productData.product?.id;
      const variants = productData.variants;

      if (productId) {
        const publishProduct = await publishProductApi(request, {
          id: productId,
          input: publications.map((item) => ({ publicationId: item.id })),
        });
        console.log("DEFAULT PUBLISH PRODUCT", publishProduct);

        if (variants?.length) {
          console.log("CREATING DEFAULT VARIANT");
          const variantInput: ProductVariantInput = {
            media: [
              {
                alt: HUBON_PRODUCT_NAME,
                mediaContentType: "IMAGE",
                originalSource: MEDIA_SRC,
              },
            ],
            productId: productId,
            strategy: "REMOVE_STANDALONE_VARIANT",
            variants: [
              {
                optionValues: [
                  {
                    name: optionValueName,
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
            ],
          };
          console.log("DEFAULT VARIANT INPUT", variantInput);
          const variantData = await createProductVariantApi(
            variantInput,
            request,
          );
          console.log("DEFAULT VARIANT DATA", variantData);
          const result = await User.createOrUpdate({
            apiKey: apiKey,
            sessionId: id,
            defaultProductId: productId,
            defaultProductVariantId: variantData.variants?.[0].id,
          });
          console.log("RESULT", result);
        }
      }
    }

    // -----------------------------
    // ADDITIONAL PRODUCT
    // -----------------------------
    if (user.additionalProductId) {
      const productData = await getProductApi(
        request,
        user.additionalProductId,
      );
      const product = productData.product;
      console.log("ADDITIONAL PRODUCT", product);
      if (product) {
        const productId = product.id;
        const defaultOption = product.options?.[0];

        if (productId && defaultOption) {
          const optionInput = {
            productId: String(productId),
            option: { id: String(defaultOption.id) },
            optionValuesToUpdate: defaultOption.optionValues?.map((item) => ({
              id: String(item.id),
              name: optionValueName,
            })),
          };

          console.log("OPTION INPUT", optionInput);
          const productOptionUpdate = await updateProductOptionsApi(
            optionInput,
            request,
          );
          console.log("PRODUCT OPTION UPDATE", productOptionUpdate);
        }
      } else {
        productInput.media = [
          {
            alt: HUBON_PRODUCT_NAME,
            mediaContentType: "IMAGE",
            originalSource: MEDIA_SRC,
          },
        ];
        productInput.productOptions = [
          { name: "Note", values: [{ name: optionValueName }] },
        ];
        console.log("PRODUCT INPUT", productInput);

        console.log("CREATING ADDITIONAL PRODUCT");
        const productData = await createProductApi(productInput, request);
        console.log("CREATING ADDITIONAL DONE");
        console.log("ADDITIONAL PRODUCT DATA", productData);
        const productId = productData.product?.id;
        const variants = productData.variants;

        if (productId) {
          const publishProduct = await publishProductApi(request, {
            id: productId,
            input: publications.map((item) => ({ publicationId: item.id })),
          });
          console.log("ADDITIONAL PUBLISH PRODUCT", publishProduct);

          if (variants?.length) {
            console.log("CREATING ADDITIONAL VARIANT");
            const variantInput: ProductVariantInput = {
              media: [
                {
                  alt: HUBON_PRODUCT_NAME,
                  mediaContentType: "IMAGE",
                  originalSource: MEDIA_SRC,
                },
              ],
              productId: productId,
              strategy: "REMOVE_STANDALONE_VARIANT",
              variants: [
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
              ],
            };
            console.log("ADDITIONAL VARIANT INPUT", variantInput);
            const variantData = await createProductVariantApi(
              variantInput,
              request,
            );
            console.log("ADDITIONAL VARIANT DATA", variantData);
            const result = await User.createOrUpdate({
              apiKey: apiKey,
              sessionId: id,
              additionalProductId: productId,
              additionalProductVariantId: variantData.variants?.[0].id,
            });
            console.log("RESULT", result);

            if (!result) {
              return json({
                errors: {
                  error_message: "Failed to creating or updating user.",
                  error: true,
                },
              });
            }
          }
        }
      }
    }

    return json({
      errors: {
        error_message: "Successfully updated settings.",
        error: false,
      },
    });
  } else {
    productInput.media = [
      {
        alt: HUBON_PRODUCT_NAME,
        mediaContentType: "IMAGE",
        originalSource: MEDIA_SRC,
      },
    ];
    productInput.productOptions = [
      {
        name: "Note",
        values: [{ name: "Pick up from a hub near you." }],
      },
    ];
    console.log("PRODUCT INPUT", productInput);

    console.log("CREATING DEFAULT PRODUCT");
    const productData = await createProductApi(productInput, request);
    console.log("CREATING DEFAULT DONE");
    console.log("DEFAULT PRODUCT DATA", productData);
    const productId = productData.product?.id;
    const variants = productData.variants;

    if (productId) {
      const publishProduct = await publishProductApi(request, {
        id: productId,
        input: publications.map((item) => ({ publicationId: item.id })),
      });
      console.log("DEFAULT PUBLISH PRODUCT", publishProduct);

      if (variants?.length) {
        console.log("CREATING DEFAULT VARIANT");
        const variantInput: ProductVariantInput = {
          media: [
            {
              alt: HUBON_PRODUCT_NAME,
              mediaContentType: "IMAGE",
              originalSource: MEDIA_SRC,
            },
          ],
          productId: productId,
          strategy: "REMOVE_STANDALONE_VARIANT",
          variants: [
            {
              optionValues: [
                {
                  name: "Pick up from a hub near you.",
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
          ],
        };
        console.log("DEFAULT VARIANT INPUT", variantInput);
        const variantData = await createProductVariantApi(
          variantInput,
          request,
        );
        console.log("DEFAULT VARIANT DATA", variantData);
        const result = await User.createOrUpdate({
          apiKey: apiKey,
          sessionId: id,
          defaultProductId: productId,
          defaultProductVariantId: variantData.variants?.[0].id,
        });
        console.log("RESULT", result);
      }
    }
  }

  return json({
    errors: {
      error_message: "Successfully updated settings.",
      error: false,
    },
  });
};

export default function HubOnPage() {
  const navigation = useNavigation();
  const navigate = useNavigate();

  const { hubon_web_url } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;

  useEffect(() => {
    if (actionData) {
      if (!actionData.errors.error) {
        navigate("/app/guides/rate/1");
      }
    }
  }, [actionData, navigate]);

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
