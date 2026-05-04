"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ContaBancaria { id: string; nome: string; tipo: string; }
interface FormaPagamento { id: string; nome: string; tipo: string; }
interface Pessoa { id: string; nome: string; relacionamento: string; }

export default function NovoLancamentoPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);

  const hoje = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    tipo: "",
    descricao: "",
    valor: "",
    dataVencimento: hoje,
    dataCompetencia: hoje,
    contaBancariaId: "",
    formaPagamentoId: "",
    pessoaId: "",
    observacao: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/contas-bancarias").then((r) => r.json()),
      fetch("/api/formas-pagamento").then((r) => r.json()),
      fetch("/api/pessoas").then((r) => r.json()),
    ]).then(([c, f, p]) => {
      if (c.sucesso) setContas(c.dados);
      if (f.sucesso) setFormas(f.dados);
      if (p.sucesso) setPessoas(p.dados);
    });
  }, []);

  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar() {
    setErro("");

    if (!form.tipo) { setErro("Selecione o tipo do lançamento."); return; }
    if (!form.descricao.trim()) { setErro("Informe uma descrição."); return; }
    if (!form.valor || parseFloat(form.valor.replace(",", ".")) <= 0) {
      setErro("Informe um valor maior que zero."); return;
    }
    if (!form.dataVencimento) { setErro("Informe a data de vencimento."); return; }
    if (!form.dataCompetencia) { setErro("Informe a data de competência."); return; }

    setSalvando(true);
    try {
      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.tipo,
          descricao: form.descricao.trim(),
          valor: parseFloat(form.valor.replace(",", ".")),
          dataVencimento: form.dataVencimento,
          dataCompetencia: form.dataCompetencia,
          contaBancariaId: form.contaBancariaId || undefined,
          formaPagamentoId: form.formaPagamentoId || undefined,
          pessoaId: form.pessoaId || undefined,
          observacao: form.observacao.trim() || undefined,
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

  const labelTipo: Record<string, string> = {
    ENTRADA: "Entrada",
    SAIDA: "Saída",
    TRANSFERENCIA: "Transferência",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/financeiro" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Financeiro
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-bold text-blue-900">Novo lançamento</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Registrar lançamento</h2>
          <p className="text-gray-500 text-sm mt-1">
            Qualquer evento que movimenta dinheiro na empresa.
          </p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {erro}
          </div>
        )}

        {/* Seção: O movimento */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            O movimento
          </h3>
          <div className="space-y-4">

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["ENTRADA", "SAIDA", "TRANSFERENCIA"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => atualizar("tipo", t)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      form.tipo === t
                        ? t === "ENTRADA"
                          ? "bg-green-700 text-white border-green-700"
                          : t === "SAIDA"
                          ? "bg-red-700 text-white border-red-700"
                          : "bg-blue-700 text-white border-blue-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {labelTipo[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => atualizar("descricao", e.target.value)}
                placeholder="Ex: Pagamento energia elétrica, Recebimento cliente..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.valor}
                onChange={(e) => atualizar("valor", e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>
        </div>

        {/* Seção: Datas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Datas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vencimento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dataVencimento}
                onChange={(e) => atualizar("dataVencimento", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Competência <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dataCompetencia}
                onChange={(e) => atualizar("dataCompetencia", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Mês a que o lançamento se refere.</p>
            </div>
          </div>
        </div>

        {/* Seção: Vínculos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Vínculos (opcional)
          </h3>
          <div className="space-y-4">

            {/* Pessoa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa</label>
              <select
                value={form.pessoaId}
                onChange={(e) => atualizar("pessoaId", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhuma</option>
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              {pessoas.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nenhuma pessoa cadastrada.{" "}
                  <Link href="/pessoas/nova" className="underline">Cadastrar</Link>
                </p>
              )}
            </div>

            {/* Conta bancária */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conta bancária
              </label>
              <select
                value={form.contaBancariaId}
                onChange={(e) => atualizar("contaBancariaId", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhuma</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {contas.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nenhuma conta cadastrada.{" "}
                  <Link href="/financeiro/conta-bancaria/nova" className="underline">Cadastrar</Link>
                </p>
              )}
            </div>

            {/* Forma de pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forma de pagamento
              </label>
              <select
                value={form.formaPagamentoId}
                onChange={(e) => atualizar("formaPagamentoId", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhuma</option>
                {formas.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
              {formas.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nenhuma forma cadastrada.{" "}
                  <Link href="/financeiro/forma-pagamento/nova" className="underline">Cadastrar</Link>
                </p>
              )}
            </div>

            {/* Observação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
              <textarea
                value={form.observacao}
                onChange={(e) => atualizar("observacao", e.target.value)}
                rows={2}
                placeholder="Informações adicionais..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

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
            {salvando ? "Salvando..." : "Salvar lançamento"}
          </button>
        </div>
      </main>
    </div>
  );
}
