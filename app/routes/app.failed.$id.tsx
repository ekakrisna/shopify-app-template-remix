import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import {
  Banner,
  Button,
  Card,
  FormLayout,
  List,
  Page,
  TextField,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
// import { User } from "~/models/hubon.server";
import { authenticateUser } from "~/helpers/authentication";
import { useEffect, useState } from "react";
import { Order, type OrderProps } from "~/models/order.server";
import DatePickerInput from "~/components/datepicker";
import AutocompleteComponent from "~/components/autocomplete";
import type {
  FailedOrderProps,
  HubDetails,
  HubProps,
  ParamProps,
  ParamsCreateTransport,
  ResponseProps,
  TransportFormProps,
} from "~/types/transport.type";
import type { ErrorDetails, Setting } from "~/types/user.type";
import { getRelevantDates } from "~/helpers/date";
import { createTrasportApi } from "~/api/hubon";
import { useAppBridge } from "@shopify/app-bridge-react";
import { validateTransport } from "~/helpers/validation";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const HUBON_CLIENT_ID = String(process.env.HUBON_CLIENT_ID);
  const HUBON_API_URL = String(process.env.HUBON_API_URL);
  const { session, redirect } = await authenticate.admin(request);
  const { id } = session;

  const hubon = await authenticateUser({
    sessionId: id,
    apiUrl: HUBON_API_URL,
    clientId: HUBON_CLIENT_ID,
  });
  if (!hubon) return redirect("/app/hubon");

  const { registered_customer } = hubon;
  if (!registered_customer) return redirect("/app/hubon");

  const order_id = params.id;
  const where = { deletedAt: null, sessionId: id, id: Number(order_id) };
  const result = await Order.getById(where);

  let data: FailedOrderProps = {
    payload: {} as TransportFormProps,
    response: {} as ResponseProps,
    setting: {} as Setting,
  };

  if (result) {
    const setting = registered_customer.setting;
    const payload = result.payload ? JSON.parse(result.payload) : {};
    const response = result.response ? JSON.parse(result.response) : {};
    data = { payload, response, setting };
  }

  return json({ initial_value: data, result });
};

export async function action({ request, params }: ActionFunctionArgs) {
  const HUBON_CLIENT_ID = String(process.env.HUBON_CLIENT_ID);
  const HUBON_API_URL = String(process.env.HUBON_API_URL);

  const { redirect, session } = await authenticate.admin(request);
  const { id } = session;

  const order_id = Number(params.id);
  console.log("ORDER PARAM ID", order_id);
  // const where = { deletedAt: null, sessionId: id, id: Number(order_id) };
  // const result = await Order.getById(where);

  const hubon = await authenticateUser({
    sessionId: id,
    apiUrl: HUBON_API_URL,
    clientId: HUBON_CLIENT_ID,
  });

  if (!hubon) return redirect("/app/hubon");

  const { user } = hubon;
  if (!user) return redirect("/app/hubon");

  const formData = await request.formData();
  const data: ParamsCreateTransport = {} as ParamsCreateTransport;
  data.payer_type = formData.get("payer_type")?.toString() || "";
  data.recipient_phone_number =
    formData.get("recipient_phone_number")?.toString() || "";
  data.recipient_name = formData.get("recipient_name")?.toString() || "";
  data.destination_hub_id = Number(formData.get("destination_hub_id"));
  data.quantity = Number(formData.get("quantity"));
  data.category_id = Number(formData.get("category_id"));
  data.hub_storage_type_id = Number(formData.get("hub_storage_type_id"));
  data.pickup_date = formData.get("pickup_date")?.toString() || "";
  data.sender_memo = formData.get("sender_memo")?.toString() || "";

  const orderId = formData.get("order_id")?.toString() || ""; // shopify order id

  const validate = validateTransport(data);
  console.log("VALIDATE", validate);

  if (validate) return json({ errors: validate });

  console.log("ORDER SHOPIFY ID", orderId);

  const payload: ParamProps = {
    params: data,
    apiUrl: HUBON_API_URL,
    clientId: HUBON_CLIENT_ID,
    apiKey: user.apiKey,
  };

  console.log("DATA", data);

  const createTransport = await createTrasportApi(payload);
  console.log("CREATE TRANSPORT", createTransport);
  if (createTransport.transport.id) {
    const updateOrder = await Order.createOrUpdate({
      id: order_id,
      sessionId: id,
      payload: JSON.stringify(data),
      status: "SUCCESS",
      orderId: orderId,
      updatedAt: new Date(),
      deletedAt: new Date(),
    });
    if (updateOrder.id) return redirect("/app/failed");
  } else {
    const errors = createTransport.errors;
    return json({ errors });
  }

  return json({
    errors: {
      error: true,
      error_message: "An error occurred while updating the order",
    },
  });
}

