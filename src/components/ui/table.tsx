import { cn } from "@/lib/cn";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return <div className="relative w-full overflow-x-auto"><table className={cn("w-full caption-bottom text-sm", className)} {...props} /></div>;
}
export function TableHeader(props: React.ComponentProps<"thead">) { return <thead className="[&_tr]:border-b [&_tr]:border-black/10" {...props} />; }
export function TableBody(props: React.ComponentProps<"tbody">) { return <tbody className="[&_tr:last-child]:border-0" {...props} />; }
export function TableRow({ className, ...props }: React.ComponentProps<"tr">) { return <tr className={cn("border-b border-black/10 transition-colors hover:bg-[#faf2ec]", className)} {...props} />; }
export function TableHead({ className, ...props }: React.ComponentProps<"th">) { return <th className={cn("h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.12em] text-black/45", className)} {...props} />; }
export function TableCell({ className, ...props }: React.ComponentProps<"td">) { return <td className={cn("p-4 align-middle", className)} {...props} />; }
