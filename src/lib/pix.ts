export type PixConfig = {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
};

function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

function sanitize(value: string, maxLength: number): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, "") // mantém alfanumérico + espaço
    .trim()
    .slice(0, maxLength);
}

// CRC16-CCITT (padrão exigido pelo BR Code do Banco Central)
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Gera o payload EMV (código "copia e cola") do PIX, usado tanto no QR quanto no botão de copiar. */
export function gerarPayloadPix(config: PixConfig, valor: number, identificador: string): string {
  const merchantAccount = tlv("00", "br.gov.bcb.pix") + tlv("01", config.chave);
  const merchantName = sanitize(config.nomeRecebedor, 25) || "LOJA";
  const merchantCity = sanitize(config.cidade, 15) || "CIDADE";
  const txid = sanitize(identificador, 25).replace(/\s/g, "") || "***";

  const semCrc =
    tlv("00", "01") +
    tlv("26", merchantAccount) +
    tlv("52", "0000") +
    tlv("53", "986") +
    (valor > 0 ? tlv("54", valor.toFixed(2)) : "") +
    tlv("58", "BR") +
    tlv("59", merchantName) +
    tlv("60", merchantCity) +
    tlv("62", tlv("05", txid)) +
    "6304";

  return semCrc + crc16(semCrc);
}

export function obterConfigPix(): PixConfig | null {
  const chave = import.meta.env.VITE_PIX_CHAVE as string | undefined;
  if (!chave) return null;
  return {
    chave,
    nomeRecebedor: (import.meta.env.VITE_PIX_NOME_RECEBEDOR as string) || "LOJA",
    cidade: (import.meta.env.VITE_PIX_CIDADE as string) || "CIDADE",
  };
}