export default function FailedPage() {
  const shopify = useAppBridge();
  const { initial_value, result } = useLoaderData<{
    initial_value: FailedOrderProps;
    result: OrderProps;
    setting: Setting;
  }>();
  const actionData = useActionData<{ errors?: ErrorDetails }>();
  const { payload: pay, response, setting } = initial_value;
  const { Form, state, data, formMethod, load } = useFetcher<{
    hubs: HubProps[];
    errors?: ErrorDetails;
  }>();
  const fetcher = useFetcher<{ settings: HubDetails }>();
  const [options, setOptions] = useState<HubProps[]>([]);
  const [disabledDate, setDisableDate] = useState<Date[]>([]);

  const isLoading =
    ["loading", "submitting"].includes(state) && formMethod === "POST";

  const [payload, setPayload] = useState<TransportFormProps>(pay);

  const errors = actionData?.errors || data?.errors;

  useEffect(() => {
    if (errors) {
      if (!errors?.error) {
        shopify.toast.show(errors?.error_message || "");
      }
      if (errors?.error && (errors?.error_message || errors.details.message)) {
        shopify.toast.show(
          errors?.error_message || errors.details.message || "",
          {
            isError: errors.error,
          },
        );
      }
    }
  }, [errors, shopify]);

  useEffect(() => {
    const urlSetting = `/api/settings?hubId=${payload?.destination_hub_id}&myshopifyDomain=${result?.sessionId}`;
    if (fetcher.state === "idle" && fetcher.data == null) {
      fetcher.load(urlSetting);
    }
    if (fetcher.data && fetcher.data.settings) {
      const relevantDates = getRelevantDates(fetcher.data.settings);
      setDisableDate(relevantDates);
    }
  }, [fetcher, payload, result]);

  useEffect(() => {
    const url = `/api/hubs?myshopifyDomain=${result?.sessionId}`;
    if (state === "idle" && data == null) load(url);
    if (data && data.hubs) setOptions(data.hubs);
  }, [load, payload, result, data, state]);

  const handleSearchHub = (value: string) => {
    const url = `/api/hubs?search=${value}&myshopifyDomain=${result?.sessionId}`;
    if (value.length > 3) {
      load(url);
    }
    setPayload({ ...payload, destination_hub_id: 0 });
  };

  // const handleDateChange = (value: string) => {
  //   console.log(`Date selected: ${value}`);
  // };

  const handleMonthChange = (month: number, year: number) => {
    if (fetcher.data && fetcher.data.settings) {
      const relevantDates = getRelevantDates(
        fetcher.data.settings,
        month + 1,
        year,
      );
      setDisableDate(relevantDates);
    }
  };

  const handleSelectHub = (selected: string) => {
    setPayload({
      ...payload,
      destination_hub_id: Number(selected),
      pickup_date: "",
    });
    const url = `/api/settings?hubId=${selected}&myshopifyDomain=${result?.sessionId}`;
    fetcher.load(url);
  };

  const [showBanner, setShowBanner] = useState<boolean>(true);
  const handleBanner = () => setShowBanner(!showBanner);

  return (
    <Page
      title={`Order #${result?.orderId}`}
      backAction={{
        url: "/app/failed",
        content: "Orders",
      }}
    >
      {showBanner && (
        <>
          <Banner title="Order failed" onDismiss={handleBanner}>
            <List>
              <List.Item>{response.details.message}</List.Item>
            </List>
          </Banner>
          <hr className="my-4" />
        </>
      )}
      <Card>
        <Form
          action={`/app/failed/${result?.id}`}
          method="post"
          className="space-y-4"
        >
          <FormLayout.Group condensed>
            <TextField
              name="recipient_name"
              label="Recipient name"
              onChange={(e) => {
                setPayload({
                  ...payload,
                  recipient_name: e,
                });
              }}
              autoComplete="off"
              value={payload.recipient_name}
              placeholder="Input recipient name"
              error={errors && errors.error ? errors.errors.recipient_name : ""}
            />
            <TextField
              name="recipient_phone_number"
              label="Recipient phone number"
              onChange={(e) => {
                setPayload({
                  ...payload,
                  recipient_phone_number: e,
                });
              }}
              autoComplete="off"
              placeholder="Input recipient phone number"
              value={payload.recipient_phone_number}
              error={
                errors && errors.error
                  ? errors.errors.recipient_phone_number
                  : ""
              }
            />
          </FormLayout.Group>
          <input
            type="text"
            name="order_id"
            defaultValue={result?.orderId}
            hidden
          />
          <input
            type="text"
            name="destination_hub_id"
            hidden
            defaultValue={payload.destination_hub_id}
          />
          <input
            type="text"
            name="category_id"
            hidden
            defaultValue={setting.default_category.id}
          />
          <input
            type="text"
            name="hub_storage_type_id"
            hidden
            defaultValue={setting.default_storage_type.id}
          />
          <input
            type="text"
            name="payer_type"
            hidden
            defaultValue={payload.payer_type}
          />
          <input
            type="text"
            name="quantity"
            hidden
            defaultValue={payload.quantity}
          />
          <FormLayout.Group condensed>
            <AutocompleteComponent
              options={options.map((hub) => ({
                value: hub.id.toString(),
                label: hub.name,
                data: hub,
              }))}
              label="Select a Hub"
              selectedValue={payload.destination_hub_id.toString()}
              onSelect={handleSelectHub}
              onSearch={handleSearchHub}
              loading={!data}
              labelRenderer={(option) => (
                <div>
                  <strong>{option.label}</strong>
                  <br />
                  <small>{option.data.address.full_address}</small>
                </div>
              )}
              error={
                errors && errors.error ? errors.errors.destination_hub_id : ""
              }
            />
            <DatePickerInput
              label="Select a date"
              name="pickup_date"
              initialValue={payload.pickup_date}
              // onChange={handleDateChange}
              disableDatesBefore={new Date()}
              disableSpecificDates={disabledDate}
              onMonthChange={handleMonthChange}
              loading={!fetcher.data}
              error={errors && errors.error ? errors.errors.pickup_date : ""}
            />
          </FormLayout.Group>
          <TextField
            name="sender_memo"
            label="Note"
            multiline={4}
            onChange={() => {}}
            autoComplete="off"
            placeholder="Input note"
            helpText="Please use a semicolon (;) to indicate a new line."
            value={payload.sender_memo}
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
    </Page>
  );
}
