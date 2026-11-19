import { Button } from "./ui/Button";

type FilterOption = {
  value: string;
  label: string;
};

type FilterField = {
  name: string;
  label: string;
  value: string;
  options: FilterOption[];
};

export default function AdminListFilters({
  fields,
  preserve = {},
}: {
  fields: FilterField[];
  preserve?: Record<string, string>;
}) {
  const fieldNames = new Set(fields.map((field) => field.name));

  return (
    <form
      method="get"
      className="flex flex-wrap items-end justify-end gap-3"
    >
      {Object.entries(preserve).map(([name, value]) =>
        value && !fieldNames.has(name) ? (
          <input key={name} type="hidden" name={name} value={value} />
        ) : null,
      )}
      {fields.map((field) => (
        <label key={field.name} className="text-sm font-medium flex flex-col ">
          <select
            name={field.name}
            defaultValue={field.value}
            className="min-h-10 rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329] cursor-pointer "
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <Button type="submit">Apply</Button>
    </form>
  );
}
