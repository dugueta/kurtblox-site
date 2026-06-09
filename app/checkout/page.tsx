import { getPackageById } from "@/data/packages";

import { CheckoutPage } from "./CheckoutPage";

type CheckoutRouteProps = {
  searchParams: Promise<{
    package?: string;
  }>;
};

export default async function CheckoutRoute({ searchParams }: CheckoutRouteProps) {
  const params = await searchParams;
  const selectedPackage = getPackageById(params.package);

  return <CheckoutPage selectedPackage={selectedPackage} />;
}
