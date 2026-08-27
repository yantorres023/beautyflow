import { NextResponse } from "next/server";
import { auth } from "./auth";

const protectedPrefixes = ["/dashboard", "/clientes", "/servicos", "/agenda", "/pagamentos", "/despesas", "/financeiro"];
const authPaths = ["/entrar", "/cadastrar"];

export default auth((request) => {
  const path = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => path.startsWith(prefix));
  const isAuthPage = authPaths.includes(path);

  if (isProtected && !request.auth) {
    return NextResponse.redirect(new URL(`/entrar?callbackUrl=${encodeURIComponent(path)}`, request.url));
  }

  if (isAuthPage && request.auth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/servicos/:path*",
    "/agenda/:path*",
    "/pagamentos/:path*",
    "/despesas/:path*",
    "/financeiro/:path*",
    "/entrar",
    "/cadastrar",
  ],
};
