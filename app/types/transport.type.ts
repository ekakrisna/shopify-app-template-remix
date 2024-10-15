export interface GetTransportApiParams {
  filter: Filter;
  apiKey: string;
  apiUrl: string;
  clientId: string;
}

export interface Filter {
  page: number | string;
  page_size: number | string;
  filter: {
    states: string[];
  };
  sort_by: string;
}

export type FilterState = {
  page: number;
  page_size: number;
  filter: { states: string[] };
  sort_by: string;
};

export type AddressProps = {
  id: number;
  latitude: string | number;
  longitude: string | number;
  city: string;
  province_code: string;
  country_code: string;
  zipcode: string;
  full_address: string;
};

export type HubHourProps = {
  id: number;
  day: string;
  open_hour: string;
  close_hour: string;
  hub_break_hour: HubBreakHour | null;
};

export type HubBreakHour = {
  id: number;
  start_hour: string;
  end_hour: string;
};

export type HubProps = {
  id: number;
  name: string;
  status: string;
  contact: string;
  is_warehouse: boolean | string;
  warehouse_id: number;
  image_url: string | null;
  address: AddressProps;
  latitude?: string | number;
  longitude?: string | number;
  category_ids?: number[];
  hub_group_ids?: string[];
  hub_groups: Array<HubGroupProp>;
  categories: Array<CategoryProps>;
  hub_hours: Array<HubHourProps>;
  holiday_infos: Array<HolidayInfoProp>;
  coupons: Array<CouponProps>;
  storages: Array<StorageProps>;
};

export type StorageProps = {
  key?: number;
  id: number;
  hub_storage_type_id: number;
  capacity: number;
  title: string;
  price: string;
  type?: StorageProps;
  note: string | null;
  order: number;
  icon_url: string;
  delete_id?: number;
};

export type CouponProps = {
  id: number;
  title: string;
  type: string;
  code: string;
  value: string | null;
  quantity: number;
  image_url: string;
  expired_at: string;
  delete_id?: number | string;
};

export type HolidayInfoProp = {
  key?: number | string;
  id: number;
  date: string;
  note: string | null;
  delete_id?: number | string;
};

export type HubGroupProp = {
  id: number;
  name: string;
  delivery_days: string[] | string;
  hub_sequences?: HubSequencesProps[];
  hub_ids?: string[];
  hub_id?: string;
  delete_id?: number;
  hub_group_id?: number;
};
export type HubSequencesProps = {
  id: number;
  name: string;
  status: string;
  total_transports: number;
  transport_count: {
    paid: number;
    ready_to_transport: number;
    in_transit: number;
    delivered: number;
  };
};

export type MetaResponse = {
  current_page: number;
  next_page: number;
  prev_page: number;
  total_pages: number;
  total_items: string;
  page_size: number;
};

export interface TransportResponse {
  transports: TransportProps[];
  transport: TransportProps;
  meta: MetaResponse;
}

export type Dimension = {
  width: number;
  height: number;
  length: number;
};

export type TransportProps = {
  id: number | string;
  initiator_type: string;
  payer_type: string;
  state: string;
  from_state?: string;
  to_state?: string;
  quantity: number;
  dropped_off_at: string;
  eta: string;
  pickup_date: string;
  fee: string;
  miles_saved: number;
  exceed_origin_hub_storage_limit: boolean;
  exceed_destination_hub_storage_limit: boolean;
  is_tracking_visible: boolean;
  volume: number;
  dimensions: Dimension[];
  driver_note: string;
  category: CategoryProps;
  hub_storage_type: StorageProps;
  transport_images: TransportImage[];
  logs: Log[];
  sender_info: Info;
  recipient_info: Info;
  payment: Payment;
  metadata?: {
    current_customer_type: string;
  };
  note?: string;
  other_category?: string | null;
};

export type Log = {
  id: number;
  customer_id: number | null;
  admin_id: number | null;
  previous_state: string | null;
  new_state: string;
  created_at: string;
};

export type TransportImage = {
  id: number;
  state: string;
  image_url: string;
};

export type Payment = {
  id: string;
  amount: string;
  tip: string;
  status: string;
  note: string;
  stripe_client_secret: string;
  free_transport_credit: number;
};

export type Info = {
  id: number;
  name: string;
  data: string;
  memo: string;
  images: Record<string, string>[];
  hub: HubProps;
};

export type CategoryProps = {
  id: number;
  name: string;
  order: string;
  icon_url: string | null;
  is_tracking_visible: string;
  delete_id?: string;
};
