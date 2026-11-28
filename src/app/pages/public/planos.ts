import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { config } from '../../core/config';
import { PortalService } from '../../core/portal.service';
import { PlanoCard } from '../../shared/plano-card';
import { SiteFooter } from '../../shared/site-footer';
import { SiteHeader } from '../../shared/site-header';

@Component({
  selector: 'app-planos',
  imports: [RouterLink, SiteHeader, SiteFooter, PlanoCard],
  template: `
    <app-site-header />
    <main>
      <section class="escuro bg-abismo text-claro">
        <div class="wrap py-14 md:py-20">
          <p class="rotulo text-ciano">Planos e preços</p>
          <h1 class="display mt-4 max-w-[18ch] text-[clamp(2.4rem,4.6vw,4.2rem)]">Escolha como sua empresa vai licitar.</h1>
          <p class="mt-5 max-w-[56ch] text-lg text-claro-2">Valores mensais por CNPJ. Sem taxa de adesão, sem fidelidade. Pix, boleto ou cartão.</p>
          @if (!vendasAbertas) {
            <p class="mt-6 inline-flex items-center gap-2 bg-[rgba(53,208,211,.1)] px-3 py-1.5 text-sm font-bold text-ciano ring-1 ring-inset ring-[rgba(53,208,211,.25)]">Lançamento em breve: as contratações ainda não estão abertas.</p>
          }
        </div>
      </section>

      <section class="bg-nevoa">
        <div class="wrap -mt-2 py-14">
          <div class="grid gap-5 md:grid-cols-3">
            @for (p of portal.planos(); track p.id) {
              <app-plano-card [plano]="p" [atual]="portal.assinatura()?.plan_id === p.id && portal.assinatura()?.status !== 'canceled'" />
            }
          </div>

          <div class="mt-16">
            <h2 class="titulo text-[clamp(1.5rem,2.4vw,2.1rem)]">Compare</h2>
            <div class="mt-6 overflow-x-auto">
              <table class="w-full min-w-[640px] border-collapse text-[.93rem]">
                <thead>
                  <tr class="text-left text-xs font-semibold text-tinta-suave">
                    <th class="py-3 pr-4 font-semibold"><span class="sr-only">Recurso</span></th>
                    @for (p of portal.planos(); track p.id) {
                      <th class="px-3 py-3 text-center" [class]="p.highlight ? 'bg-petroleo text-ciano font-extrabold text-sm' : ''">{{ p.name }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (l of linhas; track l.t) {
                    <tr class="border-b border-linha">
                      <th scope="row" class="py-3 pr-4 text-left font-semibold">{{ l.t }}</th>
                      @for (p of portal.planos(); track p.id) {
                        <td class="px-3 py-3 text-center" [class]="p.highlight ? 'bg-petroleo text-claro' : ''">
                          @if (l.ok(p)) {
                            <svg viewBox="0 0 20 20" class="mx-auto h-[18px] w-[18px]" aria-label="incluso"><polygon points="10,1 19,7.6 15.6,18.5 4.4,18.5 1,7.6" [attr.fill]="p.highlight ? '#35D0D3' : '#1396A3'"/></svg>
                          } @else {
                            <span class="mx-auto block h-[3px] w-[14px] bg-linha" aria-label="não incluso"></span>
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-14 grid gap-5" [class]="vendasAbertas ? 'md:grid-cols-3' : 'md:grid-cols-2'">
            <div class="cartao">
              <p class="subtitulo text-lg">Como funciona a compra</p>
              <ol class="mt-3 grid gap-2 text-sm text-tinta-2">
                <li>1. Crie sua conta com e-mail e senha.</li>
                <li>2. Informe os dados da empresa (CNPJ).</li>
                <li>3. Pague a primeira mensalidade.</li>
                <li>4. O painel libera os serviços na confirmação.</li>
              </ol>
            </div>
            <div class="cartao">
              <p class="subtitulo text-lg">Trocar de plano</p>
              <p class="mt-3 text-sm text-tinta-2">Pelo painel, a qualquer momento. O novo valor vale a partir da próxima fatura.</p>
            </div>
            @if (vendasAbertas) {
              <div class="cartao">
                <p class="subtitulo text-lg">Já é cliente?</p>
                <p class="mt-3 text-sm text-tinta-2">Gerencie usuários, faturas e o perfil do radar no painel.</p>
                <a [routerLink]="auth.logado() ? '/painel' : '/entrar'" class="btn btn-escuro btn-sm mt-4">{{ auth.logado() ? 'Ir para o painel' : 'Entrar' }}</a>
              </div>
            }
          </div>
        </div>
      </section>
    </main>
    <app-site-footer />
  `,
})
export class Planos implements OnInit {
  protected portal = inject(PortalService);
  protected auth = inject(AuthService);
  protected vendasAbertas = config.vendasAbertas;

  protected linhas = [
    { t: 'Alertas de licitações filtrados', ok: (p: { includes_radar: boolean }) => p.includes_radar },
    { t: 'Resumo do edital em texto e áudio no WhatsApp', ok: (p: { includes_radar: boolean }) => p.includes_radar },
    { t: 'Lembretes de prazo', ok: (p: { includes_radar: boolean; includes_licita: boolean }) => p.includes_radar || p.includes_licita },
    { t: 'Cofre de certidões', ok: () => true },
    { t: 'Gestão de licitações com status e prazos', ok: (p: { includes_licita: boolean }) => p.includes_licita },
    { t: 'Itens importados de planilha Excel, com histórico de preço', ok: (p: { includes_licita: boolean }) => p.includes_licita },
    { t: 'Proposta e declarações em PDF', ok: (p: { includes_licita: boolean }) => p.includes_licita },
    { t: 'Atas, contratos e anexos por licitação', ok: (p: { includes_licita: boolean }) => p.includes_licita },
    { t: 'Relatórios de ganhas, perdidas e contratantes', ok: (p: { includes_licita: boolean }) => p.includes_licita },
    { t: 'Dashboard, metas e entregas', ok: (p: { includes_licita: boolean }) => p.includes_licita },
    { t: 'Perfis de acesso e trilha de auditoria', ok: (p: { includes_licita: boolean }) => p.includes_licita },
    { t: 'Até 4 usuários no Licita-VMO', ok: (p: { includes_licita: boolean }) => p.includes_licita },
    { t: 'Licitação do radar vira processo com um toque', ok: (p: { includes_radar: boolean; includes_licita: boolean }) => p.includes_radar && p.includes_licita },
    { t: 'Compatibilidade pelos atestados', ok: (p: { includes_radar: boolean; includes_licita: boolean }) => p.includes_radar && p.includes_licita },
  ];

  async ngOnInit() {
    this.portal.carregarPlanos();
    await this.auth.aguardar();
    if (this.auth.logado()) this.portal.carregar();
  }
}
