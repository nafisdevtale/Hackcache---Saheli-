import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";
// @ts-ignore plain JS module
import { AppProvider } from "../App.jsx";
// @ts-ignore plain JS module
import { Shell } from "../components/layout/Shell.jsx";

import appCss from "../styles.css?url";
import { loadPrefs } from "../lib/storage.js";
import { translate } from "../i18n/index.js";
import { Btn } from "../components/common/ui.jsx";

function useFallbackTranslation() {
  const [lang, setLang] = useState("en");
  useEffect(() => { setLang(loadPrefs().lang); }, []);
  return (key: string) => translate(lang, key);
}

function NotFoundComponent() {
  const t = useFallbackTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("error.notFound")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("error.notFoundText")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("error.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ reset }: ErrorComponentProps) {
  const t = useFallbackTranslation();
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("error.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("error.text")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Btn
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("error.retry")}
          </Btn>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("error.home")}
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
      { title: "Saheli" },
      { name: "description", content: "Saheli: a free, private, bilingual period companion." },
            { property: "og:title", content: "Saheli" },
      { property: "og:description", content: "Saheli: a free, private, bilingual period companion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <ClientOnly fallback={<p style={{ padding: 32, textAlign: "center" }}>…</p>}>
        <AppProvider>
          <Shell>
            <Outlet />
          </Shell>
        </AppProvider>
      </ClientOnly>
    </QueryClientProvider>
  );
}
