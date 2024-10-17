import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useOutletContext } from "@remix-run/react";
import { Page, Pagination, Spinner, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getTransportApi } from "~/api/hubon";
import { authenticateUser } from "~/helpers/authentication";
import TransportDetail from "~/components/transport";
import { handleUrlOrder } from "~/helpers/shopify";
import type { MetaResponse, TransportProps } from "~/types/transport.type";
import { Fragment } from "react/jsx-runtime";
import EmptyState from "~/components/empty";
import { useEffect, useState } from "react";
import Header from "~/components/header";
import type { TabProps } from "~/components/header";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const HUBON_WEB_URL = String(process.env.HUBON_WEB_URL);
  const HUBON_CLIENT_ID = String(process.env.HUBON_CLIENT_ID);
  const HUBON_API_URL = String(process.env.HUBON_API_URL);
  const { session, redirect } = await authenticate.admin(request);
  const { id, shop } = session;

  const hubonUser = await authenticateUser({
    sessionId: id,
    apiUrl: HUBON_API_URL,
    clientId: HUBON_CLIENT_ID,
  });

  if (!hubonUser) return redirect("/app/hubon");
  const { user, registered_customer } = hubonUser;
  if (!registered_customer || !user) return redirect("/app/hubon");

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || 1;

  const transports = await getTransportApi({
    filter: {
      page: page,
      page_size: 5,
      filter: { states: ["paid"] },
      sort_by: "latest",
    },
    apiKey: user.apiKey,
    apiUrl: HUBON_API_URL,
    clientId: HUBON_CLIENT_ID,
  });

  return json({
    hubon_web_url: HUBON_WEB_URL,
    transports,
    hubon_user: `Hi, ${hubonUser.registered_customer?.info.full_name.toString()}`,
    shop,
  });
};

export default function PaidPage() {
  const filters = useOutletContext<TabProps[]>();

  const { hubon_web_url, transports, hubon_user, shop } =
    useLoaderData<typeof loader>();

  const { state, formMethod, submit, data } = useFetcher<typeof loader>();
  const isLoading = ["loading"].includes(state) && formMethod === "GET";
  const [filteredData, setFilteredData] = useState<TransportProps[]>(
    transports.transports,
  );
  const [pagination, setPagination] = useState<MetaResponse>(transports.meta);

  useEffect(() => {
    if (data && data.transports) {
      setFilteredData(data.transports.transports);
      setPagination(data.transports.meta);
    }
  }, [data]);

  const handlePageChange = (newPage: number) => {
    const formData = new FormData();
    formData.set("page", newPage.toString());

    submit(formData, { method: "get" });
  };

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

      <div className="mb-3">
        <p className="text-gray-500">
          There are {pagination?.total_items || 0} transports already paid
        </p>
      </div>

      <div className="w-full mx-auto space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center w-full">
            <Spinner />
          </div>
        ) : (
          <>
            {(filteredData || []).map((transport: TransportProps) => (
              <Fragment key={transport.id}>
                <TransportDetail
                  key={transport.id}
                  orderUrl={handleUrlOrder(shop, transport)}
                  transport={transport}
                  hubOnUrl={hubon_web_url}
                />
              </Fragment>
            ))}
            {(filteredData || []).length > 0 ? (
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
                  label={`${pagination.current_page}-${pagination.total_pages} of ${pagination.total_items} transports`}
                />
              </div>
            ) : (
              <EmptyState title="No transport is found" />
            )}
          </>
        )}
      </div>
    </Page>
  );
}
