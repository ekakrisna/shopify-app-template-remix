import { Link } from "@remix-run/react";
import { Badge, Text } from "@shopify/polaris";
import {
  AlertCircleIcon,
  CalendarIcon,
  ClockIcon,
  PersonIcon,
  PhoneIcon,
} from "@shopify/polaris-icons";
import {
  extractValueAfterOrderId,
  formatDate,
  formatTimeTo12HourFormat,
  replaceSemicolonsWithBreaks,
  stripHtmlTags,
} from "~/helpers/shopify";
import type { TransportProps } from "~/types/transport.type";

// const getStatusColor = (status: string) => {
//   const green = [
//     "paid",
//     "ready_to_transport",
//     "in_transit",
//     "delivered",
//     "done",
//   ];

//   const gray = [
//     "pending",
//     "expired",
//     "cancelled",
//     "rejected",
//     "held",
//     "refunded",
//   ];

//   const warning = ["initiated"];

//   if (green.includes(status)) {
//     return "secondary";
//   } else if (gray.includes(status)) {
//     return "gray";
//   } else if (warning.includes(status)) {
//     return "warning";
//   } else {
//     return "default";
//   }
// };

const transportState = {
  initiated: "To Be Paid",
  paid: "To Be Dropped-off",
  ready_to_transport: "Dropped-off",
  in_transit: "In Transit",
  delivered: "Ready To Be Picked Up",
  done: "Done",
  rejected: "Rejected",
};

const TransportDetail: React.FC<{
  transport: TransportProps;
  orderUrl: string;
  hubOnUrl: string;
}> = ({ transport, hubOnUrl, orderUrl }) => {
  const handleState = (state: string): keyof typeof transportState => {
    if (state === "held") {
      const lastestState = transport.logs[transport.logs.length - 1];
      return lastestState.previous_state as keyof typeof transportState;
    } else {
      return state as keyof typeof transportState;
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-4 sm:justify-between justify-normal">
        <div className="pr-2">
          <Link
            to={`${hubOnUrl}/transports/${transport?.id}`}
            target="_blank"
            className="hover:no-underline underline"
          >
            <Text variant="headingMd" as="strong">
              Transport #{transport?.id}
            </Text>
          </Link>
        </div>
        <div className="px-2 font-semibold">
          <Link
            to={`${hubOnUrl}/transports/${transport?.id}`}
            target="_blank"
            className="hover:no-underline underline"
          >
            View transport detail
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge size="large" tone="warning">
          {transportState[handleState(transport.state)]}
        </Badge>

        {/* <Badge className={cn(badgeClass[color])}>
          {transportState[handleState(transport.state)]}
        </Badge> */}
        {transport?.hub_storage_type && (
          <Badge size="large">
            {/* {transport?.hub_storage_type?.icon_url && (
              <img
                className="object-cover w-6 h-6 mr-2"
                src={transport?.hub_storage_type?.icon_url}
                alt={transport?.hub_storage_type?.title}
              />
            )} */}
            {transport?.hub_storage_type?.title}
          </Badge>
        )}
        {transport?.category && (
          <Badge size="large">
            {/* {transport?.category?.icon_url && (
              <img
                className="object-cover w-6 h-6 mr-2"
                src={transport?.category?.icon_url}
                alt={transport?.category?.name}
              />
            )} */}
            {transport?.category?.name}
          </Badge>
        )}
      </div>
      <div className="mb-4">
        <Text variant="headingMd" as="strong">
          Order ID:{" "}
          <Link
            to={orderUrl}
            target="_blank"
            className="hover:no-underline underline"
          >
            {extractValueAfterOrderId(
              stripHtmlTags(transport?.sender_info?.memo),
            )}
          </Link>
        </Text>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Text variant="bodyLg" as="p">
            <strong>From:</strong> {transport.sender_info.name}
          </Text>
          <div className="flex items-center gap-1 mb-2">
            <div className="w-6">
              {/^\+\d/.test(transport.sender_info.data) ||
              /\d/.test(transport.sender_info.data) ? (
                <PhoneIcon width="24" />
              ) : (
                <PersonIcon width="24" />
              )}
            </div>
            <Text as="p" variant="bodyLg" truncate>
              {transport.sender_info.data}
            </Text>
          </div>
          <p className="text-base">
            {transport.sender_info.hub.name}
            <br />{" "}
            <small>{transport.sender_info.hub.address.full_address}</small>
          </p>
          {transport?.dropped_off_at && (
            <>
              <div className="flex items-center gap-1 mb-2">
                <div className="w-6">
                  <CalendarIcon width="24" />
                </div>
                <Text as="p" variant="bodyLg" fontWeight="semibold">
                  {formatDate(transport?.dropped_off_at)}
                </Text>
              </div>
              <div className="flex items-center gap-1 mb-2">
                <div className="w-6">
                  <ClockIcon width="24" />
                </div>
                <Text as="p" variant="bodyLg" fontWeight="semibold">
                  {formatTimeTo12HourFormat(transport?.dropped_off_at)}
                </Text>
              </div>
            </>
          )}
        </div>
        <div className="space-y-2">
          <Text variant="bodyLg" as="p">
            <strong>To:</strong> {transport.recipient_info.name}
          </Text>
          <div className="flex items-center gap-1 mb-2">
            <div className="w-6">
              {/^\+\d/.test(transport.recipient_info.data) ||
              /\d/.test(transport.recipient_info.data) ? (
                <PhoneIcon width="24" />
              ) : (
                <PersonIcon width="24" />
              )}
            </div>
            <Text as="p" variant="bodyLg" truncate>
              {transport.recipient_info.data}
            </Text>
          </div>
          <p className="text-base">
            {transport.recipient_info.hub.name}
            <br />{" "}
            <small>{transport.recipient_info.hub.address.full_address}</small>
          </p>
          {(transport?.pickup_date || transport?.eta) && (
            <ul>
              <li>
                <Text as="p" variant="headingMd" fontWeight="semibold">
                  ETA: {formatDate(transport?.pickup_date || transport?.eta)}
                </Text>
              </li>
              <li>
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-6">
                    <ClockIcon width="24" />
                  </div>
                  <Text as="p" variant="bodyLg" fontWeight="semibold">
                    {formatTimeTo12HourFormat(
                      transport?.pickup_date || transport?.eta,
                    )}{" "}
                  </Text>
                </div>
              </li>
            </ul>
          )}
        </div>
      </div>

      {transport?.sender_info?.memo && (
        <div className="py-3 col-12 order-lg-4">
          <Text as="p">
            <span className="text-base font-bold">Description:</span>
          </Text>

          <div
            dangerouslySetInnerHTML={{
              __html: replaceSemicolonsWithBreaks(transport?.sender_info?.memo),
            }}
          />
        </div>
      )}

      {(!transport?.pickup_date || !transport?.eta) && (
        <div className="col-12 order-lg-4">
          <small className="flex items-center gap-1">
            <div className="w-6">
              <AlertCircleIcon width="24" />
            </div>
            The ETA will be 1-2 business days after the sender drop-off the
            package
          </small>
        </div>
      )}
    </div>
  );
};

export default TransportDetail;
