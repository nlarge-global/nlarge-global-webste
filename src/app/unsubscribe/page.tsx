import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import UnsubscribeForm from "@/features/contact/components/UnsubscribeForm";
import { getVerifiedSubscriberAddressKey } from "@/features/contact/services/unsubscribe-token";

export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const validToken = token && getVerifiedSubscriberAddressKey(token) ? token : null;

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main
        id="main-content"
        className="grid min-h-[50svh] place-items-center px-5 pt-32 sm:px-8"
      >
        <section className="w-full  rounded-[1.5rem] bg-[#f1efea] p-7 sm:p-10">
          <h1 className="max-w-[12ch] text-[clamp(2.8rem,8vw,5rem)] leading-[0.9] tracking-[-0.05em]">
            Email preferences.
          </h1>
          {validToken ? (
            <>
              <p className="mt-5 max-w-xl leading-7 text-black/70">
                You can stop receiving marketing updates from NLarge Global below.
              </p>
              <div className="mt-7">
                <UnsubscribeForm token={validToken} />
              </div>
            </>
          ) : (
            <>
              <p className="mt-5 max-w-xl leading-7 text-black/70">
                This unsubscribe link is invalid or incomplete. Please use the
                link in a recent NLarge Global email or contact us for help.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-block font-semibold text-[#602329] underline underline-offset-4"
              >
                Contact NLarge Global
              </Link>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
