"use client";

import { useState } from "react";
import {
  BookOpen, ChevronDown, ChevronUp, Settings, Wallet, Pin,
  CreditCard, Receipt, PiggyBank, TrendingUp, Bot, CheckCircle2,
} from "lucide-react";

interface Secao {
  id: string;
  icone: React.ReactNode;
  titulo: string;
  cor: string;
  topicos: Topico[];
}

interface Topico {
  titulo: string;
  conteudo: React.ReactNode;
}

const SECOES: Secao[] = [
  // ── CONFIGURAÇÕES ─────────────────────────────────────
  {
    id: "configuracoes",
    icone: <Settings size={20} />,
    titulo: "Configurações",
    cor: "text-indigo-400",
    topicos: [
      {
        titulo: "Cadastro de Contas Bancárias",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Antes de usar o sistema, cadastre suas contas e cartões. Eles serão usados para vincular pagamentos e calcular saldos.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Acesse <b className="text-white">Configurações</b> no menu lateral.</Passo>
              <Passo n={2}>Na seção <b className="text-white">Contas Bancárias</b>, clique em <b className="text-white">Adicionar</b>.</Passo>
              <Passo n={3}><b className="text-white">Passo 1 — Banco:</b> selecione seu banco na grade (Nubank, Caju, Santander, etc.).</Passo>
              <Passo n={4}><b className="text-white">Passo 2 — Tipo:</b> escolha entre Conta Corrente, Cartão de Crédito ou Investimentos.</Passo>
              <Passo n={5}><b className="text-white">Passo 3 — Detalhes:</b>
                <ul className="ml-4 mt-1 flex flex-col gap-1 list-disc">
                  <li>Conta Corrente / Investimento: informe o saldo inicial atual.</li>
                  <li>Cartão de Crédito: informe o limite, dia de fechamento e dia de vencimento.</li>
                </ul>
              </Passo>
              <Passo n={6}>Clique em <b className="text-white">Adicionar conta</b>.</Passo>
            </ol>
            <Dica>Você pode ter vários produtos do mesmo banco (ex: Santander Conta Corrente + Santander Cartão de Crédito). Adicione cada um separadamente.</Dica>
          </div>
        ),
      },
      {
        titulo: "Cadastro de Categorias",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>As categorias classificam seus gastos e entradas. O sistema já vem com categorias padrão, mas você pode criar as suas.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Em <b className="text-white">Configurações</b>, role até a seção <b className="text-white">Categorias</b>.</Passo>
              <Passo n={2}>Clique em <b className="text-white">Nova categoria</b>.</Passo>
              <Passo n={3}>Digite o nome e escolha uma cor clicando nos círculos coloridos.</Passo>
              <Passo n={4}>Veja a prévia do chip antes de salvar. Clique em <b className="text-white">Criar</b>.</Passo>
            </ol>
            <p>Para editar ou excluir, passe o mouse sobre uma categoria — os ícones de ação aparecem.</p>
            <Dica>As categorias criadas aqui aparecem automaticamente em todos os formulários de registro de gastos.</Dica>
          </div>
        ),
      },
      {
        titulo: "Integrações MCP — Conectar ao Claude",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Gere uma chave de API para conectar o Claude ao Meu Hub e registrar gastos por conversa.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Em <b className="text-white">Configurações</b>, role até <b className="text-white">Integrações MCP</b>.</Passo>
              <Passo n={2}>Clique em <b className="text-white">Nova chave</b>, dê um nome (ex: "Claude.ai") e clique em Criar.</Passo>
              <Passo n={3}>Copie a chave gerada e a URL do servidor.</Passo>
            </ol>
            <p className="text-white text-xs font-medium mt-1">Como adicionar no Claude.ai:</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Acesse <b className="text-white">claude.ai</b> → clique na sua foto → <b className="text-white">Configurações</b>.</Passo>
              <Passo n={2}>Clique em <b className="text-white">Conectores</b> no menu lateral.</Passo>
              <Passo n={3}>Clique no <b className="text-white">+</b> ao lado de "Conectores" → <b className="text-white">Adicionar conector personalizado</b>.</Passo>
              <Passo n={4}>Preencha:
                <ul className="ml-4 mt-1 flex flex-col gap-1 list-disc">
                  <li><b className="text-white">Nome:</b> Meu Hub</li>
                  <li><b className="text-white">URL:</b> cole a URL do servidor + <code className="text-indigo-300">?key=SUA_CHAVE</code></li>
                </ul>
              </Passo>
              <Passo n={5}>Clique em <b className="text-white">Adicionar</b>. Mude as permissões para <b className="text-white">Sempre permitir</b>.</Passo>
            </ol>
            <Dica>Cada usuário gera sua própria chave e acessa apenas seus dados. Compartilhe o link do sistema com outras pessoas para que criem a conta e repitam o processo.</Dica>
          </div>
        ),
      },
    ],
  },

  // ── ENTRADAS ──────────────────────────────────────────
  {
    id: "entradas",
    icone: <TrendingUp size={20} />,
    titulo: "Entradas",
    cor: "text-emerald-400",
    topicos: [
      {
        titulo: "Registrar uma entrada",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Registre salários, freelances, rendas extras e qualquer valor que você receber.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Acesse <b className="text-white">Financeiro → Entradas</b>.</Passo>
              <Passo n={2}>Clique em <b className="text-white">Registrar entrada</b>.</Passo>
              <Passo n={3}>Preencha a descrição, o valor e a data de recebimento.</Passo>
              <Passo n={4}>Selecione a <b className="text-white">categoria</b> (Salário, Freelance, Renda Extra, etc.).</Passo>
              <Passo n={5}>Escolha a <b className="text-white">conta de destino</b> — onde o dinheiro foi recebido.</Passo>
              <Passo n={6}>Clique em <b className="text-white">Registrar</b>.</Passo>
            </ol>
            <Dica>O valor da entrada entra no cálculo do saldo daquela conta automaticamente na Visão Geral.</Dica>
          </div>
        ),
      },
    ],
  },

  // ── GASTOS FIXOS ──────────────────────────────────────
  {
    id: "gastos-fixos",
    icone: <Pin size={20} />,
    titulo: "Gastos Fixos",
    cor: "text-red-400",
    topicos: [
      {
        titulo: "Registrar uma despesa fixa",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Gastos fixos são despesas mensais recorrentes: aluguel, plano de saúde, assinatura, etc.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Acesse <b className="text-white">Financeiro → Gastos Fixos</b>.</Passo>
              <Passo n={2}>Clique em <b className="text-white">Nova despesa fixa</b>.</Passo>
              <Passo n={3}>Preencha o título e selecione a categoria.</Passo>
              <Passo n={4}>Informe o valor mensal.</Passo>
              <Passo n={5}>Defina o <b className="text-white">dia de vencimento</b> — aparecerá com alertas de cor quando a data se aproximar.</Passo>
              <Passo n={6}>Escolha o mês de início e a duração (sem fim ou até um mês específico).</Passo>
            </ol>
            <Dica>Se o valor variar por mês, selecione "Valor por mês" para definir cada mês individualmente.</Dica>
          </div>
        ),
      },
      {
        titulo: "Marcar como pago",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Marque cada despesa conforme você paga para acompanhar o progresso do mês.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Acesse <b className="text-white">Financeiro → Gastos Fixos</b>.</Passo>
              <Passo n={2}>Clique em qualquer item da lista.</Passo>
              <Passo n={3}>Se você tiver <b className="text-white">mais de uma conta</b> cadastrada, aparece o seletor <em>"Pagar de:"</em> — clique no nome da conta que foi debitada.</Passo>
              <Passo n={4}>O item fica verde com ✓ e a conta debitada aparece abaixo do nome.</Passo>
            </ol>
            <p>Para desmarcar, clique novamente no item pago.</p>
            <Dica>O valor pago é descontado do saldo daquela conta na Visão Geral.</Dica>
          </div>
        ),
      },
      {
        titulo: "Editar e excluir despesas",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Passe o mouse sobre um item para ver as opções de ação.</p>
            <ul className="flex flex-col gap-2 ml-2">
              <li><b className="text-white">✏️ Editar:</b> altera só o mês atual ou a partir do mês atual em diante (título, categoria, valor, duração).</li>
              <li><b className="text-white">🗑️ Excluir:</b> remove só este mês ou deste mês em diante. O histórico anterior é preservado.</li>
            </ul>
            <Dica>A fatura do cartão de crédito aparece automaticamente como uma linha de gasto fixo. Seu valor é calculado em tempo real com base nos parcelamentos, assinaturas e gastos do cartão.</Dica>
          </div>
        ),
      },
      {
        titulo: "Projeção anual",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Visualize todos os gastos fixos mês a mês ao longo do ano.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>No final da aba Gastos Fixos, clique em <b className="text-white">Projeção anual completa</b>.</Passo>
              <Passo n={2}>A tabela mostra cada gasto por mês.</Passo>
              <Passo n={3}>Clique em qualquer célula com valor para marcar como pago (fica verde).</Passo>
            </ol>
          </div>
        ),
      },
    ],
  },

  // ── CARTÕES ───────────────────────────────────────────
  {
    id: "cartoes",
    icone: <CreditCard size={20} />,
    titulo: "Cartões de Crédito",
    cor: "text-purple-400",
    topicos: [
      {
        titulo: "Registrar um parcelamento",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Registre compras parceladas para projetar automaticamente as faturas futuras.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Acesse <b className="text-white">Financeiro → Cartões</b> e expanda o cartão desejado.</Passo>
              <Passo n={2}>Clique em <b className="text-white">Novo parcelamento</b>.</Passo>
              <Passo n={3}>Informe a descrição, categoria, <b className="text-white">valor da parcela</b> e número de parcelas.</Passo>
              <Passo n={4}>Defina em qual mês cai a <b className="text-white">primeira parcela</b>.</Passo>
              <Passo n={5}>Clique em <b className="text-white">Salvar</b>.</Passo>
            </ol>
            <Dica>O sistema calcula automaticamente o total da compra e mostra na projeção de faturas dos próximos meses.</Dica>
          </div>
        ),
      },
      {
        titulo: "Registrar uma assinatura",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Assinaturas são cobranças mensais recorrentes sem data de fim definida (Netflix, Spotify, iCloud, etc.).</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Na aba <b className="text-white">Cartões</b>, expanda o cartão e clique em <b className="text-white">Nova assinatura</b>.</Passo>
              <Passo n={2}>Preencha o nome do serviço, categoria, valor e dia de cobrança.</Passo>
              <Passo n={3}>Defina o mês de início e clique em <b className="text-white">Salvar assinatura</b>.</Passo>
            </ol>
            <p>Para cancelar: passe o mouse sobre a assinatura e clique no ícone <b className="text-white">⊗ Cancelar</b>. O histórico é preservado.</p>
          </div>
        ),
      },
      {
        titulo: "Status da fatura e regra de fechamento",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>O sistema identifica automaticamente se a fatura está aberta ou fechada com base no dia de fechamento do cartão.</p>
            <ul className="flex flex-col gap-2 ml-2">
              <li><span className="text-emerald-400 font-medium">🟢 Fatura aberta:</span> hoje ≤ dia de fechamento. Você ainda pode adicionar gastos a esta fatura.</li>
              <li><span className="text-yellow-400 font-medium">🟡 Fatura fechada:</span> hoje {'>'} dia de fechamento. A fatura foi fechada e o sistema já projeta a próxima.</li>
            </ul>
            <p className="mt-1"><b className="text-white">Regra de invoice:</b> ao registrar um gasto no crédito, o sistema mostra em qual fatura ele vai cair. Se o dia do gasto for maior que o dia de fechamento, ele vai para a fatura do mês seguinte.</p>
          </div>
        ),
      },
    ],
  },

  // ── GASTOS VARIÁVEIS ──────────────────────────────────
  {
    id: "gastos-variaveis",
    icone: <Receipt size={20} />,
    titulo: "Gastos Variáveis",
    cor: "text-orange-400",
    topicos: [
      {
        titulo: "Registrar um gasto do dia a dia",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Registre qualquer gasto variável: refeições, transporte, compras, serviços, etc.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Acesse <b className="text-white">Financeiro → Gastos Variáveis</b>.</Passo>
              <Passo n={2}>Clique em <b className="text-white">Registrar gasto</b>.</Passo>
              <Passo n={3}>Preencha a descrição e o valor.</Passo>
              <Passo n={4}>Defina a data (padrão: hoje).</Passo>
              <Passo n={5}>Selecione a categoria. Se não souber, deixe em branco e o sistema infere automaticamente pelo nome do gasto.</Passo>
              <Passo n={6}>Escolha o meio de pagamento: Débito, Crédito, Pix, Dinheiro ou Vale Alimentação.</Passo>
              <Passo n={7}>Se crédito → escolha o cartão. Se débito/pix → escolha a conta.</Passo>
            </ol>
            <Dica>Ao selecionar crédito, o sistema mostra em qual fatura o gasto vai cair com base no dia de fechamento do cartão.</Dica>
          </div>
        ),
      },
      {
        titulo: "Visualizar e filtrar gastos",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Os gastos são exibidos agrupados por data, com resumo de totais e categorias no topo.</p>
            <ul className="flex flex-col gap-2 ml-2">
              <li><b className="text-white">Filtro de mês:</b> clique nos botões dos meses no topo para navegar entre períodos.</li>
              <li><b className="text-white">Busca:</b> use o campo de busca para filtrar por descrição.</li>
              <li><b className="text-white">Editar:</b> passe o mouse sobre um lançamento e clique no ✏️.</li>
              <li><b className="text-white">Excluir:</b> passe o mouse e clique no 🗑️.</li>
            </ul>
          </div>
        ),
      },
    ],
  },

  // ── RESERVAS ──────────────────────────────────────────
  {
    id: "reservas",
    icone: <PiggyBank size={20} />,
    titulo: "Reservas e Investimentos",
    cor: "text-blue-400",
    topicos: [
      {
        titulo: "Cadastrar uma reserva",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Registre onde seu dinheiro está guardado: CDB, Tesouro Direto, poupança, etc.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>Acesse <b className="text-white">Financeiro → Reservas</b>.</Passo>
              <Passo n={2}>Clique em <b className="text-white">Nova reserva</b>.</Passo>
              <Passo n={3}>Digite o nome (ex: "CDB Nubank"), selecione o tipo e informe o saldo atual.</Passo>
              <Passo n={4}>Opcionalmente, defina uma meta de valor.</Passo>
              <Passo n={5}>Clique em <b className="text-white">Salvar</b>.</Passo>
            </ol>
          </div>
        ),
      },
      {
        titulo: "Registrar um aporte",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Registre quando você adicionar dinheiro a uma reserva.</p>
            <ol className="flex flex-col gap-2 list-none">
              <Passo n={1}>No card da reserva, clique em <b className="text-white">Registrar aporte</b>.</Passo>
              <Passo n={2}>Digite o valor aportado.</Passo>
              <Passo n={3}>Selecione de qual conta o dinheiro saiu.</Passo>
              <Passo n={4}>Clique em <b className="text-white">Confirmar</b> (ou Enter).</Passo>
            </ol>
            <Dica>O valor do aporte é descontado do saldo da conta de origem automaticamente na Visão Geral.</Dica>
          </div>
        ),
      },
    ],
  },

  // ── VISÃO GERAL ───────────────────────────────────────
  {
    id: "visao-geral",
    icone: <Wallet size={20} />,
    titulo: "Visão Geral",
    cor: "text-indigo-400",
    topicos: [
      {
        titulo: "Entendendo o painel",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>A Visão Geral agrega todos os módulos e mostra a situação financeira em tempo real.</p>
            <ul className="flex flex-col gap-2 ml-2">
              <li><b className="text-white">Saldo em conta:</b> calculado como saldo inicial + entradas − débitos − aportes em reservas − gastos fixos pagos.</li>
              <li><b className="text-white">Gastos fixos pagos:</b> total das despesas fixas já marcadas como pagas no mês.</li>
              <li><b className="text-white">Faturas estimadas:</b> soma de parcelamentos + assinaturas + gastos variáveis no crédito.</li>
              <li><b className="text-white">Gastos variáveis:</b> total de gastos do dia a dia no mês atual.</li>
              <li><b className="text-white">Alertas de vencimento:</b> aparecem em laranja (vence em até 3 dias) ou vermelho (já venceu).</li>
              <li><b className="text-white">Limite disponível no crédito:</b> quanto você ainda pode gastar sem que a fatura ultrapasse o net do próximo mês.</li>
            </ul>
          </div>
        ),
      },
    ],
  },

  // ── CLAUDE MCP ────────────────────────────────────────
  {
    id: "claude-mcp",
    icone: <Bot size={20} />,
    titulo: "Integração com Claude (MCP)",
    cor: "text-teal-400",
    topicos: [
      {
        titulo: "O que é possível fazer pelo Claude",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Com a integração MCP, você interage com todos os seus dados financeiros diretamente pelo chat do Claude — sem abrir o app.</p>
            <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-white text-xs font-medium">Exemplos de perguntas e comandos:</p>
              <ul className="flex flex-col gap-1.5">
                {[
                  "gastei 45 no almoço hoje no débito caju",
                  "recebi meu salário de 15 mil na conta santander",
                  "como estão minhas finanças este mês?",
                  "quanto tenho na conta caju?",
                  "quais gastos fixos ainda preciso pagar?",
                  "mostra meus parcelamentos ativos",
                  "quanto gastei em alimentação este mês?",
                  "qual o saldo das minhas reservas?",
                ].map((ex, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-teal-500 shrink-0 mt-0.5">›</span>
                    <em className="text-gray-300">"{ex}"</em>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ),
      },
      {
        titulo: "Configurar no Claude.ai (passo a passo)",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <ol className="flex flex-col gap-3 list-none">
              <Passo n={1}>
                Acesse <b className="text-white">Configurações → Integrações MCP</b> no Meu Hub e clique em <b className="text-white">Nova chave</b>. Dê um nome e copie a chave gerada e a URL do servidor.
              </Passo>
              <Passo n={2}>
                Acesse <b className="text-white">claude.ai</b> → clique na sua foto → <b className="text-white">Configurações</b> → <b className="text-white">Conectores</b>.
              </Passo>
              <Passo n={3}>
                Clique no <b className="text-white">+</b> ao lado de "Conectores" → <b className="text-white">Adicionar conector personalizado</b>.
              </Passo>
              <Passo n={4}>
                Preencha o formulário:
                <div className="mt-2 bg-gray-800 rounded-lg p-3 flex flex-col gap-1.5">
                  <div className="flex gap-2"><span className="text-gray-500 w-16 shrink-0">Nome:</span><span className="text-white">Meu Hub</span></div>
                  <div className="flex gap-2 items-start"><span className="text-gray-500 w-16 shrink-0">URL:</span><code className="text-indigo-300 text-xs break-all">URL_DO_SERVIDOR?key=SUA_CHAVE</code></div>
                </div>
                <p className="mt-1 text-xs">Substitua <code className="text-indigo-300">URL_DO_SERVIDOR</code> e <code className="text-indigo-300">SUA_CHAVE</code> pelos valores copiados no passo 1.</p>
              </Passo>
              <Passo n={5}>
                Clique em <b className="text-white">Adicionar</b>. O conector "meu-hub" aparece na lista com 11 ferramentas.
              </Passo>
              <Passo n={6}>
                Clique em <b className="text-white">Requer aprovação</b> e mude para <b className="text-white">Sempre permitir</b> para não precisar confirmar cada ação.
              </Passo>
            </ol>
            <Alerta>Se aparecer um erro de OAuth ao vincular, ignore — é normal. O conector funciona mesmo assim pois usa autenticação por chave na URL.</Alerta>
          </div>
        ),
      },
      {
        titulo: "Configurar no Claude Code",
        conteudo: (
          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <p>Para usar no Claude Code (terminal), execute o comando abaixo substituindo a URL e a chave:</p>
            <div className="bg-gray-800 rounded-lg p-3">
              <code className="text-xs text-gray-300 break-all">
                claude mcp add meu-hub --transport http "URL_DO_SERVIDOR?key=SUA_CHAVE"
              </code>
            </div>
            <p>Após executar, reinicie o Claude Code. Na próxima sessão o servidor MCP estará ativo e você poderá registrar gastos diretamente no chat.</p>
          </div>
        ),
      },
    ],
  },
];

