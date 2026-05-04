import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";

export default async function DashboardPage() {
  const sessao = await auth();
  if (!sessao) redirect("/login");

  const usuario = sessao.user as any;

  const tenant = await prisma.tenant.findUnique({
    where: { id: usuario.tenantId },
    select: { configuracoes: true },
  });

  const config = tenant?.configuracoes as any;
  const onboardingCompleto = config?.onboardingCompleto === true;

  const modulos = [
    {
      titulo: "Financeiro",
      descricao: "Lançamentos, contas e pagamentos",
      icone: "💰",
      disponivel: true,
      href: "/financeiro",
    },
    {
      titulo: "Movimentos",
      descricao: "Registre movimentos completos",
      icone: "🔄",
      disponivel: true,
      href: "/movimentos",
    },
    {
      titulo: "Pessoas",
      descricao: "Clientes, fornecedores e equipe",
      icone: "👥",
      disponivel: true,
      href: "/pessoas",
    },
    {
      titulo: "Produtos",
      descricao: "Estoque e serviços",
      icone: "📦",
      disponivel: true,
      href: "/produtos",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-900">Gabisystem</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{usuario.name}</p>
              <p className="text-xs text-gray-500">{usuario.tenantNome}</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {!onboardingCompleto && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-5 mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-amber-900">Configure seu sistema antes de começar</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Leva menos de 1 minuto. A IA vai aprender como funciona o seu negócio.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="flex-shrink-0 bg-amber-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              Configurar agora
            </Link>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Olá, {usuario.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-gray-500 mt-1">
            {onboardingCompleto
              ? `Bem-vindo ao ${usuario.tenantNome}. O que vamos registrar hoje?`
              : `Bem-vindo ao ${usuario.tenantNome}. Configure o sistema para começar.`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {modulos.map((modulo) => {
            const inner = (
              <>
                <div className="text-3xl mb-3">{modulo.icone}</div>
                <h3 className="font-semibold text-gray-800">{modulo.titulo}</h3>
                <p className="text-sm text-gray-500 mt-1">{modulo.descricao}</p>
                {!modulo.disponivel && (
                  <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    Em breve
                  </span>
                )}
              </>
            );

            if (modulo.disponivel && modulo.href) {
              return (
                <Link
                  key={modulo.titulo}
                  href={modulo.href}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm hover:border-blue-200 transition-all"
                >
                  {inner}
                </Link>
              );
            }

            return (
              <div
                key={modulo.titulo}
                className="bg-white rounded-xl border border-gray-100 p-6 opacity-60"
              >
                {inner}
              </div>
            );
          })}
        </div>

        {onboardingCompleto && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Guarda-roupa configurado</p>
                <p className="text-xs text-gray-500 mt-0.5">Segmento: {config?.segmento}</p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/configuracao-fiscal" className="text-xs text-blue-700 hover:underline">
                  Configuração fiscal
                </Link>
                <Link href="/onboarding" className="text-xs text-gray-500 hover:underline">
                  Reconfigurar
                </Link>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}