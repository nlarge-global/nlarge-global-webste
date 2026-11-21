export type AdminFilterOption = {
  value: string;
  label: string;
};

export type AdminFilterField = {
  name: string;
  label: string;
  value: string;
  options: AdminFilterOption[];
};

export function getActiveFilters(fields: AdminFilterField[]) {
  return fields.filter((field) => field.value !== field.options[0]?.value);
}

export function getClearFiltersHref(currentUrl: string, fieldNames: string[]) {
  const url = new URL(currentUrl);
  for (const name of fieldNames) url.searchParams.delete(name);
  url.searchParams.delete("page");
  url.searchParams.delete("taskPage");
  return `${url.pathname}${url.search}${url.hash}`;
}
