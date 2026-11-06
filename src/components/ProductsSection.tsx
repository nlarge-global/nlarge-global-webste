import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

const products = [
  {
    name: "Pravli",
    category: "Restaurant management",
    description: "A connected system for orders, tables, billing, inventory and day-to-day restaurant operations.",
    detail: "Operations · POS · Reporting · Inventory · Analytics · Dashboard",
  },
  {
    name: "School digital platform",
    category: "Education website",
    description: "A complete school website for admissions, notices, programs, staff and parent communication.",
    detail: "Admissions · Gallery · Announcements · Staff · Admin Dashboard · Email Notifications",
  },
  {
    name: "VendFlow",
    category: "Vending machine software",
    description: "A centralized platform for machines, inventory, payments, maintenance alerts and sales insights.",
    detail: "Machines · Payments · Analytics · Maintenance · Sales Insights",
  },
];

export default function ProductsSection() {
  return (
    <main>
      <section className="px-4 pb-8 pt-28 sm:px-8 sm:pt-32 lg:px-12 lg:pb-12">
        <div className="grid min-h-[calc(100svh-10rem)] overflow-hidden rounded-[1.75rem] bg-[#602329] lg:grid-cols-[0.72fr_1.28fr]">
          <div className="flex flex-col justify-between px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Software made by NLarge</p>
            <div>
              <h1 className="max-w-[7ch] text-[clamp(4rem,9vw,8rem)] leading-[0.84] tracking-[-0.055em] mt-6">Useful products, built to stay useful.</h1>
              <p className="mt-7 max-w-md text-lg leading-8 text-white/70">
                Practical software shaped around real work, not feature lists.
              </p>
            </div>
            <p className="mt-10 text-sm font-semibold">Products</p>
          </div>

          <div className="flex items-center bg-[#e8e4dc] p-5 sm:p-8 lg:p-12">
            <div className="grid w-full gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">Selected solutions</p>
              {products.map((product, index) => (
                <article key={product.name} className="rounded-[1.25rem] border border-black/10 bg-white p-5 shadow-[0_16px_45px_rgba(0,0,0,0.08)] sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#602329]">{product.category}</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{product.name}</h2>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f1efea] text-sm">0{index + 1}</span>
                  </div>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-black/60 sm:text-base">{product.description}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-4">
                    <span className="text-xs text-black/45">{product.detail}</span>
                    <Link href="/contact" className="group inline-flex items-center gap-2 text-sm font-semibold text-[#602329]">
                      Contact for more information
                      <FiArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
