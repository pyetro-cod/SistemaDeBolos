import { useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy } from "lucide-react";
import { gerarPayloadPix, obterConfigPix } from "@/lib/pix";

export function PixQrCode({ valor, identificador }: { valor: number; identificador: string }) {
  const [copiado, setCopiado] = useState(false);
  const config = obterConfigPix();

  if (!config) {
    return (
      <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
        Chave PIX não configurada pelo lojista. Combine o pagamento diretamente.
      </p>
    );
  }

  const payload = gerarPayloadPix(config, valor, identificador);

  async function copiar() {
    await navigator.clipboard.writeText(payload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-4">
      <div className="rounded-lg bg-white p-3">
        <QRCode value={payload} size={180} />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Escaneie com o app do seu banco ou copie o código PIX abaixo
      </p>
      <button
        type="button"
        onClick={copiar}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
      >
        {copiado ? (
          <>
            <Check className="size-3.5 text-success" strokeWidth={1.5} />
            Copiado!
          </>
        ) : (
          <>
            <Copy className="size-3.5" strokeWidth={1.5} />
            Copiar código PIX
          </>
        )}
      </button>
    </div>
  );
}