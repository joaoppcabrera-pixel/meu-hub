import { Calendar, TrendingDown, Dumbbell, Utensils } from "lucide-react";

const cards = [
  {
    title: "Próximos compromissos",
    icon: Calendar,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    items: [
      { label: "Reunião de trabalho", sub: "Hoje, 14h00" },
      { label: "Consulta médica", sub: "Amanhã, 09h30" },
      { label: "Aniversário da Maria", sub: "Sexta, dia 06" },
    ],
  },
  {
    title: "Financeiro do mês",
    icon: TrendingDown,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    items: [
      { label: "Orçamento disponível", sub: "R$ 2.400,00" },
      { label: "Gasto até hoje", sub: "R$ 1.120,00" },
      { label: "Saldo restante", sub: "R$ 1.280,00" },
    ],
  },
  {
    title: "Treino de hoje",
    icon: Dumbbell,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    items: [
      { label: "Último treino", sub: "Ontem — Peito e Tríceps" },
      { label: "Sequência atual", sub: "4 dias consecutivos" },
      { label: "Treinos na semana", sub: "3 de 5 planejados" },
    ],
  },
  {
    title: "Dieta de hoje",
    icon: Utensils,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    items: [
      { label: "Calorias", sub: "1.840 / 2.400 kcal" },
      { label: "Proteína", sub: "142g / 180g" },
      { label: "Carboidratos", sub: "210g / 280g" },
    ],
  },
];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Bom dia! 👋</h2>
        <p className="text-gray-400 mt-1">Aqui está o resumo do seu dia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map(({ title, icon: Icon, color, bg, items }) => (
          <div
            key={title}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon size={20} className={color} />
              </div>
              <h3 className="font-semibold text-white">{title}</h3>
            </div>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{item.label}</span>
                  <span className="text-sm font-medium text-white">{item.sub}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
