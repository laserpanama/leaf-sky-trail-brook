import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import { venue } from "@/venue";

const APP_NAME = venue.meta.title;
const DESCRIPTION = venue.meta.description;
const { theme, fonts } = venue;

/** Venue tokens override the defaults in styles.css (same names Tailwind uses). */
const VENUE_CSS = `:root{--color-bg:${theme.bg};--color-surface:${theme.surface};--color-fg:${theme.fg};--color-muted:${theme.muted};--color-brass:${theme.accent};--color-ink:${theme.ink};--color-line:${theme.line};--font-display:${fonts.display};--font-sans:${fonts.sans};--display-style:${theme.displayStyle}}${theme.displayCss ?? ""}`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: DESCRIPTION },
      { name: "theme-color", content: theme.bg },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: fonts.href,
      },
    ],
  }),
  component: () => (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: VENUE_CSS }} />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
