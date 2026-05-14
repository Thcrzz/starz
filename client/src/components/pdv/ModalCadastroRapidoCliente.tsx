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
import { consultarCnpj, criarCliente } from '@/services/clientesService';
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
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');

  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setNome(nomeInicial ?? '');
      setCpfCnpj('');
      setTelefone('');
      setEmail('');
      setCidade('');
      setUf('');
      setCep('');
      setLogradouro('');
      setNumero('');
      setComplemento('');
      setBairro('');
    }
  }, [aberto, nomeInicial]);

  async function handleConsultarCnpj() {
    const numeros = cpfCnpj.replace(/\D/g, '');
    if (numeros.length !== 14) {
      toast.error('CNPJ deve ter 14 dígitos');
      return;
    }
    setConsultandoCnpj(true);
    try {
      const dados = await consultarCnpj(numeros);
      setNome(dados.razao_social ?? dados.nome_fantasia ?? nome);
      setLogradouro(dados.logradouro ?? '');
      setNumero(dados.numero ?? '');
      setComplemento(dados.complemento ?? '');
      setBairro(dados.bairro ?? '');
      setCidade(dados.municipio ?? '');
      setUf(dados.uf ?? '');
      setCep(dados.cep ?? '');
      if (dados.ddd_telefone_1) setTelefone(dados.ddd_telefone_1);
      if (dados.email) setEmail(dados.email);
      toast.success('Dados preenchidos pela BrasilAPI');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao consultar CNPJ';
      toast.error(msg);
    } finally {
      setConsultandoCnpj(false);
    }
  }

  async function handleSalvar() {
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      toast.error('Informe o nome do cliente');
      return;
    }
    setSalvando(true);
    try {
      const criado = await criarCliente({
        nome: nomeTrim,
        cpf_cnpj: cpfCnpj.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        cidade: cidade.trim() || null,
        uf: uf.trim() || null,
        cep: cep.trim() || null,
        logradouro: logradouro.trim() || null,
        numero: numero.trim() || null,
        complemento: complemento.trim() || null,
        bairro: bairro.trim() || null,
      });
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-2">
          <div className="grid gap-1.5">
            <Label htmlFor="nc-nome">Nome *</Label>
            <Input
              id="nc-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="nc-cpfcnpj">CPF / CNPJ</Label>
            <div className="flex gap-2">
              <Input
                id="nc-cpfcnpj"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="Somente números ou formatado"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleConsultarCnpj}
                disabled={consultandoCnpj}
              >
                {consultandoCnpj && (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                )}
                Consultar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Consulta CNPJ preenche endereço e telefone via BrasilAPI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="nc-tel">Telefone</Label>
              <Input
                id="nc-tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-email">Email</Label>
              <Input
                id="nc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="nc-cidade">Cidade</Label>
              <Input
                id="nc-cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-uf">UF</Label>
              <Input
                id="nc-uf"
                maxLength={2}
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr_140px] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="nc-cep">CEP</Label>
              <Input
                id="nc-cep"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-log">Logradouro</Label>
              <Input
                id="nc-log"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-num">Número</Label>
              <Input
                id="nc-num"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="nc-bairro">Bairro</Label>
              <Input
                id="nc-bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-compl">Complemento</Label>
              <Input
                id="nc-compl"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
              />
            </div>
          </div>
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
