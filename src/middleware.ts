import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Skip all API routes, OAuth callback, internal Next.js/Vercel assets, and static files
    "/((?!api|auth|_next|_vercel|.*\\..*).*)",
    "/",
    "/(ar|en)/:path*",
  ],
};
