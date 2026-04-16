import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const sessao = await auth();
  if (!sessao) redirect("/login");

  const usuario = sessao.user as any;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-900">Gabisystem</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{usuario.name}</p>
              <p className="text-xs text-gray-500">{usuario.tenantNome}</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Olá, {usuario.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-gray-500 mt-1">
            Bem-vindo ao {usuario.tenantNome}. O sistema está pronto para uso.
          </p>
        </div>

        {/* Cards de módulos — em breve */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { titulo: "Movimentos", descricao: "Registre entradas e saídas", icone: "💰", disponivel: false },
            { titulo: "Pessoas", descricao: "Clientes, fornecedores e equipe", icone: "👥", disponivel: false },
            { titulo: "Produtos", descricao: "Estoque e serviços", icone: "📦", disponivel: false },
          ].map((modulo) => (
            <div
              key={modulo.titulo}
              className={`bg-white rounded-xl border p-6 ${modulo.disponivel ? "border-gray-200 cursor-pointer hover:shadow-sm" : "border-gray-100 opacity-60"}`}
            >
              <div className="text-3xl mb-3">{modulo.icone}</div>
              <h3 className="font-semibold text-gray-800">{modulo.titulo}</h3>
              <p className="text-sm text-gray-500 mt-1">{modulo.descricao}</p>
              {!modulo.disponivel && (
                <span className="inline-block mt-3 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  Em breve
                </span>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
