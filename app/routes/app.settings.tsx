import {
  Button,
  Card,
  FormLayout,
  Layout,
  Page,
  TextField,
} from "@shopify/polaris";
import {
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { json } from "@remix-run/node";
import { useEffect, useState } from "react";
import { User } from "~/models/hubon.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getHubonUserApi } from "~/api/hubon";
import {
  createProductApi,
  createProductVariantApi,
  getLocationsApi,
  getProductApi,
  getPublicationsApi,
  publishProductApi,
  updateProductOptionsApi,
} from "~/api/graphql";
import type { ProductInput, ProductVariantInput } from "~/types/product.type";
import { DESCRIPTION, MEDIA_SRC } from "~/helpers/const";
import type { Location } from "~/types/location.type";
import { obfuscateString } from "~/helpers/shopify";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { id } = session;
  let hubon_web_url = String(process.env.HUBON_WEB_URL);
  hubon_web_url += `/accounts/integration`;
  const user = await User.getByid(id);
  return json({
    hubon_web_url,
    user: { ...user, apiKey: user ? obfuscateString(user.apiKey) : "" },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { id } = session;
  const HUBON_API_URL = String(process.env.HUBON_API_URL);
  const HUBON_CLIENT_ID = String(process.env.HUBON_CLIENT_ID);
  const HUBON_PRODUCT_NAME = String(process.env.HUBON_SHIPPING_NAME);

  const formData = await request.formData();
  // const variantId = String(formData.get("variant_id"));
  const thresholdPrice = String(formData.get("threshold_price"));
  const shippingPrice = String(formData.get("shipping_price"));

  const user = await User.getByid(id);
  if (user) {
    // console.log("VARIANT ID", variantId);
    console.log("THRESHOLD_PRICE", thresholdPrice);
    console.log("SHIPPING_PRICE", shippingPrice);
    const { error, registered_customer } = await getHubonUserApi({
      apiUrl: HUBON_API_URL,
      apiKey: user.apiKey,
      hubonClientId: HUBON_CLIENT_ID,
    });

    if (error || !registered_customer) {
      return json({
        errors: { error_message: "Invalid API Key.", error: true },
      });
    }

    const setting = registered_customer.setting;

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
    };

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
              name: `with a minimum order of $${thresholdPrice}`,
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
          {
            name: "Note",
            values: [{ name: `with a minimum order of $${thresholdPrice}` }],
          },
        ];
        productInput.productType = "Default Shipping";
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
                      name: `with a minimum order of $${thresholdPrice}`,
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
              apiKey: user.apiKey,
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
          values: [{ name: `with a minimum order of $${thresholdPrice}` }],
        },
      ];
      productInput.productType = "Default Shipping";
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
                    name: `with a minimum order of $${thresholdPrice}`,
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
            apiKey: user.apiKey,
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
              name: `with a minimum order of $${thresholdPrice}`,
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
          {
            name: "Note",
            values: [{ name: `with a minimum order of $${thresholdPrice}` }],
          },
        ];
        productInput.productType = "Additional Shipping";
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
                      name: `with a minimum order of $${thresholdPrice}`,
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
              apiKey: user.apiKey,
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
          values: [{ name: `with a minimum order of $${thresholdPrice}` }],
        },
      ];
      productInput.productType = "Additional Shipping";
      console.log("PRODUCT INPUT", productInput);

      console.log("CREATING ADDTIONAL PRODUCT");
      const productData = await createProductApi(productInput, request);
      console.log("CREATING ADDTIONAL DONE");
      console.log("ADDTIONAL PRODUCT DATA", productData);
      const productId = productData.product?.id;
      const variants = productData.variants;

      if (productId) {
        const publishProduct = await publishProductApi(request, {
          id: productId,
          input: publications.map((item) => ({ publicationId: item.id })),
        });
        console.log("ADDTIONAL PUBLISH PRODUCT", publishProduct);

        if (variants?.length) {
          console.log("CREATING ADDTIONAL VARIANT");
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
                    name: `with a minimum order of $${thresholdPrice}`,
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
          console.log("ADDTIONAL VARIANT INPUT", variantInput);
          const variantData = await createProductVariantApi(
            variantInput,
            request,
          );
          console.log("ADDTIONAL VARIANT DATA", variantData);
          const result = await User.createOrUpdate({
            apiKey: user.apiKey,
            sessionId: id,
            additionalProductId: productId,
            additionalProductVariantId: variantData.variants?.[0].id,
          });
          console.log("RESULT", result);
        }
      }
    }

    const result = await User.createOrUpdate({
      apiKey: user.apiKey,
      sessionId: id,
      shippingPrice: shippingPrice,
      thresholdPrice: thresholdPrice,
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

  return json({
    errors: {
      error_message: "Successfully updated user.",
      error: false,
    },
  });
};

export default function SettingsPage() {
  const shopify = useAppBridge();
  const { Form, data, state, formMethod } = useFetcher<typeof action>();
  const { hubon_web_url, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const isLoading =
    ["loading", "submitting"].includes(state) && formMethod === "POST";

  const errors = actionData?.errors || data?.errors;

  useEffect(() => {
    if (errors) {
      if (!errors?.error) {
        shopify.toast.show(errors?.error_message || "");
      } else {
        shopify.toast.show(errors?.error_message || "", {
          isError: errors.error,
        });
      }
    }
  }, [errors, shopify]);

  const [apiKey, setApiKey] = useState<string>(user?.apiKey || "");
  const handleChangeApiKey = (newValue: string) => setApiKey(newValue);

  const [prices, setPrices] = useState<{
    threshold_price?: string;
    shipping_price?: string;
  }>({
    threshold_price: user?.thresholdPrice || "",
    shipping_price: user?.shippingPrice || "",
  });

  const handleChangeThresholdPrice = (newValue: string) => {
    setPrices((prev) => ({ ...prev, threshold_price: newValue }));
  };

  const handleChangeShippingPrice = (newValue: string) => {
    setPrices((prev) => ({ ...prev, shipping_price: newValue }));
  };

  return (
    <Page>
      <Layout>
        <Layout.AnnotatedSection
          id="account"
          title="Change API key"
          description={
            <>
              Don't have an API key? You can obtain one by visiting your account
              settings page{" "}
              <Link to={hubon_web_url} target="_blank" className="underline">
                here
              </Link>
              .
            </>
          }
        >
          <Card>
            <Form action="/app/hubon" method="post">
              <TextField
                label="API Key:"
                type="password"
                error={errors && errors?.error ? errors.error_message : ""}
                placeholder="Input API key"
                autoComplete="off"
                name="apiKey"
                value={apiKey}
                onChange={handleChangeApiKey}
                autoSize
              />
              <div className="text-right my-4">
                <Button
                  submit
                  variant="primary"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Submit
                </Button>
              </div>
            </Form>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
      <hr className="my-4" />
      <Layout>
        <Layout.AnnotatedSection
          id="shipping"
          title="Shipping fee discount"
          description="You can set a lower shipping fee or waive the shipping fee if certain order size is met."
        >
          <Card>
            <Form action="/app/settings" method="post">
              <FormLayout>
                <TextField
                  type="number"
                  label="Minimum order size:"
                  onChange={handleChangeThresholdPrice}
                  autoComplete="off"
                  value={prices.threshold_price}
                  name="threshold_price"
                  placeholder="Input minimum order size"
                />
                <TextField
                  type="number"
                  label="Shipping fee if the minimum order is met:"
                  onChange={handleChangeShippingPrice}
                  autoComplete="off"
                  value={prices.shipping_price}
                  name="shipping_price"
                  placeholder="Input shipping fee"
                />
              </FormLayout>
              <div className="text-right my-4">
                <Button
                  submit
                  variant="primary"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Submit
                </Button>
              </div>
            </Form>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}
