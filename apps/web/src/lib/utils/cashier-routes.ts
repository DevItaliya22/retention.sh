export interface CashierRouteParams {
  businessSlug: string;
  cashierSlug: string;
  subPath: string;
  fullPath: string;
}

export function parseCashierRoute(pathname: string): CashierRouteParams | null {
  if (!pathname.startsWith("/cashier/")) {
    return null;
  }

  const pathParts = pathname.split("/").filter(Boolean);

  if (pathParts.length < 3) {
    return null;
  }

  const businessSlug = pathParts[1];
  const cashierSlug = pathParts[2];
  const rest = pathParts.slice(3);

  if (!businessSlug || !cashierSlug) {
    return null;
  }

  const subPath = rest.length > 0 ? `/${rest.join("/")}` : "";
  const fullPath = `/cashier/${businessSlug}/${cashierSlug}${subPath}`;

  return {
    businessSlug,
    cashierSlug,
    subPath,
    fullPath,
  };
}