// ── COMPONENTES AUXILIARES ────────────────────────────

function Passo({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">{n}</span>
      <span>{children}</span>
    </li>
  );
}

function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl px-3 py-2.5">
      <span className="text-emerald-400 shrink-0">💡</span>
      <p className="text-emerald-300 text-xs">{children}</p>
    </div>
  );
}

function Alerta({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-yellow-950/30 border border-yellow-800/40 rounded-xl px-3 py-2.5">
      <span className="text-yellow-400 shrink-0">⚠️</span>
      <p className="text-yellow-300 text-xs">{children}</p>
    </div>
  );
}

// ── PÁGINA ────────────────────────────────────────────

export default function AjudaPage() {
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});
  const [secaoAberta, setSecaoAberta] = useState<string | null>("configuracoes");

  function toggleTopico(key: string) {
    setAbertos(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleSecao(id: string) {
    setSecaoAberta(prev => prev === id ? null : id);
  }

  const totalTopicos = SECOES.reduce((a, s) => a + s.topicos.length, 0);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center shrink-0">
          <BookOpen size={24} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Central de Ajuda</h2>
          <p className="text-gray-400 mt-1 text-sm">
            Guia completo do módulo financeiro · {SECOES.length} seções · {totalTopicos} tópicos
          </p>
        </div>
      </div>

      {/* Seções */}
      <div className="flex flex-col gap-3">
        {SECOES.map(secao => (
          <div key={secao.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {/* Header da seção */}
            <button
              onClick={() => toggleSecao(secao.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className={secao.cor}>{secao.icone}</span>
                <span className="text-base font-semibold text-white">{secao.titulo}</span>
                <span className="text-xs text-gray-500">{secao.topicos.length} {secao.topicos.length === 1 ? "tópico" : "tópicos"}</span>
              </div>
              {secaoAberta === secao.id
                ? <ChevronUp size={18} className="text-gray-500 shrink-0" />
                : <ChevronDown size={18} className="text-gray-500 shrink-0" />}
            </button>

            {/* Tópicos da seção */}
            {secaoAberta === secao.id && (
              <div className="border-t border-gray-800 divide-y divide-gray-800">
                {secao.topicos.map((topico, i) => {
                  const key = `${secao.id}-${i}`;
                  return (
                    <div key={key}>
                      <button
                        onClick={() => toggleTopico(key)}
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} className={abertos[key] ? "text-emerald-500" : "text-gray-700"} />
                          <span className="text-sm font-medium text-white">{topico.titulo}</span>
                        </div>
                        {abertos[key]
                          ? <ChevronUp size={15} className="text-gray-500 shrink-0" />
                          : <ChevronDown size={15} className="text-gray-500 shrink-0" />}
                      </button>
                      {abertos[key] && (
                        <div className="px-5 pb-5 pt-1">
                          {topico.conteudo}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
