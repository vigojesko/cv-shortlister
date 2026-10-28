import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/",
    "/positions/:path*",
    "/candidates/:path*",
    "/compare/:path*",
    "/settings/:path*",
    "/upload/:path*",
  ],
};
