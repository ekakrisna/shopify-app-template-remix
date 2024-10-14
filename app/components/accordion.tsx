import React, { useState, useCallback } from "react";
import { Collapsible, Card } from "@shopify/polaris";
import { CaretUpIcon, CaretDownIcon } from "@shopify/polaris-icons";

const Accordion = ({
  id,
  title,
  content,
}: {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  const handleToggle = useCallback(() => setOpen((open) => !open), []);

  return (
    <Card>
      <div
        className="flex items-center justify-between"
        onClick={handleToggle}
        style={{ cursor: "pointer" }}
      >
        {title}
        {open ? (
          <CaretUpIcon width={16} height={16} className="ml-2" />
        ) : (
          <CaretDownIcon width={16} height={16} className="ml-2" />
        )}
      </div>
      <Collapsible
        open={open}
        id={id}
        transition={{ duration: "500ms", timingFunction: "ease-in-out" }}
        expandOnPrint
      >
        <div className="mt-4">{content}</div>
      </Collapsible>
    </Card>
  );
};

export default Accordion;
