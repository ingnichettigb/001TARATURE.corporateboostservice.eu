import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { checkLicenseStatus } from "@/lib/license.functions";
import {
  LICENSE_ID_KEY,
  ACTIVATED_KEY,
  LAST_LICENSE_CHECK_KEY,
  LICENSE_INVALID_REASON_KEY,
  clearGateKeys,
  isUuid,
} from "@/lib/app-config";

const ACTIVATION_PATH = "/attivazione";
const EXPIRED_PATH = "/licenza-scaduta";
const PUBLIC_PATHS = new Set([ACTIVATION_PATH, EXPIRED_PATH]);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TARATURA SERBATOI" },
      { name: "description", content: "Suite modulare per la taratura di serbatoi industriali." },
      { name: "author", content: "Taratura Serbatoi" },
      { property: "og:title", content: "TARATURA SERBATOI" },
      { property: "og:description", content: "Suite modulare per la taratura di serbatoi industriali." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AuthGate>
    </QueryClientProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const statusFn = useServerFn(checkLicenseStatus);
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const isPublic = PUBLIC_PATHS.has(pathname);
    const activated = window.localStorage.getItem(ACTIVATED_KEY);
    const storedLicenseId = window.localStorage.getItem(LICENSE_ID_KEY);

    // Un valore non-UUID in localStorage (residuo/legacy) va scartato.
    if (storedLicenseId && !isUuid(storedLicenseId)) {
      clearGateKeys();
    }
    const licenseId = isUuid(storedLicenseId) ? storedLicenseId : null;
    const activatedOk = licenseId ? activated : null;

    const settle = (value: boolean) => {
      if (cancelled) return;
      setAllowed(value);
      setChecked(true);
    };

    if (isPublic) {
      settle(true);
    } else if (!activatedOk) {
      navigate({ to: ACTIVATION_PATH, replace: true });
      settle(false);
    } else {
      // Rivalidazione della licenza a OGNI caricamento di pagina protetta.
      setChecked(false);
      void (async () => {
        try {
          const res = await statusFn({ data: { licenseId } });
          if (cancelled) return;
          if (res.valid) {
            window.localStorage.setItem(LAST_LICENSE_CHECK_KEY, new Date().toISOString());
            settle(true);
          } else {
            window.localStorage.setItem(LICENSE_INVALID_REASON_KEY, res.reason ?? "");
            clearGateKeys();
            navigate({ to: EXPIRED_PATH, replace: true });
            settle(false);
          }
        } catch (err) {
          // fail-open: nessun blocco per errori tecnici
          console.error("license revalidation error:", err);
          settle(true);
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [pathname, navigate, statusFn]);

  if (!checked || !allowed) return null;
  return <>{children}</>;
}
