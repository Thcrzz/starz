import { useEffect, useState, type InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  value: number;
  /** Disparado no blur com o número parseado (não em cada keystroke). */
  onChange: (value: number) => void;
};

/**
 * Wrapper sobre <Input type="number"> que evita o bug do "0" persistente:
 * quando o usuário apaga o conteúdo, o input fica vazio em vez de mostrar 0.
 *
 * - Mantém estado local de string, livre pra digitar.
 * - onChange só dispara no blur (com parseFloat do conteúdo, fallback 0).
 * - Display vazio quando o `value` externo é 0 — o focus naturalmente já
 *   encontra o input vazio sem precisar limpar manualmente.
 * - useEffect sincroniza display quando `value` muda externamente (ex.:
 *   reset do carrinho ou conversão de tipo de desconto).
 *
 * Aceita as mesmas props HTML de um <input type="number"> (min, max, step,
 * placeholder, className, disabled, etc.), exceto `value`/`onChange`/`type`,
 * que são controlados aqui.
 */
export default function NumberInput({ value, onChange, ...rest }: Props) {
  const [text, setText] = useState(value === 0 ? '' : String(value));

  useEffect(() => {
    setText(value === 0 ? '' : String(value));
  }, [value]);

  function handleBlur() {
    const num = parseFloat(text.replace(',', '.'));
    const final = Number.isFinite(num) ? num : 0;
    if (final !== value) onChange(final);
    setText(final === 0 ? '' : String(final));
  }

  return (
    <Input
      type="number"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      {...rest}
    />
  );
}
