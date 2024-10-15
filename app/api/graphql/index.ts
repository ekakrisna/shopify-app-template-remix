import type { LocationNode, LocationResponse } from "~/types/location.type";
import type {
  ProductInput,
  ProductNode,
  ProductOptionResponse,
  ProductPublicationInput,
  ProductResponse,
  ProductVariantInput,
} from "~/types/product.type";
import type { publicationResponse } from "~/types/publication.type";
import type { Theme, ThemeNode, ThemeResponse } from "~/types/theme.type";
import { authenticate } from "~/shopify.server";

export async function getProductsApi(
  request: Request,
  first: number = 5,
  afterCursor?: string,
): Promise<ProductResponse> {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
      `#graphql
        query ($first: Int!, $after: String)  {
          products(first: $first, after:$after) {
            edges {
              node {
                id
                name
                handle
                options(first: 10) {
                  id
                  name
                  optionValues {
                    id
                    name
                  }
                }
                resourcePublicationOnCurrentPublication {
                  publication {
                    name
                    id
                  }
                  publishDate
                  isPublished
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }`,
      {
        variables: {
          first: first,
          after: afterCursor,
        },
      },
    );

    const data = await response.json();
    if (!data.data) throw new Error("Failed to get the products.");
    const products = data.data?.products.edges;

    return {
      products: products.map((edge: ProductNode) => edge.node),
    };
  } catch (error) {
    console.log("Failed to get the products.");
    throw error;
  }
}

export async function getProductApi(
  request: Request,
  id: string,
): Promise<ProductResponse> {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
      `#graphql
        query ($id: ID!)  {
          product(id: $id) {
            id
            title
            handle
            options(first: 10) {
              id
              name
              optionValues {
                id
                name
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  selectedOptions {
                    name
                    value
                  }
                  media(first: 10) {
                    edges {
                      node {
                        alt
                        mediaContentType
                        status
                        __typename
                        ... on MediaImage {
                          id
                          preview {
                            image {
                              url
                            }
                          }
                          __typename
                        }
                      }
                    }
                  }
                }
              }
            }
        }
      }`,
      { variables: { id: id } },
    );

    const data = await response.json();
    if (!data.data) throw new Error("Failed to get product id " + id);
    const product = data.data?.product;
    const variants = product?.variants?.edges.map(
      (edge: ProductNode) => edge.node,
    );
    return { product: product, variants: variants };
  } catch (error) {
    console.log("Failed to get product id " + id);
    throw error;
  }
}

export async function createProductApi(
  input: ProductInput,
  request: Request,
): Promise<ProductResponse> {
  try {
    const { media, ...item } = input;
    const { admin } = await authenticate.admin(request);

    const query = `#graphql
        mutation populateProduct($media: [CreateMediaInput!]!, $product: ProductCreateInput!) {
          productCreate(media: $media, product: $product) {
            product {
              id
              title
              descriptionHtml
              options(first: 10) {
                id
                name
                optionValues {
                  id
                  name
                }
              }
              media(first: 3) {
                edges {
                  node {
                    alt
                    mediaContentType
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    inventoryQuantity
                    price
                    barcode
                    createdAt
                  }
                }
              }
            }
            userErrors {
              message
              field
            }
          }
        }
      `;

    const response = await admin.graphql(query, {
      variables: {
        media: media,
        product: item,
      },
    });

    const data = await response.json();

    if (!data.data) throw new Error("Failed to create the product.");
    const productCreate = data.data?.productCreate;
    const variants = productCreate?.product?.variants?.edges.map(
      (edge: ProductNode) => edge.node,
    );

    return {
      product: productCreate?.product,
      variants: variants,
      userErrors: productCreate?.userErrors || [],
    };
  } catch (error) {
    console.log("Failed to create the product.");
    throw error;
  }
}

export async function updateProductApi(
  input: ProductInput,
  request: Request,
): Promise<ProductResponse> {
  try {
    const { media, ...item } = input;
    const { admin } = await authenticate.admin(request);

    const query = `#graphql
        mutation populateProduct($media: [CreateMediaInput!]!, $input: ProductInput!) {
          productUpdate(media: $media, input: $input) {
            product {
              id
              title
              descriptionHtml
              options(first: 10) {
                id
                name
                optionValues {
                  id
                  name
                }
              }
              media(first: 3) {
                edges {
                  node {
                    alt
                    mediaContentType
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    inventoryQuantity
                    price
                    barcode
                    createdAt
                  }
                }
              }
            }
            userErrors {
              message
              field
            }
          }
        }
      `;

    const response = await admin.graphql(query, {
      variables: {
        media: media,
        input: item,
      },
    });

    const data = await response.json();

    if (!data.data) throw new Error("Failed to update the product.");
    const productUpdate = data.data?.productUpdate;
    const variants = productUpdate?.product?.variants?.edges.map(
      (edge: ProductNode) => edge.node,
    );

    return {
      product: productUpdate?.product,
      variants: variants,
      userErrors: productUpdate?.userErrors || [],
    };
  } catch (error) {
    console.log("Failed to update the product.");
    throw error;
  }
}

