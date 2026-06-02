"use client";

import { useState } from "react";
import { CategoriaConfig, CORES_CATEGORIA, getCorCategoria } from "@/lib/config-store";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface Props {
  categorias: CategoriaConfig[];
  onAdd: (c: CategoriaConfig) => void;
  onUpdate: (c: CategoriaConfig) => void;
  onRemove: (id: string) => void;
}

export default function CategoriasSection({ categorias, onAdd, onUpdate, onRemove }: Props) {
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Categorias</h3>
          <p className="text-sm text-gray-500 mt-0.5">Categorias para classificar despesas e gastos</p>
        </div>
        <button
          onClick={() => { setCriando(true); setEditandoId(null); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      {/* Formulário de nova categoria */}
      {criando && (
        <FormCategoria
          onSalvar={(c) => { onAdd(c); setCriando(false); }}
          onCancelar={() => setCriando(false)}
        />
      )}

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {categorias.map((cat) => (
          editandoId === cat.id ? (
            <FormCategoria
              key={cat.id}
              inicial={cat}
              onSalvar={(c) => { onUpdate(c); setEditandoId(null); }}
              onCancelar={() => setEditandoId(null)}
            />
          ) : (
            <CategoriaItem
              key={cat.id}
              categoria={cat}
              onEditar={() => { setEditandoId(cat.id); setCriando(false); }}
              onExcluir={() => onRemove(cat.id)}
            />
          )
        ))}
      </div>

      {categorias.length === 0 && !criando && (
        <div className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center">
          <p className="text-gray-500 text-sm mb-2">Nenhuma categoria cadastrada</p>
          <button onClick={() => setCriando(true)} className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
            + Criar primeira categoria
          </button>
        </div>
      )}
    </div>
  );
}

// ── ITEM DE CATEGORIA ─────────────────────────────────────

function CategoriaItem({ categoria, onEditar, onExcluir }: {
  categoria: CategoriaConfig;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const cor = getCorCategoria(categoria.cor);
  return (
    <div className="group flex items-center justify-between px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${cor.chip}`} />
        <span className="text-sm font-medium text-white">{categoria.nome}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${cor.bg} ${cor.text}`}>
          {cor.label}
        </span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEditar} className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-700 rounded-lg transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={onExcluir} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── FORMULÁRIO (criar ou editar) ──────────────────────────

function FormCategoria({ inicial, onSalvar, onCancelar }: {
  inicial?: CategoriaConfig;
  onSalvar: (c: CategoriaConfig) => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [cor, setCor] = useState(inicial?.cor ?? CORES_CATEGORIA[0].id);

  const podeSalvar = nome.trim();
  const corAtual = getCorCategoria(cor);

  function handleSalvar() {
    if (!podeSalvar) return;
    onSalvar({
      id: inicial?.id ?? `cat-${Date.now()}`,
      nome: nome.trim(),
      cor,
    });
  }

  return (
    <div className="bg-gray-900 border border-indigo-600/50 rounded-xl p-4 mb-2">
      {/* Nome */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Nome da categoria</label>
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && podeSalvar && handleSalvar()}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600"
          placeholder="Ex: Alimentação, Transporte, Lazer..."
        />
      </div>

      {/* Cor */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Cor</label>
        <div className="flex gap-2 flex-wrap">
          {CORES_CATEGORIA.map((c) => (
            <button
              key={c.id}
              onClick={() => setCor(c.id)}
              title={c.label}
              className={`w-7 h-7 rounded-full ${c.chip} flex items-center justify-center transition-transform hover:scale-110 ${
                cor === c.id ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : ""
              }`}
            >
              {cor === c.id && <Check size={12} className="text-white" />}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Selecionado: <span className={corAtual.text}>{corAtual.label}</span>
        </p>
      </div>

      {/* Preview */}
      {nome && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">Prévia:</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${corAtual.bg} ${corAtual.text}`}>
            {nome}
          </span>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={onCancelar}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
        >
          <X size={14} /> Cancelar
        </button>
        <button
          onClick={handleSalvar}
          disabled={!podeSalvar}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Check size={14} /> {inicial ? "Salvar" : "Criar"}
        </button>
      </div>
    </div>
  );
}
