const CHAVE = "cardapio_meus_pedidos";
const LIMITE = 15;

export type PedidoLocal = {
  id: string;
  criadoEm: string;
};

export function salvarPedidoLocal(id: string) {
  if (typeof window === "undefined") return;
  const atuais = listarPedidosLocais().filter((p) => p.id !== id);
  const novos = [{ id, criadoEm: new Date().toISOString() }, ...atuais].slice(0, LIMITE);
  window.localStorage.setItem(CHAVE, JSON.stringify(novos));
}

export function listarPedidosLocais(): PedidoLocal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHAVE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function removerPedidoLocal(id: string) {
  if (typeof window === "undefined") return;
  const atuais = listarPedidosLocais().filter((p) => p.id !== id);
  window.localStorage.setItem(CHAVE, JSON.stringify(atuais));
}