"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const REGIMES = [
  {
    value: "MEI",
    label: "MEI",
    descricao: "Microempreendedor Individual — faturamento até R$ 81 mil/ano",
  },
  {
    value: "SIMPLES_NACIONAL",
    label: "Simples Nacional",
    descricao: "Regime unificado para micro e pequenas empresas",
  },
  {
    value: "LUCRO_PRESUMIDO",
    label: "Lucro Presumido",
    descricao: "Tributação com base em percentual fixo sobre a receita",
  },
  {
    value: "LUCRO_REAL",
    label: "Lucro Real",
    descricao: "Tributação sobre o lucro efetivo apurado",
  },
];

const NOTAS_FISCAIS = [
  { value: "NAO_EMITE", label: "Não emite nota fiscal" },
  { value: "NFE", label: "NF-e (nota fiscal de produto)" },
  { value: "NFSE", label: "NFS-e (nota fiscal de serviço)" },
  { value: "AMBAS", label: "Ambas (produto e serviço)" },
];

const LABEL_REGIME: Record<string, string> = {
  MEI: "MEI",
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL: "Lucro Real",
};

const LABEL_NOTA: Record<string, string> = {
  NAO_EMITE: "Não emite",
  NFE: "NF-e",
  NFSE: "NFS-e",
  AMBAS: "NF-e e NFS-e",
};

export default function ConfiguracaoFiscalPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [jaConfigurado, setJaConfigurado] = useState(false);

  const [form, setForm] = useState({
    regimeTributario: "",
    aliquotaVendaProduto: "",
    aliquotaPrestacaoServico: "",
    emiteNotaFiscal: "",
  });

  useEffect(() => {
    fetch("/api/configuracao-fiscal")
      .then((r) => r.json())
      .then((data) => {
        if (data.sucesso && data.dados.configurado) {
          const d = data.dados;
          setJaConfigurado(true);
          setForm({
            regimeTributario: d.regimeTributario ?? "",
            aliquotaVendaProduto: d.aliquotaVendaProduto?.toString() ?? "",
            aliquotaPrestacaoServico: d.aliquotaPrestacaoServico?.toString() ?? "",
            emiteNotaFiscal: d.emiteNotaFiscal ?? "",
          });
        }
      })
      .finally(() => setCarregando(false));
  }, []);

  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar() {
    setErro("");
    setSalvo(false);

    if (!form.regimeTributario) { setErro("Selecione o regime tributário."); return; }
    if (!form.emiteNotaFiscal) { setErro("Informe se a empresa emite nota fiscal."); return; }

    const aliquotaProduto = parseFloat(form.aliquotaVendaProduto.replace(",", ".") || "0");
    const aliquotaServico = parseFloat(form.aliquotaPrestacaoServico.replace(",", ".") || "0");

    if (isNaN(aliquotaProduto) || aliquotaProduto < 0 || aliquotaProduto > 100) {
      setErro("Alíquota de produto inválida (0 a 100)."); return;
    }
    if (isNaN(aliquotaServico) || aliquotaServico < 0 || aliquotaServico > 100) {
      setErro("Alíquota de serviço inválida (0 a 100)."); return;
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/configuracao-fiscal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regimeTributario: form.regimeTributario,
          aliquotaVendaProduto: aliquotaProduto,
          aliquotaPrestacaoServico: aliquotaServico,
          emiteNotaFiscal: form.emiteNotaFiscal,
        }),
      });

      const data = await res.json();
      if (!data.sucesso) { setErro(data.erro || "Erro ao salvar."); return; }

      setSalvo(true);
      setJaConfigurado(true);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Dashboard
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-bold text-blue-900">Configuração fiscal</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Configuração fiscal</h2>
          <p className="text-gray-500 text-sm mt-1">
            Define as regras tributárias do tenant. Usadas nos cálculos automáticos dos Movimentos.
          </p>
        </div>

        {jaConfigurado && !salvo && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-6">
            Configuração fiscal já definida. Qualquer alteração substituirá os valores atuais.
          </div>
        )}

        {salvo && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm mb-6">
            Configuração fiscal salva com sucesso.
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {erro}
          </div>
        )}

        {/* Regime tributário */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Regime tributário
          </h3>
          <div className="space-y-3">
            {REGIMES.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  form.regimeTributario === r.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="regime"
                  value={r.value}
                  checked={form.regimeTributario === r.value}
                  onChange={(e) => atualizar("regimeTributario", e.target.value)}
                  className="mt-0.5 accent-blue-700"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.descricao}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Alíquotas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Alíquotas padrão (%)
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Taxa de imposto aplicada nos cálculos automáticos. Use 0 se não souber agora — pode ajustar depois.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venda de produto
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.aliquotaVendaProduto}
                  onChange={(e) => atualizar("aliquotaVendaProduto", e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-sm text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prestação de serviço
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.aliquotaPrestacaoServico}
                  onChange={(e) => atualizar("aliquotaPrestacaoServico", e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-sm text-gray-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nota fiscal */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Emissão de nota fiscal
          </h3>
          <div className="space-y-2">
            {NOTAS_FISCAIS.map((n) => (
              <label
                key={n.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form.emiteNotaFiscal === n.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="notafiscal"
                  value={n.value}
                  checked={form.emiteNotaFiscal === n.value}
                  onChange={(e) => atualizar("emiteNotaFiscal", e.target.value)}
                  className="accent-blue-700"
                />
                <p className="text-sm text-gray-800">{n.label}</p>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {salvando ? "Salvando..." : "Salvar configuração"}
          </button>
        </div>
      </main>
    </div>
  );
}
