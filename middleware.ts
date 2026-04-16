import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: sessao } = req;
  const estaLogado = !!sessao;

  const rotasPublicas = ["/login", "/cadastro"];
  const eRotaPublica = rotasPublicas.some((rota) =>
    nextUrl.pathname.startsWith(rota)
  );

  // Redireciona para login se não estiver autenticado
  if (!estaLogado && !eRotaPublica) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Redireciona para dashboard se já estiver logado e tentar acessar login/cadastro
  if (estaLogado && eRotaPublica) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
