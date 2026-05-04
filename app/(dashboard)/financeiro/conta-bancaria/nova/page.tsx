"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TIPOS_CONTA = [
  { value: "CONTA_CORRENTE", label: "Conta Corrente" },
  { value: "CONTA_POUPANCA", label: "Conta Poupança" },
  { value: "CAIXA", label: "Caixa (dinheiro físico)" },
  { value: "CARTEIRA", label: "Carteira (virtual)" },
];

export default function NovaContaBancariaPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    tipo: "",
    nome: "",
    banco: "",
    agencia: "",
    numeroConta: "",
    saldoInicial: "",
  });

  const precisaBancoDados = form.tipo === "CONTA_CORRENTE" || form.tipo === "CONTA_POUPANCA";

  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar() {
    setErro("");

    if (!form.tipo) { setErro("Selecione o tipo de conta."); return; }
    if (!form.nome.trim()) { setErro("Informe um nome para identificar a conta."); return; }

    setSalvando(true);
    try {
      const res = await fetch("/api/contas-bancarias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.tipo,
          nome: form.nome.trim(),
          banco: form.banco.trim() || undefined,
          agencia: form.agencia.trim() || undefined,
          numeroConta: form.numeroConta.trim() || undefined,
          saldoInicial: form.saldoInicial ? parseFloat(form.saldoInicial.replace(",", ".")) : 0,
        }),
      });

      const data = await res.json();
      if (!data.sucesso) { setErro(data.erro || "Erro ao salvar."); return; }

      router.push("/financeiro");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/financeiro" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Financeiro
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-bold text-blue-900">Nova conta</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Cadastrar conta</h2>
          <p className="text-gray-500 text-sm mt-1">
            Conta bancária, caixa ou carteira onde o dinheiro fica registrado.
          </p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {erro}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              value={form.tipo}
              onChange={(e) => atualizar("tipo", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione o tipo</option>
              {TIPOS_CONTA.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome para identificação <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => atualizar("nome", e.target.value)}
              placeholder="Ex: Conta Bradesco, Caixa Loja, Carteira PJ"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Campos bancários — só para conta corrente e poupança */}
          {precisaBancoDados && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                <input
                  type="text"
                  value={form.banco}
                  onChange={(e) => atualizar("banco", e.target.value)}
                  placeholder="Ex: Bradesco, Itaú, Nubank"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                  <input
                    type="text"
                    value={form.agencia}
                    onChange={(e) => atualizar("agencia", e.target.value)}
                    placeholder="0001"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número da conta</label>
                  <input
                    type="text"
                    value={form.numeroConta}
                    onChange={(e) => atualizar("numeroConta", e.target.value)}
                    placeholder="12345-6"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Saldo inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo inicial (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.saldoInicial}
              onChange={(e) => atualizar("saldoInicial", e.target.value)}
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Saldo no momento do cadastro. Pode ser zero se estiver começando agora.
            </p>
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Link
            href="/financeiro"
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {salvando ? "Salvando..." : "Salvar conta"}
          </button>
        </div>
      </main>
    </div>
  );
}
