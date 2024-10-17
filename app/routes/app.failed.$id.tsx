import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
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
import { User } from "~/models/hubon.server";
import { authenticateUser } from "~/helpers/authentication";
import { useEffect, useState } from "react";
import { Order, type OrderProps } from "~/models/order.server";
import DatePickerInput from "~/components/datepicker";
import AutocompleteComponent from "~/components/autocomplete";
import type {
  FailedOrderProps,
  HubDetails,
  HubProps,
  ResponseProps,
  TransportFormProps,
} from "~/types/transport.type";
import type { Setting } from "~/types/user.type";
import { getRelevantDates } from "~/helpers/date";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const HUBON_CLIENT_ID = String(process.env.HUBON_CLIENT_ID);
  const HUBON_API_URL = String(process.env.HUBON_API_URL);
  const { session, redirect } = await authenticate.admin(request);
  const { id } = session;

  const user = await User.getByid(id);
  const hubon = await authenticateUser({
    sessionId: id,
    apiUrl: HUBON_API_URL,
    clientId: HUBON_CLIENT_ID,
  });
  if (!user || !hubon?.registered_customer) return redirect("/app/hubon");

  const order_id = params.id;
  const where = { deletedAt: null, sessionId: id, id: Number(order_id) };
  const result = await Order.getById(where);

  let data: FailedOrderProps = {
    payload: {} as TransportFormProps,
    response: {} as ResponseProps,
    setting: {} as Setting,
  };

  if (result) {
    const hubonUser = hubon.registered_customer;
    const setting = hubonUser.setting;
    const payload = result.payload ? JSON.parse(result.payload) : {};
    const response = result.response ? JSON.parse(result.response) : {};
    data = { payload, response, setting };
  }

  return json({ initial_value: data, result });
};

export async function action({ request }: ActionFunctionArgs) {
  const { redirect, session } = await authenticate.admin(request);
  const { id } = session;
  const formData = await request.formData();
  console.log(formData);
  // const isButtonBuy = formData.get("isButtonBuy") === "true" ? true : false;
  // const createGuide = await Guide.createOrUpdate({
  //   sessionId: id,
  //   isButtonBuy: isButtonBuy,
  // });
  // if (createGuide?.id) return redirect("/app/guides");
  return json({
    errors: {
      error: true,
      error_message: "An error occurred while updating the guide",
    },
  });
}

export default function FailedPage() {
  const { initial_value, result } = useLoaderData<{
    initial_value: FailedOrderProps;
    result: OrderProps;
    setting: Setting;
  }>();
  const { payload: pay, response, setting } = initial_value;
  const { Form, state, data, load } = useFetcher<{ hubs: HubProps[] }>();
  const fetcher = useFetcher<{ settings: HubDetails }>();
  const [options, setOptions] = useState<HubProps[]>([]);
  const [disabledDate, setDisableDate] = useState<Date[]>([]);
  const [payload, setPayload] = useState<TransportFormProps>(pay);

  const handleSearchHub = (value: string) => {
    const url = `/api/hubs?search=${value}&myshopifyDomain=${result?.sessionId}`;
    if (value.length > 3) {
      load(url);
    }
  };

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

  const handleDateChange = (value: string) => {
    console.log(`Date selected: ${value}`);
  };

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
    setPayload({ ...payload, destination_hub_id: Number(selected) });
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
            />
          </FormLayout.Group>
          <input
            type="text"
            name="destination_hub_id"
            hidden
            value={payload.destination_hub_id}
          />
          <input
            type="text"
            name="category_id"
            hidden
            value={setting.default_category.id}
          />
          <input
            type="text"
            name="hub_storage_type_id"
            hidden
            value={setting.default_storage_type.id}
          />
          <input
            type="text"
            name="payer_type"
            hidden
            value={payload.payer_type}
          />
          <input type="text" name="quantity" hidden value={payload.quantity} />
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
            />
            <DatePickerInput
              label="Select a date"
              name="pickup_date"
              initialValue={payload.pickup_date}
              onChange={handleDateChange}
              disableDatesBefore={new Date()}
              disableSpecificDates={disabledDate}
              onMonthChange={handleMonthChange}
              loading={!fetcher.data}
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
              // loading={isLoading}
              // disabled={isLoading}
            >
              Submit
            </Button>
          </div>
        </Form>
      </Card>
      {/* </div> */}
    </Page>
  );
}
