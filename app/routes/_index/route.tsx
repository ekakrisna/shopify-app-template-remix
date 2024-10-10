import type {
  LoaderFunctionArgs,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
// import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

// import styles from "./styles.module.css";

import stylesheet from "../../tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: "/favicon/apple-touch-icon.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon/favicon-16x16.png",
  },
  {
    rel: "icon",
    type: "image/x-icon",
    href: "/favicon/favicon.ico",
  },
];

export const meta: MetaFunction = () => [{ title: "HubOn Local Pickup" }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return json({ showForm: Boolean(login) });
};

export default function App() {
  // const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className="h-screen max-w-lg pt-20 mx-auto">
      {/* <div className=""> */}
      <div className="border border-t-4 border-gray-400 rounded shadow border-t-red-700">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-center">
            We're sorry, but something went wrong.
          </h1>
        </div>
        <hr className="border-gray-400" />
        <div className="p-4">
          <p className="font-semibold text-center">
            If you are the application owner check the logs for more
            information.
          </p>
        </div>
      </div>
    </div>
    // <div className={styles.index}>
    //   <div className={styles.content}>
    //     <h1 className={styles.heading}>A short heading about [your app]</h1>
    //     <p className={styles.text}>
    //       A tagline about [your app] that describes your value proposition.
    //     </p>
    //     {showForm && (
    //       <Form className={styles.form} method="post" action="/auth/login">
    //         <label className={styles.label}>
    //           <span>Shop domain</span>
    //           <input className={styles.input} type="text" name="shop" />
    //           <span>e.g: my-shop-domain.myshopify.com</span>
    //         </label>
    //         <button className={styles.button} type="submit">
    //           Log in
    //         </button>
    //       </Form>
    //     )}
    //     <ul className={styles.list}>
    //       <li>
    //         <strong>Product feature</strong>. Some detail about your feature and
    //         its benefit to your customer.
    //       </li>
    //       <li>
    //         <strong>Product feature</strong>. Some detail about your feature and
    //         its benefit to your customer.
    //       </li>
    //       <li>
    //         <strong>Product feature</strong>. Some detail about your feature and
    //         its benefit to your customer.
    //       </li>
    //     </ul>
    //   </div>
    // </div>
  );
}
