"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Pessoa { id: string; nome: string; relacionamento: string; }
interface Produto { id: string; nome: string; tipo: string; precoReferencia: number | null; unidade: string; }
interface ContaBancaria { id: string; nome: string; }
interface FormaPagamento { id: string; nome: string; }

interface ItemForm {
  produtoId: string;
  produtoNome: string;
  quantidade: string;
  valorUnitario: string;
}

const TIPOS_OPERACAO = [
  { value: "VENDA", label: "Venda", cor: "border-green-500 bg-green-50 text-green-800" },
  { value: "COMPRA", label: "Compra", cor: "border-blue-500 bg-blue-50 text-blue-800" },
  { value: "DESPESA", label: "Despesa", cor: "border-red-500 bg-red-50 text-red-800" },
  { value: "RECEITA", label: "Receita", cor: "border-emerald-500 bg-emerald-50 text-emerald-800" },
  { value: "TRANSFERENCIA", label: "Transferência", cor: "border-purple-500 bg-purple-50 text-purple-800" },
  { value: "OUTROS", label: "Outros", cor: "border-gray-400 bg-gray-50 text-gray-700" },
];

const TIPO_LANCAMENTO_PADRAO: Record<string, "ENTRADA" | "SAIDA" | "TRANSFERENCIA"> = {
  VENDA: "ENTRADA",
  RECEITA: "ENTRADA",
  COMPRA: "SAIDA",
  DESPESA: "SAIDA",
  TRANSFERENCIA: "TRANSFERENCIA",
  OUTROS: "SAIDA",
};

