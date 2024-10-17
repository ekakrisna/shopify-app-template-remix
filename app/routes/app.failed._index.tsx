import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useLoaderData,
  useOutletContext,
} from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  IndexTable,
  InlineStack,
  Page,
  Pagination,
  Spinner,
  Text,
} from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { User } from "~/models/hubon.server";
import { authenticateUser } from "~/helpers/authentication";
import type { MetaResponse } from "~/types/transport.type";
import { useEffect, useState } from "react";
import Header from "~/components/header";
import type { TabProps } from "~/components/header";
import {
  Order,
  type OrderProps,
  type PaginatedResult,
} from "~/models/order.server";
import { replaceSemicolonsWithBreaks } from "~/helpers/shopify";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const HUBON_CLIENT_ID = String(process.env.HUBON_CLIENT_ID);
  const HUBON_API_URL = String(process.env.HUBON_API_URL);
  const { session, redirect } = await authenticate.admin(request);
  const { id, shop } = session;

  const user = await User.getByid(id);
  const hubon = await authenticateUser({
    sessionId: id,
    apiUrl: HUBON_API_URL,
    clientId: HUBON_CLIENT_ID,
  });
  if (!user || !hubon) return redirect("/app/hubon");

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || 1);
  const order_url = `https://${shop}/admin/orders/`;
  const hubon_user = `Hi, ${hubon.registered_customer?.info.full_name.toString()}`;

  const where = { deletedAt: null, sessionId: id };
  const result: PaginatedResult<OrderProps> = await Order.getPaginated({
    page,
    where,
  });

  return json({
    result,
    hubon_user,
    order_url,
    hubon,
  });
};

export default function FailedPage() {
  const filters = useOutletContext<TabProps[]>();
  const { result, hubon_user, order_url } = useLoaderData<typeof loader>();

  const { state, formMethod, submit, data } = useFetcher<typeof loader>();
  const isLoading = ["loading"].includes(state) && formMethod === "GET";

  const [filteredData, setFilteredData] = useState<OrderProps[]>(result.data);
  const [pagination, setPagination] = useState<MetaResponse>(result.meta);

  useEffect(() => {
    if (data && data.result) {
      setFilteredData(data.result.data);
      setPagination(data.result.meta);
    }
  }, [data]);

  const resourceName = {
    singular: "order",
    plural: "orders",
  };

  const handlePageChange = (newPage: number) => {
    const formData = new FormData();
    formData.set("page", newPage.toString());

    submit(formData, { method: "get" });
  };

  const rowMarkup = filteredData.map((order, index) => (
    <IndexTable.Row id={order.id.toString()} key={order.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {index}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Link to={`${order_url}${order.orderId}`} className="hover:underline">
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {order.orderId}
          </Text>
        </Link>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={order.status === "FAILED" ? "critical" : "success"}>
          {order.status}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {order.response && (
          <Text as="span" alignment="end" numeric>
            {JSON.parse(order.response).details
              ? JSON.parse(order.response).details.message
              : JSON.parse(order.response)}
          </Text>
        )}
      </IndexTable.Cell>
      {/* <IndexTable.Cell>
        {order.payload && (
          <Text as="span" alignment="end" numeric>
            {JSON.parse(order.payload).recipient_name}
          </Text>
        )}
      </IndexTable.Cell> */}
      {/* <IndexTable.Cell>
        {order.payload && (
          <Text as="span" alignment="end" numeric>
            {JSON.parse(order.payload).recipient_phone_number
              ? formatPhoneNumber(
                  JSON.parse(order.payload).recipient_phone_number,
                )
              : ""}
          </Text>
        )}
      </IndexTable.Cell> */}
      <IndexTable.Cell>
        {order.payload && (
          <div
            dangerouslySetInnerHTML={{
              __html: replaceSemicolonsWithBreaks(
                JSON.parse(order.payload).sender_memo,
              ),
            }}
          />
        )}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack align="center">
          <Button
            url={`${order.id}`}
            variant="primary"
            size="slim"
            icon={ViewIcon}
            // onClick={() => handleModal(order)}
          />
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page>
      <div className="mb-4">
        <Text variant="headingXl" as="h1">
          {hubon_user}
        </Text>
      </div>

      <div className="mb-4">
        <Header tabs={filters} />
        <hr className="mt-2" />
      </div>

      <div className="w-full mx-auto space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center w-full">
            <Spinner />
          </div>
        ) : (
          <Box paddingBlockEnd="400">
            <BlockStack gap="200">
              <IndexTable
                selectable={false}
                resourceName={resourceName}
                itemCount={filteredData.length}
                headings={[
                  { title: "ID" },
                  { title: "Status" },
                  { title: "Message" },
                  // { title: "Recipient name" },
                  // { title: "Recipient phone number" },
                  { title: "Description" },
                  { title: "Action", alignment: "center" },
                ]}
                lastColumnSticky
              >
                {rowMarkup}
              </IndexTable>
            </BlockStack>
            {(filteredData || []).length > 0 && (
              <div className="float-right my-4">
                <Pagination
                  type="table"
                  hasPrevious={
                    !!pagination.prev_page && pagination.prev_page > 0
                  }
                  onPrevious={() =>
                    handlePageChange(pagination.current_page - 1)
                  }
                  hasNext={
                    !!pagination.next_page &&
                    pagination.next_page < pagination.total_pages
                  }
                  onNext={() => handlePageChange(pagination.current_page + 1)}
                  label={`${pagination.current_page}-${pagination.total_pages} of ${pagination.total_items} orders`}
                />
              </div>
            )}
          </Box>
        )}
      </div>
    </Page>
  );
}
