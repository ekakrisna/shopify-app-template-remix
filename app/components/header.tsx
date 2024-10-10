import { useLocation, useNavigate } from "@remix-run/react";
import { Tabs } from "@shopify/polaris";
import { useCallback, useMemo } from "react";

const Header = () => {
  const tabs = useMemo(
    () => [
      { id: "home", content: "Home", url: "/app" },
      { id: "guides", content: "Guides", url: "/app/guides" },
      { id: "faq", content: "FAQ", url: "/app/faq" },
      { id: "settings", content: "Settings", url: "/app/settings" },
      // { id: "changeAccount", content: "Change Account", url: "/app/hubon" },
    ],
    [],
  );

  const navigate = useNavigate();
  const location = useLocation();

  const selectedIndex = tabs.findIndex((tab) => {
    const match = location.pathname.match(/^\/[^/]+\/[^/]+/);
    const baseUrl = match ? match[0] : null;
    return baseUrl === tab.url;
  });

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => {
      const url = tabs[selectedTabIndex].url;
      navigate(url);
    },
    [navigate, tabs],
  );

  return (
    <Tabs
      tabs={tabs.map((tab) => ({ id: tab.id, content: tab.content }))}
      selected={selectedIndex > -1 ? selectedIndex : 0}
      onSelect={handleTabChange}
    />
  );
};

export default Header;
