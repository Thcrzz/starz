import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useMoneyInput } from '@/hooks/useMoneyInput';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  /** classes aplicadas no <input>; permite override de altura/largura */
  className?: string;
  /** classes aplicadas no wrapper relativo (raro precisar) */
  wrapperClassName?: string;
  prefix?: boolean;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
}

/**
 * Input monetário com máscara automática BR (R$).
 * Digita só números, formatação automática da direita pra esquerda.
 * Apagar tudo zera para "0,00".
 */
export default function MoneyInput({
  value,
  onChange,
  placeholder,
  className,
  wrapperClassName,
  prefix = true,
  disabled,
  id,
  autoFocus,
  ariaLabel,
}: MoneyInputProps) {
  const { display, handleChange, setValue, value: internalValue } =
    useMoneyInput(value);

  // Sincroniza quando o pai muda o valor externamente (ex: limpar carrinho)
  const lastExternalRef = useRef(value);
  useEffect(() => {
    if (value !== lastExternalRef.current && value !== internalValue) {
      setValue(value);
    }
    lastExternalRef.current = value;
  }, [value, internalValue, setValue]);

  // Propaga mudanças internas para o pai. Mantém o onChange numa ref pra que
  // o effect não dispare quando o pai passa uma arrow function inline
  // (referência nova a cada render — causaria re-fires desnecessários).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const lastEmittedRef = useRef(internalValue);
  useEffect(() => {
    if (internalValue !== lastEmittedRef.current) {
      lastEmittedRef.current = internalValue;
      onChangeRef.current(internalValue);
    }
  }, [internalValue]);

  return (
    <div className={cn('relative', wrapperClassName)}>
      {prefix && (
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          R$
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder ?? '0,00'}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          'px-3 py-2 text-right',
          prefix && 'pl-8',
          className,
        )}
      />
    </div>
  );
}
