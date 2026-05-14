import { useCallback, useState } from 'react';

/**
 * Hook para inputs de valor monetário no padrão brasileiro.
 * Armazena internamente em centavos (inteiro) e formata da direita pra esquerda.
 * Ex.: digitar "1" → "0,01", "123" → "1,23", "1234567" → "12.345,67".
 * Para zerar: apagar tudo.
 */
export function useMoneyInput(initialValue: number = 0) {
  const [cents, setCents] = useState<number>(Math.round(initialValue * 100));

  const format = useCallback((c: number): string => {
    if (c === 0) return '0,00';
    const str = String(c).padStart(3, '0');
    const reais = str.slice(0, -2);
    const centavos = str.slice(-2);
    const reaisFormatado = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${reaisFormatado},${centavos}`;
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '');
      if (digits === '') {
        setCents(0);
        return;
      }
      const newCents = parseInt(digits, 10);
      setCents(Math.min(newCents, 999999999));
    },
    [],
  );

  const value = cents / 100;
  const display = format(cents);

  const setValue = useCallback((v: number) => {
    setCents(Math.round((v || 0) * 100));
  }, []);

  return { value, display, handleChange, setValue };
}

/** Formata número como moeda BR (sem prefixo). Ex: 1234.5 → "1.234,50" */
export function formatMoney(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '0,00';
  const cents = Math.round(Math.abs(value) * 100);
  const str = String(cents).padStart(3, '0');
  const reais = str.slice(0, -2);
  const centavos = str.slice(-2);
  const reaisFormatado = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sinal = value < 0 ? '-' : '';
  return `${sinal}${reaisFormatado},${centavos}`;
}

/** Parseia string monetária BR para número. Ex: "1.234,56" → 1234.56 */
export function parseMoney(display: string): number {
  const digits = display.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}
