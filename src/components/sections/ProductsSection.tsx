import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import products from "@/content/products.json";

export default function ProductsSection() {
  return (
    <main>
      <section className="px-4 pb-8 pt-28 sm:px-8 sm:pt-32 lg:px-12 lg:pb-12">
        <div className="grid min-h-[calc(100svh-10rem)] overflow-hidden rounded-[1.75rem] bg-[#602329] lg:grid-cols-[0.72fr_1.28fr]">
          <div className="flex flex-col justify-between px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
              Software made by NLarge
            </p>
            <div>
              <h1 className="text-[clamp(4rem,12vw,6.2rem)] leading-[0.84] tracking-[-0.055em] mt-6">
                Ready-made software for restaurants, schools and vending.
              </h1>
              <p className="mt-7 max-w-md text-lg leading-8 text-white/70">
                Restaurant management, school website and vending machine
                software, ready to adapt to your setup.
              </p>
            </div>
            <p className="mt-10 text-sm font-semibold">Products</p>
          </div>

          <div className="flex items-center bg-[#e8e4dc] p-5 sm:p-8 lg:p-12">
            <div className="grid w-full gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
                Selected solutions
              </p>
              {products.map((product, index) => (
                <article
                  key={product.name}
                  id={product.slug}
                  className="rounded-[1.25rem] border border-black/10 bg-white p-5 shadow-[0_16px_45px_rgba(0,0,0,0.08)] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#602329]">
                        {product.category}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                        {product.name}
                      </h2>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f1efea] text-sm">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-black/60 sm:text-base">
                    {product.description}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-4">
                    <span className="text-xs text-black/60">
                      {product.detail}
                    </span>
                    <Link
                      href="/contact"
                      className="group inline-flex items-center gap-2 text-sm font-semibold text-[#602329]"
                    >
                      Contact for more information
                      <FiArrowUpRight
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <section
            aria-labelledby="product-delivery-title"
            className="grid gap-7 rounded-[1.25rem] bg-[#f1efea] p-6 sm:p-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12 lg:p-10"
          >
            <h2
              id="product-delivery-title"
              className="max-w-[12ch] text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl"
            >
              Product setup, hosting and use
            </h2>
            <div className="divide-y divide-black/15 border-y border-black/15">
              <article className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <h3 className="text-sm font-semibold text-[#602329]">
                  Do these products include source code?
                </h3>
                <p className="text-sm leading-6 text-black/70 sm:text-base">
                  Yes. The products above are ready-made and supplied with
                  source code. Setup costs depend on the product and agreed
                  scope.
                </p>
              </article>
              <article className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <h3 className="text-sm font-semibold text-[#602329]">
                  Is hosting included?
                </h3>
                <p className="text-sm leading-6 text-black/70 sm:text-base">
                  No. Hosting is separate. Initial setup includes up to two
                  working days of agreed small UI or feature customizations;
                  further work can be scoped separately.
                </p>
              </article>
              <article className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <h3 className="text-sm font-semibold text-[#602329]">
                  What about support and product rights?
                </h3>
                <p className="text-sm leading-6 text-black/70 sm:text-base">
                  Support and maintenance depend on the selected plan. The
                  standard purchase is for use by the buyer, not resale or
                  redistribution. Source-code handover does not transfer
                  copyright ownership; permitted use will be set out in the
                  written purchase agreement.
                </p>
              </article>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
