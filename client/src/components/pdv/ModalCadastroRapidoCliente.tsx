import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { criarCliente } from '@/services/clientesService';
import { usePDVStore } from '@/store/pdvStore';

interface Props {
  aberto: boolean;
  onFechar: () => void;
  nomeInicial?: string;
}

export default function ModalCadastroRapidoCliente({
  aberto,
  onFechar,
  nomeInicial,
}: Props) {
  const setCliente = usePDVStore((s) => s.setCliente);

  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) setNome(nomeInicial ?? '');
  }, [aberto, nomeInicial]);

  async function handleSalvar() {
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      toast.error('Informe o nome do cliente');
      return;
    }
    setSalvando(true);
    try {
      const criado = await criarCliente({ nome: nomeTrim });
      setCliente(criado.id, criado.nome);
      toast.success('Cliente cadastrado e selecionado');
      onFechar();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error('CPF/CNPJ já cadastrado');
      } else {
        toast.error('Falha ao cadastrar cliente');
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="nc-nome">Nome</Label>
          <Input
            id="nc-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do cliente"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !salvando) handleSalvar();
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {salvando ? 'Salvando...' : 'Salvar e Selecionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
