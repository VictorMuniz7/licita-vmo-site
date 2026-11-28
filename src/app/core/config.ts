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

  /** WhatsApp comercial da VMO, só números com DDI. É o número usado nos botões do site. */
  whatsappComercial: '554498227263',
  /** Segundo WhatsApp, mostrado no rodapé. */
  whatsappComercial2: '5518981709943',
  emailContato: 'contato@vmosistemas.com.br',

  /**
   * false = pré-lançamento: os botões de contratar mostram "Lançamento em breve" em vez de
   * levar ao cadastro e ao pagamento. Troque para true no dia do lançamento.
   */
  vendasAbertas: false,
};

export const MODO_DEMO = !config.supabaseUrl;
