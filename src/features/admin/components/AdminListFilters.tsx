import { Button } from "./ui/Button";
import AdminQueryForm from "./AdminQueryForm";
import ClearAdminFiltersButton from "./ClearAdminFiltersButton";
import {
  getActiveFilters,
  type AdminFilterField,
} from "@/features/admin/services/admin-list-filters";

export default function AdminListFilters({
  fields,
  preserve = {},
}: {
  fields: AdminFilterField[];
  preserve?: Record<string, string>;
}) {
  const fieldNames = new Set(fields.map((field) => field.name));
  const activeFilters = getActiveFilters(fields);

  return (
    <div className="flex flex-col items-end gap-2">
      <AdminQueryForm
        key={fields.map((field) => `${field.name}:${field.value}`).join("|")}
        className="flex flex-wrap items-end justify-end gap-3"
      >
        {Object.entries(preserve).map(([name, value]) =>
          value && !fieldNames.has(name) ? (
            <input key={name} type="hidden" name={name} value={value} />
          ) : null,
        )}
        {fields.map((field) => (
          <label key={field.name} className="flex flex-col text-sm font-medium">
            <span className="sr-only">{field.label}</span>
            <select
              key={`${field.name}:${field.value}`}
              name={field.name}
              aria-label={field.label}
              defaultValue={field.value}
              className="min-h-10 cursor-pointer rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]"
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
      </AdminQueryForm>
      {activeFilters.length > 0 && (
        <div
          role="status"
          aria-label="Active filters"
          className="flex flex-wrap items-center justify-end gap-2"
        >
          <span className="text-xs font-medium text-black/55">
            Active filters:
          </span>
          {activeFilters.map((field) => (
            <span
              key={field.name}
              className="rounded-full border border-[#602329]/20 bg-[#602329]/5 px-2.5 py-1 text-xs font-medium text-[#602329]"
            >
              {field.label}:{" "}
              {field.options.find((option) => option.value === field.value)
                ?.label ?? field.value}
            </span>
          ))}
          <ClearAdminFiltersButton fieldNames={fields.map((field) => field.name)} />
        </div>
      )}
    </div>
  );
}
