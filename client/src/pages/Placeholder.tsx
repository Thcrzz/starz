import { Construction } from 'lucide-react';

interface PlaceholderProps {
  titulo: string;
  descricao?: string;
}

/**
 * Página placeholder usada nas rotas ainda não implementadas.
 */
export default function Placeholder({ titulo, descricao }: PlaceholderProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-20 text-center">
      <Construction className="mb-4 h-12 w-12 text-primary" />
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {descricao ?? 'Esta seção será implementada em breve.'}
      </p>
    </div>
  );
}
