import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)"], // rest are protected
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts).*)"],
};
