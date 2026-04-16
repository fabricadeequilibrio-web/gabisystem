"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

const SEGMENTOS = [
  "Comércio varejista",
  "Comércio atacadista",
  "Alimentação e bebidas",
  "Serviços gerais",
  "Saúde e bem-estar",
  "Educação",
  "Construção civil",
  "Indústria / Manufatura",
  "Transporte e logística",
  "Tecnologia",
  "Consultoria",
  "Outro",
];

export default function CadastroPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    nomeEmpresa: "",
    cnpj: "",
    segmento: "",
    nomeUsuario: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErro("");
  }

  function avancar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nomeEmpresa.trim()) {
      setErro("Nome da empresa é obrigatório");
      return;
    }
    setEtapa(2);
  }

  async function finalizar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (form.senha !== form.confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }

    if (form.senha.length < 6) {
      setErro("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setCarregando(true);

    try {
      const res = await fetch("/api/tenants/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeEmpresa: form.nomeEmpresa,
          cnpj: form.cnpj || undefined,
          segmento: form.segmento || undefined,
          nomeUsuario: form.nomeUsuario,
          email: form.email,
          senha: form.senha,
        }),
      });

      const dados = await res.json();

      if (!dados.sucesso) {
        setErro(dados.erro || "Erro ao cadastrar");
        setCarregando(false);
        return;
      }

      // Login automático após cadastro
      await signIn("credentials", {
        email: form.email,
        password: form.senha,
        redirect: false,
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Gabisystem</h1>
          <p className="text-gray-500 mt-1">Cadastre sua empresa e comece agora</p>
        </div>

        {/* Indicador de etapa */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${etapa >= 1 ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-500"}`}>
            1
          </div>
          <div className={`w-12 h-0.5 ${etapa >= 2 ? "bg-blue-900" : "bg-gray-200"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${etapa >= 2 ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-500"}`}>
            2
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* Etapa 1 — Empresa */}
          {etapa === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Sua empresa</h2>
              <p className="text-sm text-gray-500 mb-6">Informações básicas do negócio</p>

              <form onSubmit={avancar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nomeEmpresa}
                    onChange={(e) => atualizar("nomeEmpresa", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Padaria do João"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => atualizar("cnpj", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Segmento <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <select
                    value={form.segmento}
                    onChange={(e) => atualizar("segmento", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione o segmento</option>
                    {SEGMENTOS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {erro && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {erro}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
                >
                  Continuar
                </button>
              </form>
            </>
          )}

          {/* Etapa 2 — Usuário */}
          {etapa === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Seu acesso</h2>
              <p className="text-sm text-gray-500 mb-6">Dados do responsável pela conta</p>

              <form onSubmit={finalizar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seu nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nomeUsuario}
                    onChange={(e) => atualizar("nomeUsuario", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => atualizar("email", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={form.senha}
                    onChange={(e) => atualizar("senha", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar senha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={form.confirmarSenha}
                    onChange={(e) => atualizar("confirmarSenha", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Repita a senha"
                  />
                </div>

                {erro && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {erro}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEtapa(1)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={carregando}
                    className="flex-1 bg-blue-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    {carregando ? "Cadastrando..." : "Criar conta"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-blue-700 font-medium hover:underline">
            Entrar
          </Link>
        </p>

      </div>
    </div>
  );
}
