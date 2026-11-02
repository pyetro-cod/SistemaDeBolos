export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      estabelecimentos: {
        Row: {
          criado_em: string;
          id: string;
          logo_url: string | null;
          nome: string;
        };
        Insert: {
          criado_em?: string;
          id?: string;
          logo_url?: string | null;
          nome: string;
        };
        Update: {
          criado_em?: string;
          id?: string;
          logo_url?: string | null;
          nome?: string;
        };
        Relationships: [];
      };
      itens_pedido: {
        Row: {
          criado_em: string;
          id: string;
          nome_produto: string;
          observacoes: string | null;
          pedido_id: string;
          preco_unitario: number;
          produto_id: string | null;
          quantidade: number;
          tamanho: string;
        };
        Insert: {
          criado_em?: string;
          id?: string;
          nome_produto: string;
          observacoes?: string | null;
          pedido_id: string;
          preco_unitario?: number;
          produto_id?: string | null;
          quantidade?: number;
          tamanho?: string;
        };
        Update: {
          criado_em?: string;
          id?: string;
          nome_produto?: string;
          observacoes?: string | null;
          pedido_id?: string;
          preco_unitario?: number;
          produto_id?: string | null;
          quantidade?: number;
          tamanho?: string;
        };
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey";
            columns: ["pedido_id"];
            isOneToOne: false;
            referencedRelation: "pedidos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey";
            columns: ["produto_id"];
            isOneToOne: false;
            referencedRelation: "produtos";
            referencedColumns: ["id"];
          },
        ];
      };
      pedidos: {
        Row: {
          atualizado_em: string;
          bairro: string | null;
          complemento: string | null;
          criado_em: string;
          endereco: string | null;
          forma_pagamento: string;
          id: string;
          nome_cliente: string;
          numero: string | null;
          origem: string;
          pagamento_confirmado: boolean;
          referencia: string | null;
          status: Database["public"]["Enums"]["pedido_status"];
          taxa_entrega: number;
          telefone: string | null;
          tipo_entrega: string;
          total: number;
          troco: number | null;
          valor_para_troco: number | null;
          visualizado: boolean;
        };
        Insert: {
          atualizado_em?: string;
          bairro?: string | null;
          complemento?: string | null;
          criado_em?: string;
          endereco?: string | null;
          forma_pagamento?: string;
          id?: string;
          nome_cliente?: string;
          numero?: string | null;
          origem?: string;
          pagamento_confirmado?: boolean;
          referencia?: string | null;
          status?: Database["public"]["Enums"]["pedido_status"];
          taxa_entrega?: number;
          telefone?: string | null;
          tipo_entrega?: string;
          total?: number;
          troco?: number | null;
          valor_para_troco?: number | null;
          visualizado?: boolean;
        };
        Update: {
          atualizado_em?: string;
          bairro?: string | null;
          complemento?: string | null;
          criado_em?: string;
          endereco?: string | null;
          forma_pagamento?: string;
          id?: string;
          nome_cliente?: string;
          numero?: string | null;
          origem?: string;
          pagamento_confirmado?: boolean;
          referencia?: string | null;
          status?: Database["public"]["Enums"]["pedido_status"];
          taxa_entrega?: number;
          telefone?: string | null;
          tipo_entrega?: string;
          total?: number;
          troco?: number | null;
          valor_para_troco?: number | null;
          visualizado?: boolean;
        };
        Relationships: [];
      };
      produtos: {
        Row: {
          ativo: boolean;
          categoria: string;
          criado_em: string;
          descricao: string | null;
          estabelecimento_id: string;
          estoque_meios: number;
          foto_url: string | null;
          id: string;
          nome: string;
          preco_inteiro: number;
          preco_metade: number;
          tags: string[];
        };
        Insert: {
          ativo?: boolean;
          categoria?: string;
          criado_em?: string;
          descricao?: string | null;
          estabelecimento_id: string;
          estoque_meios?: number;
          foto_url?: string | null;
          id?: string;
          nome: string;
          preco_inteiro?: number;
          preco_metade?: number;
          tags?: string[];
        };
        Update: {
          ativo?: boolean;
          categoria?: string;
          criado_em?: string;
          descricao?: string | null;
          estabelecimento_id?: string;
          estoque_meios?: number;
          foto_url?: string | null;
          id?: string;
          nome?: string;
          preco_inteiro?: number;
          preco_metade?: number;
          tags?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "produtos_estabelecimento_id_fkey";
            columns: ["estabelecimento_id"];
            isOneToOne: false;
            referencedRelation: "estabelecimentos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      criar_pedido_publico: {
        Args: {
          p_bairro: string;
          p_complemento: string;
          p_endereco: string;
          p_forma_pagamento: string;
          p_itens: Json;
          p_nome_cliente: string;
          p_numero: string;
          p_referencia: string;
          p_telefone: string;
          p_tipo_entrega: string;
          p_troco?: number;
          p_valor_para_troco?: number;
        };
        Returns: string;
      };
      obter_pedido_publico: {
        Args: { p_id: string };
        Returns: {
          atualizado_em: string;
          bairro: string;
          complemento: string;
          criado_em: string;
          endereco: string;
          forma_pagamento: string;
          id: string;
          itens: Json;
          nome_cliente: string;
          numero: string;
          pagamento_confirmado: boolean;
          referencia: string;
          status: Database["public"]["Enums"]["pedido_status"];
          taxa_entrega: number;
          telefone: string;
          tipo_entrega: string;
          total: number;
          troco: number;
          valor_para_troco: number;
        }[];
      };
      registrar_venda_balcao: {
        Args: { p_forma_pagamento: string; p_itens: Json };
        Returns: string;
      };
    };
    Enums: {
      pedido_status: "recebido" | "preparo" | "pronto" | "entregue" | "fechado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      pedido_status: ["recebido", "preparo", "pronto", "entregue", "fechado"],
    },
  },
} as const;