export default function NovoMovimentoPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [configFiscal, setConfigFiscal] = useState<any>(null);

  const hoje = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    tipoOperacao: "",
    pessoaId: "",
    dataMovimento: hoje,
    dataCompetencia: hoje,
    descricao: "",
    lancamentoValor: "",
    lancamentoVencimento: hoje,
    lancamentoContaBancariaId: "",
    lancamentoFormaPagamentoId: "",
    lancamentoObservacao: "",
  });

  const [itens, setItens] = useState<ItemForm[]>([
    { produtoId: "", produtoNome: "", quantidade: "1", valorUnitario: "" },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/pessoas").then((r) => r.json()),
      fetch("/api/produtos").then((r) => r.json()),
      fetch("/api/contas-bancarias").then((r) => r.json()),
      fetch("/api/formas-pagamento").then((r) => r.json()),
      fetch("/api/configuracao-fiscal").then((r) => r.json()),
    ]).then(([p, pr, c, f, cf]) => {
      if (p.sucesso) setPessoas(p.dados);
      if (pr.sucesso) setProdutos(pr.dados);
      if (c.sucesso) setContas(c.dados);
      if (f.sucesso) setFormas(f.dados);
      if (cf.sucesso) setConfigFiscal(cf.dados);
    });
  }, []);

  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function selecionarOperacao(tipo: string) {
    setForm((prev) => ({ ...prev, tipoOperacao: tipo }));
  }

  function atualizarItem(index: number, campo: keyof ItemForm, valor: string) {
    setItens((prev) => {
      const novo = [...prev];
      novo[index] = { ...novo[index], [campo]: valor };

      // Preenche valor unitário ao selecionar produto
      if (campo === "produtoId") {
        const produto = produtos.find((p) => p.id === valor);
        novo[index].produtoNome = produto?.nome ?? "";
        if (produto?.precoReferencia) {
          novo[index].valorUnitario = String(produto.precoReferencia);
        }
      }

      return novo;
    });
  }

  function adicionarItem() {
    setItens((prev) => [
      ...prev,
      { produtoId: "", produtoNome: "", quantidade: "1", valorUnitario: "" },
    ]);
  }

  function removerItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  const totalItens = itens.reduce((acc, item) => {
    const qtd = parseFloat(item.quantidade) || 0;
    const val = parseFloat(item.valorUnitario.replace(",", ".")) || 0;
    return acc + qtd * val;
  }, 0);

  const aliquota =
    form.tipoOperacao === "VENDA" ? configFiscal?.aliquotaVendaProduto ?? 0 : 0;
  const valorImposto = aliquota > 0 ? Number((totalItens * aliquota / 100).toFixed(2)) : 0;

  async function salvar() {
    setErro("");

    if (!form.tipoOperacao) { setErro("Selecione o tipo de operação."); return; }
    if (!form.pessoaId) { setErro("Selecione a pessoa vinculada."); return; }

    const itensValidos = itens.filter((i) => i.produtoId);
    if (itensValidos.length === 0) { setErro("Adicione ao menos um produto ou serviço."); return; }

    const valorLancamento = parseFloat(form.lancamentoValor.replace(",", "."));
    if (!form.lancamentoValor || isNaN(valorLancamento) || valorLancamento <= 0) {
      setErro("Informe o valor do lançamento financeiro."); return;
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/movimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoOperacao: form.tipoOperacao,
          pessoaId: form.pessoaId,
          dataMovimento: form.dataMovimento,
          dataCompetencia: form.dataCompetencia,
          descricao: form.descricao.trim() || undefined,
          itens: itensValidos.map((item) => ({
            produtoId: item.produtoId,
            quantidade: parseFloat(item.quantidade) || 1,
            valorUnitario: parseFloat(item.valorUnitario.replace(",", ".")) || 0,
            observacao: undefined,
          })),
          lancamento: {
            tipo: TIPO_LANCAMENTO_PADRAO[form.tipoOperacao] ?? "SAIDA",
            valor: valorLancamento,
            dataVencimento: form.lancamentoVencimento,
            contaBancariaId: form.lancamentoContaBancariaId || undefined,
            formaPagamentoId: form.lancamentoFormaPagamentoId || undefined,
            observacao: form.lancamentoObservacao.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!data.sucesso) { setErro(data.erro || "Erro ao salvar."); return; }

      router.push("/movimentos");
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
          <Link href="/movimentos" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Movimentos
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-bold text-blue-900">Novo movimento</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Registrar movimento</h2>
          <p className="text-gray-500 text-sm mt-1">
            Pessoa + Produto/Serviço + Financeiro — os três pilares obrigatórios.
          </p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {erro}
          </div>
        )}

        {/* PILAR 1: Operação e Pessoa */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            1 — Operação e Pessoa
          </h3>

          {/* Tipo de operação */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de operação <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_OPERACAO.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => selecionarOperacao(t.value)}
                  className={`py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    form.tipoOperacao === t.value
                      ? t.cor
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pessoa */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pessoa <span className="text-red-500">*</span>
            </label>
            <select
              value={form.pessoaId}
              onChange={(e) => atualizar("pessoaId", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione a pessoa</option>
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

          {/* Descrição e datas */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => atualizar("descricao", e.target.value)}
              placeholder="Descreva o movimento..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data do movimento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dataMovimento}
                onChange={(e) => atualizar("dataMovimento", e.target.value)}
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
            </div>
          </div>
        </div>

        {/* PILAR 2: Produtos e Serviços */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            2 — Produtos / Serviços
          </h3>

          {produtos.length === 0 && (
            <p className="text-xs text-amber-600 mb-3">
              Nenhum produto cadastrado.{" "}
              <Link href="/produtos/novo" className="underline">Cadastrar</Link>
            </p>
          )}

          <div className="space-y-3">
            {itens.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <select
                    value={item.produtoId}
                    onChange={(e) => atualizarItem(index, "produtoId", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione o produto/serviço</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} {p.precoReferencia ? `— R$ ${Number(p.precoReferencia).toFixed(2)}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(index, "quantidade", e.target.value)}
                    placeholder="Qtd"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.valorUnitario}
                    onChange={(e) => atualizarItem(index, "valorUnitario", e.target.value)}
                    placeholder="Valor"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerItem(index)}
                    className="mt-1 text-gray-400 hover:text-red-500 text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={adicionarItem}
            className="mt-3 text-sm text-blue-700 hover:underline"
          >
            + Adicionar item
          </button>

          {totalItens > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">Total dos itens</span>
              <span className="font-semibold text-gray-800">
                {totalItens.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          )}

          {valorImposto > 0 && (
            <div className="mt-1 flex justify-between items-center">
              <span className="text-xs text-purple-600">
                Imposto gerado automaticamente ({aliquota}%)
              </span>
              <span className="text-xs font-medium text-purple-600">
                {valorImposto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          )}
        </div>

        {/* PILAR 3: Financeiro */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            3 — Financeiro
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.lancamentoValor}
                  onChange={(e) => atualizar("lancamentoValor", e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vencimento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.lancamentoVencimento}
                  onChange={(e) => atualizar("lancamentoVencimento", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta bancária</label>
              <select
                value={form.lancamentoContaBancariaId}
                onChange={(e) => atualizar("lancamentoContaBancariaId", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhuma</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento</label>
              <select
                value={form.lancamentoFormaPagamentoId}
                onChange={(e) => atualizar("lancamentoFormaPagamentoId", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhuma</option>
                {formas.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/movimentos"
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {salvando ? "Salvando..." : "Registrar movimento"}
          </button>
        </div>
      </main>
    </div>
  );
}
