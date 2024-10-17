import { Autocomplete, Icon } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import type { HubProps } from "~/types/transport.type";

interface Option {
  value: string;
  label: string;
  data: HubProps; // Contains additional hub data
}

interface AutocompleteComponentProps {
  options: Option[]; // List of available options
  label: string; // Label for the input field
  placeholder?: string; // Placeholder text for the input field
  selectedValue?: string; // The selected option value
  onSelect: (selected: string) => void; // Callback when an option is selected
  onSearch?: (query: string) => void; // Callback for handling search input
  labelRenderer?: (option: Option) => React.ReactNode; // Custom label rendering
  loading?: boolean;
  name?: string;
}

const AutocompleteComponent: React.FC<AutocompleteComponentProps> = ({
  options, // Now dynamically updated from props
  label,
  placeholder = "Search...",
  selectedValue = "",
  onSelect,
  onSearch, // Search callback
  labelRenderer, // Custom renderer for label display
  loading = false,
  name,
}) => {
  const [inputValue, setInputValue] = useState<string>(selectedValue);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);

  // Find the selected option to display its label in the input field
  const selectedLabel = useMemo(() => {
    const selectedOption = options.find(
      (option) => option.value === selectedValue,
    );
    return selectedOption ? selectedOption.label : "";
  }, [options, selectedValue]);

  // Update input field and trigger external search if provided
  const updateText = useCallback(
    (value: string) => {
      setInputValue(value);

      // Trigger onSearch callback for parent to handle search logic
      if (onSearch) {
        onSearch(value); // Parent component will pass updated options via props
      } else {
        // Filter locally if no onSearch handler is provided
        if (value === "") {
          setFilteredOptions(options);
          return;
        }

        const filterRegex = new RegExp(value, "i");
        const resultOptions = options.filter((option) =>
          option.label.match(filterRegex),
        );
        setFilteredOptions(resultOptions);
      }
    },
    [onSearch, options],
  );

  // Handle option selection
  const updateSelection = useCallback(
    (selected: string[]) => {
      const selectedOption = options.find(
        (option) => option.value === selected[0],
      );
      if (selectedOption) {
        setInputValue(selectedOption.label);
        onSelect(selectedOption.value); // Notify parent component
      }
    },
    [options, onSelect],
  );

  // Sync controlled value with local state and show the selected option's label
  useEffect(() => {
    setInputValue(selectedLabel); // Set input value to the selected label
  }, [selectedLabel]);

  // Sync filteredOptions with new options prop when it changes
  useEffect(() => {
    setFilteredOptions(options); // Update displayed options when options prop changes
  }, [options]);

  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      label={label}
      value={inputValue}
      prefix={<Icon source={SearchIcon} />}
      placeholder={placeholder}
      autoComplete="off"
      loading={loading}
      name={name}
    />
  );

  return (
    <Autocomplete
      options={filteredOptions.map((option) => ({
        value: option.value,
        label: labelRenderer ? labelRenderer(option) : option.label, // Custom or default label
      }))}
      selected={[selectedValue]}
      onSelect={updateSelection}
      textField={textField}
      loading={loading}
    />
  );
};

export default AutocompleteComponent;
