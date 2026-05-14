import { useEffect, useState } from 'react';
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
import MoneyInput from '@/components/ui/MoneyInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePDVStore } from '@/store/pdvStore';
import { criarProdutoAvulso } from '@/services/produtosService';

interface Props {
  aberto: boolean;
  onFechar: () => void;
  nomeInicial?: string;
}

const unidadesValidas = ['un', 'm', 'kg', 'cx'];

export default function ModalProdutoAvulso({
  aberto,
  onFechar,
  nomeInicial,
}: Props) {
  const adicionarItem = usePDVStore((s) => s.adicionarItem);

  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState<number>(0);
  const [quantidade, setQuantidade] = useState('1');
  const [unidade, setUnidade] = useState('un');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setNome(nomeInicial ?? '');
      setPreco(0);
      setQuantidade('1');
      setUnidade('un');
    }
  }, [aberto, nomeInicial]);

  function resetar() {
    setNome('');
    setPreco(0);
    setQuantidade('1');
    setUnidade('un');
  }

  async function handleAdicionar() {
    const nomeTrim = nome.trim();
    const qtdNum = Number(quantidade.replace(',', '.'));

    if (!nomeTrim) {
      toast.error('Informe o nome do produto');
      return;
    }
    if (!Number.isFinite(preco) || preco <= 0) {
      toast.error('Informe um preço válido');
      return;
    }
    if (!Number.isFinite(qtdNum) || qtdNum <= 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }
    if (!unidadesValidas.includes(unidade)) {
      toast.error('Unidade inválida');
      return;
    }

    setSalvando(true);
    try {
      const criado = await criarProdutoAvulso({
        nome: nomeTrim,
        preco,
        unidade,
      });

      adicionarItem({
        id: crypto.randomUUID(),
        variacao_id: criado.id,
        descricao: nomeTrim,
        preco_unitario: preco,
        preco_original: preco,
        quantidade: qtdNum,
        desconto_item: 0,
        total_item: preco * qtdNum,
        e_avulso: true,
        unidade,
      });

      toast.success('Produto avulso adicionado ao carrinho');
      resetar();
      onFechar();
    } catch {
      toast.error('Falha ao criar produto avulso');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(o) => {
        if (!o) {
          resetar();
          onFechar();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Produto Avulso</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="avulso-nome">Nome do produto</Label>
            <Input
              id="avulso-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Frete, Serviço extra..."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="avulso-preco">Preço unitário</Label>
              <MoneyInput
                id="avulso-preco"
                value={preco}
                onChange={setPreco}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="avulso-qtd">Quantidade</Label>
              <Input
                id="avulso-qtd"
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Unidade</Label>
            <Select value={unidade} onValueChange={setUnidade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="un">Unidade (un)</SelectItem>
                <SelectItem value="m">Metro (m)</SelectItem>
                <SelectItem value="kg">Quilo (kg)</SelectItem>
                <SelectItem value="cx">Caixa (cx)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              resetar();
              onFechar();
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleAdicionar} disabled={salvando}>
            {salvando ? 'Adicionando...' : 'Adicionar ao Carrinho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
