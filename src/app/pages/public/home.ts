import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { config } from '../../core/config';
import { PortalService } from '../../core/portal.service';
import { PlanoCard } from '../../shared/plano-card';
import { SiteFooter } from '../../shared/site-footer';
import { SiteHeader } from '../../shared/site-header';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SiteHeader, SiteFooter, PlanoCard],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  protected portal = inject(PortalService);
  protected whatsDuvida = 'https://wa.me/' + config.whatsappComercial + '?text=' + encodeURIComponent('Olá! Tenho uma dúvida sobre o Radar de licitações e o Licita-VMO.');

  protected vendasAbertas = config.vendasAbertas;
  protected whatsAviso = 'https://wa.me/' + config.whatsappComercial + '?text=' + encodeURIComponent('Olá! Quero ser avisado quando o Licita-VMO for lançado.');

  protected recursosRadar = ['Filtro por ramo, região e valor', 'Resumo em texto e áudio', 'Perguntas ao edital no WhatsApp', 'Lembrete de cada prazo', 'Cofre de certidões', 'Aviso de certidão vencendo'];
  protected recursosLicita = ['Licitações com status e prazos', 'Itens importados do Excel', 'Proposta e declarações em PDF', 'Atas, contratos e anexos', 'Relatórios de ganhos e perdas', 'Equipe com perfis e auditoria'];

  /** linhas da simulação da tela do Licita-VMO (dados fictícios) */
  protected telaLicitacoes = [
    { n: 'Pregão 045/2026 · Material de limpeza', o: 'Prefeitura de Exemplo (PR)', p: 'Sessão 10/11', s: 'Proposta enviada', c: 'selo-neutro' },
    { n: 'Pregão 031/2026 · Descartáveis', o: 'Câmara Municipal de Exemplo (SP)', p: 'Recurso até 14/11', s: 'Em recurso', c: 'selo-atencao' },
    { n: 'Pregão 019/2026 · Higiene hospitalar', o: 'Consórcio de Saúde de Exemplo (PR)', p: 'Contrato 12 meses', s: 'Ganha', c: 'selo-ok' },
    { n: 'Dispensa 012/2026 · Papel toalha', o: 'Autarquia de Exemplo (SP)', p: 'Lote 2', s: 'Desclassificada', c: 'selo-erro' },
  ];

  protected modulosLicita = [
    { t: 'Licitações', d: 'Cadastro, filtros e status rápido de cada processo, com os prazos de recurso e impugnação à vista.', i: 'M4 5h16M4 12h16M4 19h10' },
    { t: 'Itens e preços', d: 'Itens importados da planilha do edital, vencedor e desclassificação por item e histórico de preço.', i: 'M4 4h16v16H4zM4 10h16M10 4v16' },
    { t: 'Proposta e declarações', d: 'PDF gerado com os dados da empresa, pronto para anexar no portal de compras.', i: 'M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h4' },
    { t: 'Atas, contratos e anexos', d: 'Arquivos guardados dentro da licitação, fáceis de achar meses depois, na hora da entrega.', i: 'M21 12l-8.5 8.5a5 5 0 01-7-7L14 5a3.3 3.3 0 014.7 4.7L10 18.4a1.7 1.7 0 01-2.4-2.4L15.5 8' },
    { t: 'Empresa e contratantes', d: 'Dados da empresa, conta bancária, documentos e o cadastro de cada órgão com quem você já negociou.', i: 'M4 21V7l8-4 8 4v14M9 21v-6h6v6M9 10h.01M15 10h.01' },
    { t: 'Relatórios', d: 'Ganhas, perdidas e desclassificadas, ranking de contratantes e histórico de cada item.', i: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
    { t: 'Dashboard, metas e entregas', d: 'A visão do mês: o que está em disputa, o que foi ganho, a meta e o que falta entregar.', i: 'M12 3a9 9 0 109 9h-9zM15 3.5A9 9 0 0120.5 9H15z' },
    { t: 'Equipe e auditoria', d: 'Perfis de administrador, moderador e usuário. Cada ação importante fica registrada.', i: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a7 7 0 0114 0v1M17 3.5a4 4 0 010 7M22 21v-1a7 7 0 00-4-6.3' },
  ];

  protected etapas = [
    { t: 'Encontra', d: 'Todo dia às 6h, lê as licitações novas nos portais oficiais e filtra pelo perfil da sua empresa.', r: 'Só o que você pode disputar, sem lista de 300 editais.' },
    { t: 'Lê e resume', d: 'A IA lê o PDF inteiro e manda no WhatsApp um resumo de uma página e um áudio de um a dois minutos.', r: 'Cada exigência com a página do edital.' },
    { t: 'Lembra', d: 'Avisos antes de cada prazo: esclarecimento, impugnação, sessão, recurso e entrega.', r: 'A sua equipe não perde sessão por esquecimento.' },
    { t: 'Organiza', d: 'A licitação vira processo no Licita-VMO, com os itens importados da planilha e os documentos da empresa.', r: 'A equipe toda vê o mesmo processo.' },
    { t: 'Propõe', d: 'Proposta e declarações em PDF geradas com os dados da empresa, prontas para o portal.', r: 'Sem redigitar CNPJ, endereço e conta.' },
    { t: 'Acompanha', d: 'Vencedor por item, ata, contrato e entregas registrados. Os relatórios mostram o que a empresa ganhou e perdeu.', r: 'O histórico de preço ajuda no próximo lance.' },
  ];

  protected diferenciais = [
    { t: 'Resumo do edital em áudio', d: 'Dois minutos no WhatsApp para ouvir no carro, entre uma entrega e outra. Cem páginas viram uma conversa.', i: 'M4 15v-3a8 8 0 0116 0v3M4 14h3v6H4zM17 14h3v6h-3z' },
    { t: 'Compatibilidade pelos seus documentos', d: 'O radar cruza o edital com seus atestados, certidões e balanço e diz o que falta, inclusive se o atestado cobre a quantidade exigida.', i: 'M14 3H6v18h12V7zM14 3v4h4M9 14l2 2 4-4' },
    { t: 'Certidão vencida não pega ninguém de surpresa', d: 'Aviso no WhatsApp 10 dias antes de cada vencimento, dizendo quais licitações abertas ficam travadas sem o documento.', i: 'M6 9a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0' },
    { t: 'Histórico de preço por item', d: 'O Licita-VMO guarda quanto você ofertou e quanto o vencedor levou em cada item. Na próxima disputa do mesmo produto, você já sabe onde está o preço.', i: 'M3 17l6-6 4 4 8-8M15 7h6v6' },
    { t: 'Relatório de onde você ganha e perde', d: 'Ganhas, perdidas e desclassificadas por motivo, e o ranking dos órgãos que mais compram de você. Dá para decidir onde vale insistir.', i: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
    { t: 'Sem fidelidade, de verdade', d: 'Mensal por CNPJ, sem contrato de 12 meses e sem renovação escondida. Cancele pelo painel em dois cliques.', i: 'M5 11h14v10H5zM8 11V7a4 4 0 017.5-2' },
  ];

  protected duvidas = [
    { p: 'Preciso contratar os dois serviços?', r: 'Não. O Radar e o Licita-VMO são vendidos separados. Quem contrata os dois no plano Radar + Gestão paga menos e ganha a integração: a licitação que chega no WhatsApp vira processo no Licita-VMO com um toque.' },
    { p: 'O que dá para fazer no Licita-VMO?', r: 'Controlar cada licitação do começo ao fim: cadastro do edital com status e prazos, itens importados da planilha, proposta e declarações em PDF, atas, contratos e anexos, documentos da empresa e dos contratantes, dashboard com metas e entregas, e relatórios de licitações ganhas, perdidas e desclassificadas.' },
    { p: 'Posso usar o Licita-VMO sem o Radar?', r: 'Pode. No plano Licita-VMO você cadastra as licitações que a sua empresa já acompanha, de qualquer portal. Com o Radar junto, as licitações encontradas chegam no sistema já preenchidas.' },
    { p: 'Quantas pessoas da empresa podem usar o Licita-VMO?', r: 'Até 4 usuários por CNPJ: o titular da conta e mais 3 pessoas que ele cadastra no painel. Cada uma entra com e-mail e senha próprios, e todas as ações ficam registradas na trilha de auditoria.' },
    { p: 'Como pago?', r: 'Por Pix, boleto ou cartão de crédito, escolhidos na fatura. A cobrança é mensal e chega no seu e-mail. Todas as faturas ficam no painel.' },
    { p: 'De onde vêm as licitações?', r: 'Do Portal Nacional de Contratações Públicas (PNCP), que reúne as compras de União, estados e municípios. Todo dia o radar lê as publicações novas e separa as que combinam com o perfil da sua empresa.' },
    { p: 'A IA pode errar na leitura do edital?', r: 'Pode, por isso cada exigência vem com a página do edital onde ela está. A IA aponta, a sua equipe confere antes de decidir.' },
    { p: 'Como cancelo?', r: 'No painel, em Assinatura. O acesso continua até o fim do mês já pago e nenhuma cobrança nova é gerada.' },
  ];

  ngOnInit() { this.portal.carregarPlanos(); }
}
