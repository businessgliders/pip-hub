// Shared field-type metadata for the Forms builder.
export const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkboxes" },
];

export const FIELD_TYPE_LABEL = FIELD_TYPES.reduce((m, t) => {
  m[t.value] = t.label;
  return m;
}, {});

export const hasOptions = (type) => type === "select" || type === "checkbox";