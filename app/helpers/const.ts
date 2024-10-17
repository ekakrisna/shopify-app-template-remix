import type { ErrorDetails } from "~/types/user.type";

export const MEDIA_SRC =
  "https://dev-hubon.s3.us-east-2.amazonaws.com/static/Local.png";
export const DESCRIPTION =
  "HubOn stands out by offering eco-friendly hub-to-hub transport and empowering local makers to grow their businesses while reducing their carbon footprint.";
export const errors: ErrorDetails = {
  error: false,
  details: {
    name: "",
    message: "",
  },
  error_message: "",
  metadata: null,
  errors: {},
};
