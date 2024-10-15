import { useLocation, useNavigate } from "@remix-run/react";
import { Tabs } from "@shopify/polaris";
import { useCallback } from "react";

export interface TabProps {
  id: string;
  content: string;
  url: string;
}

export interface HeaderProps {
  tabs: TabProps[];
}

const Header = ({ tabs }: HeaderProps): JSX.Element => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const selectedIndex = tabs.findIndex((tab) => {
    const match = pathname.match(/^\/[^/]+\/[^/]+/);
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
