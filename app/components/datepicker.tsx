import React, { useState, useCallback, useEffect, useRef } from "react";
import { Popover, TextField, Icon, DatePicker, Card } from "@shopify/polaris";
import { CalendarIcon } from "@shopify/polaris-icons";
import { formatDate } from "date-fns";
import { formatDate as isValid } from "~/helpers/shopify";

interface DatePickerInputProps {
  label?: string;
  name?: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disableDatesAfter?: Date;
  disableDatesBefore?: Date;
  disableSpecificDates?: Date[];
  onMonthChange?: (month: number, year: number) => void;
  loading?: boolean;
  error?: string;
}

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label = "Start date",
  name = "date",
  initialValue,
  onChange,
  placeholder = "Select a date",
  disableDatesAfter,
  disableDatesBefore,
  disableSpecificDates,
  onMonthChange,
  loading = false,
  error,
}) => {
  // console.log("DISABLESPECIFICDATES", disableSpecificDates);
  // const [disabledDates, setDisableDates] = useState<Date[] | undefined>(
  //   disableSpecificDates,
  // );

  const [visible, setVisible] = useState(false);
  const initialDate = initialValue
    ? isValid(initialValue)
      ? new Date(initialValue)
      : undefined
    : undefined;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate,
  );
  const [{ month, year }, setDate] = useState({
    month: selectedDate ? selectedDate.getMonth() : new Date().getMonth(),
    year: selectedDate ? selectedDate.getFullYear() : new Date().getFullYear(),
  });
  const formattedValue = selectedDate
    ? formatDate(selectedDate, "yyyy-MM-dd")
    : selectedDate;
  const datePickerRef = useRef<HTMLDivElement | null>(null);

  const nodeContainsDescendant = (
    rootNode: Node | null,
    descendant: Node | null,
  ): boolean => {
    if (!rootNode || !descendant) return false;
    if (rootNode === descendant) return true;
    let parent = descendant.parentNode;
    while (parent) {
      if (parent === rootNode) return true;
      parent = parent.parentNode;
    }
    return false;
  };

  const isNodeWithinPopover = (node: Node | null): boolean => {
    return datePickerRef.current
      ? nodeContainsDescendant(datePickerRef.current, node)
      : false;
  };

  const handleOnClose = (event: React.FocusEvent) => {
    if (!isNodeWithinPopover(event.relatedTarget as Node)) {
      setVisible(false);
    }
  };

  const handleMonthChange = useCallback(
    (month: number, year: number) => {
      setDate({ month, year });
      if (onMonthChange) onMonthChange(month, year);
    },
    [onMonthChange],
  );

  const handleDateSelection = useCallback(
    ({ end: newSelectedDate }: { end: Date }) => {
      setSelectedDate(newSelectedDate);
      setVisible(false);
      if (onChange) {
        onChange(formatDate(newSelectedDate, "yyyy-MM-dd"));
      }
    },
    [onChange],
  );

  useEffect(() => {
    if (selectedDate) {
      setDate({
        month: selectedDate.getMonth(),
        year: selectedDate.getFullYear(),
      });
    }
  }, [selectedDate]);

  // useEffect(() => {
  //   if (!disableSpecificDates) return;
  //   setDisableDates(disableSpecificDates);
  // }, [disableSpecificDates]);

  return (
    <Popover
      active={visible}
      autofocusTarget="none"
      preferredAlignment="left"
      fullWidth
      preferInputActivator={false}
      preferredPosition="below"
      preventCloseOnChildOverlayClick
      onClose={() => handleOnClose}
      zIndexOverride={4000}
      activator={
        <TextField
          loading={loading}
          role="combobox"
          label={label}
          prefix={<Icon source={CalendarIcon} />}
          value={formattedValue}
          onFocus={() => setVisible(true)}
          placeholder={placeholder}
          autoComplete="off"
          name={name}
          error={error}
        />
      }
    >
      <Card>
        <div ref={datePickerRef}>
          <DatePicker
            month={month}
            year={year}
            selected={selectedDate}
            onMonthChange={handleMonthChange}
            onChange={handleDateSelection}
            disableDatesAfter={disableDatesAfter}
            disableDatesBefore={disableDatesBefore}
            disableSpecificDates={disableSpecificDates}
          />
        </div>
      </Card>
    </Popover>
  );
};

export default DatePickerInput;
