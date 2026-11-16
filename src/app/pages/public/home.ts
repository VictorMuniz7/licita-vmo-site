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

  protected recursosRadar = ['Filtro por ramo, região e valor', 'Resumo em texto e áudio', 'Perguntas ao edital no WhatsApp', 'Lembrete de cada prazo', 'Cofre de certidões', 'Aviso de certidão vencendo'];
  protected recursosLicita = ['Processos e prazos da equipe', 'Proposta em PDF', 'Certidões com alerta de vencimento', 'Trilha de auditoria', 'Acesso por perfil', 'Recebe licitações do radar'];

  protected etapas = [
    { t: 'Encontra', d: 'Todo dia às 6h, lê as licitações novas nos portais oficiais e filtra pelo perfil da sua empresa.', r: 'Só o que você pode disputar, sem lista de 300 editais.' },
    { t: 'Lê', d: 'A IA lê o PDF inteiro: objeto, itens, valores, prazos, documentos e cláusulas de risco.', r: 'Cada exigência com a página do edital.' },
    { t: 'Resume', d: 'Resumo de uma página e áudio de um a dois minutos no WhatsApp. Dúvidas respondidas na conversa.', r: '"Precisa de amostra?" com resposta e página.' },
    { t: 'Lembra', d: 'Avisos antes de cada prazo: esclarecimento, impugnação, sessão, recurso e entrega.', r: 'A sua equipe não perde sessão por esquecimento.' },
    { t: 'Prepara', d: 'Checklist com o cofre de certidões e proposta em PDF gerada pelo Licita-VMO.', r: 'Do alerta à proposta, num lugar só.' },
  ];

  protected diferenciais = [
    { t: 'Resumo do edital em áudio', d: 'Dois minutos no WhatsApp para ouvir no carro, entre uma entrega e outra. Cem páginas viram uma conversa.', i: 'M4 15v-3a8 8 0 0116 0v3M4 14h3v6H4zM17 14h3v6h-3z' },
    { t: 'Compatibilidade pelos seus documentos', d: 'O radar cruza o edital com seus atestados, certidões e balanço e diz o que falta, inclusive se o atestado cobre a quantidade exigida.', i: 'M14 3H6v18h12V7zM14 3v4h4M9 14l2 2 4-4' },
    { t: 'Certidão vencida não pega ninguém de surpresa', d: 'Aviso no WhatsApp 10 dias antes de cada vencimento, dizendo quais licitações abertas ficam travadas sem o documento.', i: 'M6 9a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0' },
    { t: 'Sem fidelidade, de verdade', d: 'Mensal por CNPJ, sem contrato de 12 meses e sem renovação escondida. Cancele pelo painel em dois cliques.', i: 'M5 11h14v10H5zM8 11V7a4 4 0 017.5-2' },
  ];

  protected duvidas = [
    { p: 'Preciso contratar os dois serviços?', r: 'Não. O Radar e o Licita-VMO são vendidos separados. Quem contrata os dois no plano Radar + Gestão paga menos e ganha a integração: a licitação que chega no WhatsApp vira processo no Licita-VMO com um toque.' },
    { p: 'Quantas pessoas da empresa podem usar o Licita-VMO?', r: 'Até 4 usuários por CNPJ: o titular da conta e mais 3 pessoas que ele cadastra no painel. Cada uma entra com e-mail e senha próprios, e todas as ações ficam registradas na trilha de auditoria.' },
    { p: 'Como pago?', r: 'Por Pix, boleto ou cartão de crédito, escolhidos na fatura. A cobrança é mensal e chega no seu e-mail. Todas as faturas ficam no painel.' },
    { p: 'De onde vêm as licitações?', r: 'Do Portal Nacional de Contratações Públicas (PNCP), que reúne as compras de União, estados e municípios. Todo dia o radar lê as publicações novas e separa as que combinam com o perfil da sua empresa.' },
    { p: 'A IA pode errar na leitura do edital?', r: 'Pode, por isso cada exigência vem com a página do edital onde ela está. A IA aponta, a sua equipe confere antes de decidir.' },
    { p: 'Como cancelo?', r: 'No painel, em Assinatura. O acesso continua até o fim do mês já pago e nenhuma cobrança nova é gerada.' },
  ];

  ngOnInit() { this.portal.carregarPlanos(); }
}