export async function createProductVariantApi(
  input: ProductVariantInput,
  request: Request,
): Promise<ProductResponse> {
  try {
    const { media, productId, strategy, variants } = input;
    const { admin } = await authenticate.admin(request);

    const query = `#graphql
        mutation productVariantsBulkCreate($media: [CreateMediaInput!]!, $productId: ID!, $strategy: ProductVariantsBulkCreateStrategy, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkCreate(media: $media, productId: $productId, strategy: $strategy, variants: $variants) {
            product {
              id
              title
              descriptionHtml
              media(first: 3) {
                edges {
                  node {
                    alt
                    mediaContentType
                  }
                }
              }
              options {
                id
                name
                values
                position
                optionValues {
                  id
                  name
                  hasVariants
                }
              }
            }
            productVariants {
              id
              title
              selectedOptions {
                name
                value
              }
            }
            userErrors {
              message
              field
            }
          }
        }
      `;

    const response = await admin.graphql(query, {
      variables: {
        media: media,
        productId: productId,
        strategy: strategy,
        variants: variants,
      },
    });

    const data = await response.json();
    if (!data.data) throw new Error("Failed to create the variant product.");
    const variantCreate = data.data?.productVariantsBulkCreate;

    return {
      product: variantCreate?.product,
      variants: variantCreate?.productVariants,
      userErrors: variantCreate?.userErrors || [],
    };
  } catch (error) {
    console.log("Failed to create the variant product.");
    throw error;
  }
}

export async function updateProductVariantApi(
  input: ProductVariantInput,
  request: Request,
): Promise<ProductResponse> {
  try {
    const { media, productId, variants } = input;
    const { admin } = await authenticate.admin(request);

    const query = `#graphql
        mutation productVariantsBulkUpdate($media: [CreateMediaInput!]!, $productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(media: $media, productId: $productId, variants: $variants) {
            product {
              id
              title
              descriptionHtml
              media(first: 3) {
                edges {
                  node {
                    alt
                    mediaContentType
                  }
                }
              }
              options {
                id
                name
                values
                position
                optionValues {
                  id
                  name
                  hasVariants
                }
              }
            }
            productVariants {
              id
              title
              selectedOptions {
                name
                value
              }
            }
            userErrors {
              message
              field
            }
          }
        }
      `;

    const response = await admin.graphql(query, {
      variables: {
        media: media,
        productId: productId,
        variants: variants,
      },
    });

    const data = await response.json();
    if (!data.data) throw new Error("Failed to update the variant product.");
    const variantUpdate = data.data?.productVariantsBulkUpdate;

    return {
      product: variantUpdate.product,
      variants: variantUpdate.productVariants,
      userErrors: variantUpdate?.userErrors || [],
    };
  } catch (error) {
    console.log("Failed to update the variant product.");
    throw error;
  }
}

export async function getLocationsApi(
  request: Request,
  first: number = 5,
  afterCursor?: string,
): Promise<LocationResponse> {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
      `#graphql
        query ($first: Int!, $after: String)  {
          locations(first: $first, after:$after) {
            edges {
              node {
                id
                name
                address {
                  formatted
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }`,
      {
        variables: {
          first: first,
          after: afterCursor,
        },
      },
    );

    const data = await response.json();
    if (!data.data) throw new Error("Failed to get the locations.");
    const locations = data.data?.locations.edges;

    return {
      locations: locations.map((edge: LocationNode) => edge.node),
    };
  } catch (error) {
    console.log("Failed to get the locations.");
    throw error;
  }
}

