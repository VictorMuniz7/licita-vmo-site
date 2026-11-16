/**
 * Configuração do portal.
 * Com supabaseUrl vazio o site roda em MODO DEMONSTRAÇÃO (dados de exemplo, sem backend),
 * útil para ver as telas. Preencha com os dados do projeto Supabase do Licita-VMO para produção.
 */
export const config = {
  supabaseUrl: '',
  supabaseAnonKey: '',

  /** Endereço do sistema Licita-VMO (site separado, mesmo banco). */
  licitaVmoUrl: 'https://app.licitavmo.com.br',

  /** WhatsApp comercial da VMO, só números com DDI. */
  whatsappComercial: '5544999999999',
  emailContato: 'contato@vmosistemas.com.br',
};

export const MODO_DEMO = !config.supabaseUrl;
