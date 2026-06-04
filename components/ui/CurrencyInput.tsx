"use client";

import { useState, useEffect } from "react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
  className = "",
  autoFocus,
  onKeyDown,
}: Props) {
  function toDisplay(num: number): string {
    if (num === 0) return "";
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const [display, setDisplay] = useState(toDisplay(value));

  // Reseta o display quando valor externo volta a 0 (ex: fechar modal)
  useEffect(() => {
    if (value === 0) setDisplay("");
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDisplay("");
      onChange(0);
      return;
    }
    const num = parseInt(raw, 10) / 100;
    setDisplay(
      num.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    onChange(num);
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={`w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-gray-600 ${className}`}
      />
    </div>
  );
}