export async function publishProductApi(
  request: Request,
  input: {
    id: string;
    input: ProductPublicationInput | ProductInput["productPublications"];
  },
) {
  try {
    const { id: productId, input: publications } = input;
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(
      `#graphql
        mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            publishable {
              availablePublicationsCount {
                count
              }
              resourcePublicationsCount {
                count
              }
            }
            shop {
              id
              name
            }
            userErrors {
              field
              message
            }
          }
        }`,
      {
        variables: {
          id: productId,
          input: publications,
        },
      },
    );

    const data = await response.json();
    if (!data.data) throw new Error("Failed to publish the product data.");
    const publishProduct = data.data?.publishablePublish;
    return publishProduct;
  } catch (error) {
    console.log("Failed to publish the product.");
    throw error;
  }
}

export async function publishProductChannelApi(
  request: Request,
  productId: string,
) {
  try {
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(
      `#graphql
        mutation publishablePublishToCurrentChannel($id: ID!) {
          publishablePublishToCurrentChannel(id: $id) {
            publishable {
              availablePublicationsCount {
                count
              }
              resourcePublicationsCount {
                count
              }
            }
            shop {
              id
              name
            }
            userErrors {
              field
              message
            }
          }
        }`,
      {
        variables: { id: productId },
      },
    );

    const data = await response.json();
    if (!data.data) {
      throw new Error("Failed to publish product to current channel.");
    }
    const publishProduct = data.data?.publishablePublishToCurrentChannel;
    return publishProduct;
  } catch (error) {
    console.log("Failed to publish product to current channel.");
    throw error;
  }
}

export async function getPublicationsApi(
  request: Request,
  first: number = 5,
  afterCursor?: string,
): Promise<publicationResponse> {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
      `#graphql
        query ($first: Int!, $after: String)  {
          publications(first: $first, after: $after) {
            edges {
              node {
                id
                name
                catalog {
                  id
                  title
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }`,
      {
        variables: {
          first: first,
          after: afterCursor,
        },
      },
    );

    const data = await response.json();

    if (!data.data) throw new Error("Failed to get the publications.");
    const publications = data.data?.publications.edges;

    return {
      publications: publications.map((edge: LocationNode) => edge.node),
    };
  } catch (error) {
    console.log("Failed to get the locations.");
    throw error;
  }
}

export async function getThemesApi(
  request: Request,
  first: number = 5,
  roles?: Theme["role"][],
): Promise<ThemeResponse> {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
      `#graphql
        query ($first: Int!, $roles: [ThemeRole!])  {
          themes(first: $first, roles: $roles) {
            edges {
              node {
                id
                name
                role
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }`,
      {
        variables: {
          first: first,
          roles: roles,
        },
      },
    );

    const data = await response.json();
    if (!data.data) throw new Error("Failed to get the themes.");
    const themes = data.data?.themes.edges;

    return {
      themes: themes.map((edge: ThemeNode) => edge.node),
    };
  } catch (error) {
    console.log("Failed to get the themes.");
    throw error;
  }
}

export async function updateProductOptionsApi(
  input: {
    productId: string;
    option: { id: string };
    optionValuesToAdd?: { name: string }[];
    optionValuesToUpdate?: { id: string; name: string }[];
    optionValuesToDelete?: string[];
  },
  request: Request,
): Promise<ProductOptionResponse> {
  try {
    const { admin } = await authenticate.admin(request);

    const query = `#graphql
      mutation updateOption($productId: ID!, $option: OptionUpdateInput!, $optionValuesToAdd: [OptionValueCreateInput!], $optionValuesToUpdate: [OptionValueUpdateInput!], $optionValuesToDelete: [ID!], $variantStrategy: ProductOptionUpdateVariantStrategy) {
        productOptionUpdate(productId: $productId, option: $option, optionValuesToAdd: $optionValuesToAdd, optionValuesToUpdate: $optionValuesToUpdate, optionValuesToDelete: $optionValuesToDelete, variantStrategy: $variantStrategy) {
          userErrors {
            field
            message
            code
          }
          product {
            id
            options {
              id
              name
              values
              position
              optionValues {
                id
                name
                hasVariants
              }
            }
            variants(first: 5) {
              nodes {
                id
                title
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }`;

    const response = await admin.graphql(query, {
      variables: input,
    });

    const data = await response.json();

    if (!data.data) throw new Error("Failed to update the product option.");
    const productOptionUpdate = data.data?.productOptionUpdate;
    const variants = productOptionUpdate?.product?.variants?.nodes;
    return {
      ...productOptionUpdate,
      product: { ...productOptionUpdate?.product, variants },
      variants,
    };
  } catch (error) {
    console.log("Failed to update the product option.");
    throw error;
  }
}
