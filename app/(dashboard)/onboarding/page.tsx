"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SEGMENTOS = [
  "Comércio varejista",
  "Comércio atacadista",
  "Alimentação e bebidas",
  "Transportadora",
  "Armazém / Logística",
  "Agronegócio / Fazenda",
  "Serviços gerais",
  "Saúde e bem-estar",
  "Educação",
  "Construção civil",
  "Indústria / Manufatura",
  "Tecnologia",
  "Consultoria",
  "Outro",
];

interface Regra {
  evento: string;
  codigo_conta: string;
  nome_conta: string;
  tipo: string;
  exemplo: string;
}

const COR_TIPO: Record<string, string> = {
  RECEITA: "bg-green-100 text-green-800",
  CUSTO: "bg-red-100 text-red-800",
  DESPESA: "bg-orange-100 text-orange-800",
  INVESTIMENTO: "bg-blue-100 text-blue-800",
  OBRIGACAO_FISCAL: "bg-purple-100 text-purple-800",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<"form" | "gerando" | "resultado">("form");
  const [segmento, setSegmento] = useState("");
  const [descricao, setDescricao] = useState("");
  const [regras, setRegras] = useState<Regra[]>([]);
  const [erro, setErro] = useState("");

  async function gerarGuardaRoupa() {
    if (!segmento) {
      setErro("Selecione o segmento da empresa");
      return;
    }

    setErro("");
    setEtapa("gerando");

    try {
      const res = await fetch("/api/ia/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmento, descricaoNegocio: descricao }),
      });

      const dados = await res.json();

      if (!dados.sucesso) {
        setErro(dados.erro || "Erro ao gerar regras");
        setEtapa("form");
        return;
      }

      setRegras(dados.dados.regras);
      setEtapa("resultado");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setEtapa("form");
    }
  }

  function irParaDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-blue-900">Gabisystem</h1>
          <p className="text-gray-500 mt-1">Vamos configurar seu sistema</p>
        </div>

        {/* ETAPA: FORM */}
        {etapa === "form" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Como é o seu negócio?
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Vamos configurar o sistema de acordo com o seu segmento. Isso ajuda a IA a classificar seus lançamentos corretamente desde o início.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Segmento da empresa <span className="text-red-500">*</span>
                </label>
                <select
                  value={segmento}
                  onChange={(e) => { setSegmento(e.target.value); setErro(""); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                >
                  <option value="">Selecione o segmento</option>
                  {SEGMENTOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descreva brevemente o que sua empresa faz{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
                  placeholder="Ex: Transportamos cargas fracionadas entre São Paulo e interior do estado..."
                />
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {erro}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">O que vai acontecer:</span> A IA vai montar as regras de classificação específicas para o seu tipo de negócio — o "guarda-roupa" onde cada lançamento vai ser guardado.
                </p>
              </div>

              <button
                onClick={gerarGuardaRoupa}
                className="w-full bg-blue-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                Configurar meu sistema
              </button>
            </div>
          </div>
        )}

        {/* ETAPA: GERANDO */}
        {etapa === "gerando" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Montando seu guarda-roupa...
            </h2>
            <p className="text-sm text-gray-500">
              A IA está analisando o segmento <strong>{segmento}</strong> e criando as regras de classificação específicas para o seu negócio.
            </p>
            <p className="text-xs text-gray-400 mt-4">Isso pode levar alguns segundos</p>
          </div>
        )}

        {/* ETAPA: RESULTADO */}
        {etapa === "resultado" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Guarda-roupa configurado!
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {regras.length} regras de classificação criadas para <strong>{segmento}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {regras.map((regra, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{regra.evento}</p>
                        <p className="text-xs text-gray-500 mt-1">{regra.exemplo}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${COR_TIPO[regra.tipo] ?? "bg-gray-100 text-gray-700"}`}>
                          {regra.tipo}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{regra.codigo_conta} — {regra.nome_conta}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
              <p className="text-sm text-blue-800">
                Essas regras orientam a IA na hora de classificar seus lançamentos. Elas se refinam automaticamente conforme você usa o sistema.
              </p>
            </div>

            <button
              onClick={irParaDashboard}
              className="w-full bg-blue-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Ir para o sistema
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
