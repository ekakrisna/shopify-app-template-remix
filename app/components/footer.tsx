import { Link } from "@remix-run/react";
import { Text } from "@shopify/polaris";

function Footer({ hubon_web_url }: { hubon_web_url: string }) {
  return (
    <footer className="w-full p-4 bg-white border-t border-gray-300 md:p-6">
      <Text variant="headingMd" fontWeight="regular" as="h3" alignment="center">
        If you have any issues or questions please contact us at&nbsp;
        <Link to={hubon_web_url} target="_blank" className="hover:underline">
          <strong>@letshubon</strong>
        </Link>
        . We'll setup the app for you.
      </Text>
    </footer>
  );
}

export default Footer;
