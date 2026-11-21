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

export function getQueryFormHref(
  pathname: string,
  entries: Iterable<[string, string]>,
) {
  const params = new URLSearchParams();
  for (const [name, value] of entries) {
    if (value) params.append(name, value);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getClearFiltersHref(
  pathname: string,
  search: string,
  fieldNames: string[],
) {
  const params = new URLSearchParams(search);
  for (const name of fieldNames) params.delete(name);
  params.delete("page");
  params.delete("taskPage");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
