import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { config } from '../../core/config';
import { data, reais } from '../../core/formato';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-visao-geral',
  imports: [RouterLink],
  template: `
    <header class="mb-8">
      <p class="rotulo text-pentagono">Painel</p>
      <h1 class="titulo mt-2 text-[clamp(1.8rem,3vw,2.5rem)]">Olá, {{ primeiroNome() }}.</h1>
    </header>

    @if (pagoAgora()) {
      <p class="aviso aviso-ok mb-6">Pagamento recebido. Seus serviços já estão liberados.</p>
    }

    @if (!portal.conta()) {
      <!-- Cadastrou mas ainda não contratou -->
      <section class="chanfro chanfro-g bg-petroleo p-7 text-claro sm:p-9">
        <h2 class="subtitulo text-2xl">Falta pouco: escolha um plano.</h2>
        <p class="mt-3 max-w-[56ch] text-claro-2">Sua conta foi criada. Escolha o Radar, o Licita-VMO ou os dois, informe o CNPJ e pague a primeira mensalidade.</p>
        <a routerLink="/planos" class="btn btn-ciano mt-6">Ver planos</a>
      </section>
    } @else {
      <!-- Situação da assinatura -->
      @switch (situacao()) {
        @case ('pendente') {
          <div class="aviso aviso-atencao mb-6 flex flex-wrap items-center justify-between gap-3">
            <span>Sua contratação do plano <b>{{ portal.planoAtual()?.name }}</b> está aguardando pagamento. Pix libera em minutos.</span>
            @if (portal.faturaPendente()?.invoice_url; as url) { <a [href]="url" target="_blank" rel="noopener" class="btn btn-escuro btn-sm">Pagar fatura ↗</a> }
          </div>
        }
        @case ('vencida') {
          <div class="aviso aviso-atencao mb-6 flex flex-wrap items-center justify-between gap-3">
            <span>Há uma fatura vencida. O acesso continua por até 7 dias após o vencimento.</span>
            @if (portal.faturaPendente()?.invoice_url; as url) { <a [href]="url" target="_blank" rel="noopener" class="btn btn-escuro btn-sm">Pagar agora ↗</a> }
          </div>
        }
        @case ('cancelada') {
          <div class="aviso aviso-atencao mb-6 flex flex-wrap items-center justify-between gap-3">
            <span>
              Assinatura cancelada.
              @if (portal.temLicita() || portal.temRadar()) { O acesso continua até {{ dt(portal.assinatura()?.access_until) }}. } @else { Os serviços estão desligados. }
            </span>
            @if (portal.ehTitular()) {
              @if (portal.temLicita() || portal.temRadar()) {
                <a [routerLink]="['/contratar', portal.assinatura()?.plan_id]" class="btn btn-escuro btn-sm">Reativar sem pagar agora</a>
              } @else {
                <a routerLink="/planos" class="btn btn-escuro btn-sm">Contratar de novo</a>
              }
            }
          </div>
        }
      }

      <!-- Serviços -->
      <section aria-labelledby="t-servicos">
        <h2 id="t-servicos" class="sr-only">Seus serviços</h2>
        <div class="grid gap-5 md:grid-cols-2">
          <article class="cartao grid content-start gap-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="rotulo text-tinta-suave">Serviço</p>
                <h3 class="subtitulo mt-1 text-xl">Radar de licitações</h3>
              </div>
              @if (portal.temRadar()) { <span class="selo selo-ok">Ativo</span> } @else { <span class="selo selo-neutro">Não contratado</span> }
            </div>
            @if (portal.temRadar()) {
              <p class="text-sm text-tinta-2">
                Alertas diários às {{ portal.radar()?.alert_hour ?? 6 }}h para
                @if (portal.radar()?.whatsapp_numbers?.length) { {{ portal.radar()!.whatsapp_numbers.length }} número(s) de WhatsApp. }
                @else { <b class="text-ambar-texto">nenhum WhatsApp cadastrado ainda.</b> }
              </p>
              @if (portal.ehTitular()) { <a routerLink="/painel/radar" class="btn btn-claro btn-sm justify-self-start">Ajustar perfil do radar</a> }
            } @else {
              <p class="text-sm text-tinta-2">Receba no WhatsApp as licitações que combinam com a sua empresa, com resumo em texto e áudio.</p>
              @if (portal.ehTitular()) { <a routerLink="/contratar/combo" class="btn btn-escuro btn-sm justify-self-start">Adicionar o Radar</a> }
            }
          </article>

          <article class="cartao grid content-start gap-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="rotulo text-tinta-suave">Sistema</p>
                <h3 class="subtitulo mt-1 text-xl">Licita-VMO</h3>
              </div>
              @if (portal.temLicita()) { <span class="selo selo-ok">Ativo</span> } @else { <span class="selo selo-neutro">{{ meuAcessoInativo() ? 'Acesso desativado' : 'Não contratado' }}</span> }
            </div>
            @if (portal.temLicita()) {
              <p class="text-sm text-tinta-2">Entre com o mesmo e-mail e senha deste painel. {{ usuariosAtivos() }} de 4 acessos em uso.</p>
              <div class="flex flex-wrap gap-2">
                <a [href]="licitaUrl" class="btn btn-ciano btn-sm">Abrir o Licita-VMO ↗</a>
                @if (portal.ehTitular()) { <a routerLink="/painel/usuarios" class="btn btn-claro btn-sm">Gerenciar usuários</a> }
              </div>
            } @else if (meuAcessoInativo()) {
              <p class="text-sm text-tinta-2">O titular da conta desativou seu acesso. Fale com ele para reativar.</p>
            } @else {
              <p class="text-sm text-tinta-2">Processos, certidões, prazos e propostas da equipe num lugar só, com até 4 usuários.</p>
              @if (portal.ehTitular()) { <a routerLink="/contratar/combo" class="btn btn-escuro btn-sm justify-self-start">Adicionar o Licita-VMO</a> }
            }
          </article>
        </div>
      </section>

      <!-- Resumo da conta (titular) -->
      @if (portal.ehTitular()) {
        <section class="mt-8 grid gap-px overflow-hidden bg-linha sm:grid-cols-3" aria-label="Resumo">
          <div class="bg-white p-5">
            <p class="rotulo text-tinta-suave">Plano</p>
            <p class="mt-2 text-lg font-bold">{{ portal.planoAtual()?.name ?? '—' }}</p>
            <a routerLink="/painel/assinatura" class="text-sm font-semibold text-pentagono hover:underline">Trocar ou cancelar</a>
          </div>
          <div class="bg-white p-5">
            <p class="rotulo text-tinta-suave">Próxima cobrança</p>
            <p class="mt-2 text-lg font-bold">{{ situacao() === 'cancelada' ? '—' : dt(portal.assinatura()?.next_due_date) }}</p>
            <p class="text-sm text-tinta-suave">{{ situacao() === 'cancelada' ? 'sem novas cobranças' : reais(portal.assinatura()?.price_cents, false) }}</p>
          </div>
          <div class="bg-white p-5">
            <p class="rotulo text-tinta-suave">Usuários</p>
            <p class="mt-2 text-lg font-bold">{{ portal.membros().length }} de 4</p>
            <a routerLink="/painel/usuarios" class="text-sm font-semibold text-pentagono hover:underline">Ver usuários</a>
          </div>
        </section>

        <!-- Próximos passos -->
        @if (passos().length) {
          <section class="mt-8">
            <h2 class="subtitulo text-lg">Próximos passos</h2>
            <ul class="mt-4 grid gap-2">
              @for (p of passos(); track p.texto) {
                <li><a [routerLink]="p.rota" class="flex items-center justify-between gap-4 bg-white px-4 py-3.5 ring-1 ring-linha hover:ring-pentagono">
                  <span class="flex items-center gap-3"><span class="h-3 w-3 rotate-45 border-2 border-pentagono"></span>{{ p.texto }}</span>
                  <span class="text-pentagono" aria-hidden="true">→</span>
                </a></li>
              }
            </ul>
          </section>
        }
      } @else {
        <p class="mt-8 text-sm text-tinta-suave">Você é usuário da conta <b>{{ portal.conta()?.company_name }}</b>. Plano, faturas e usuários são gerenciados pelo titular.</p>
      }
    }
  `,
})
export class VisaoGeral {
  protected portal = inject(PortalService);
  private auth = inject(AuthService);
  protected licitaUrl = config.licitaVmoUrl;
  protected dt = data;
  protected reais = reais;
  protected pagoAgora = computed(() => this.rota.snapshot.queryParamMap.get('pago') === '1');
  private rota = inject(ActivatedRoute);

  protected primeiroNome = computed(() => (this.auth.usuario()?.name || 'tudo bem').split(' ')[0]);

  protected situacao = computed(() => {
    const s = this.portal.assinatura();
    if (!s) return 'sem';
    return ({ pending: 'pendente', overdue: 'vencida', canceled: 'cancelada', active: 'ativa' } as const)[s.status];
  });

  protected usuariosAtivos = computed(() => this.portal.membros().filter(m => m.active).length);
  protected meuAcessoInativo = computed(() =>
    this.portal.membros().some(m => m.user_id === this.auth.usuario()?.id && !m.active));

  protected passos = computed(() => {
    const out: { texto: string; rota: string }[] = [];
    const r = this.portal.radar();
    if (this.portal.temRadar() && r) {
      if (!r.whatsapp_numbers.length) out.push({ texto: 'Cadastre o WhatsApp que vai receber os alertas', rota: '/painel/radar' });
      if (!r.keywords.length && !r.cnaes.length) out.push({ texto: 'Diga ao radar o que sua empresa vende', rota: '/painel/radar' });
    }
    if (this.portal.temLicita() && this.portal.membros().length < 2) out.push({ texto: 'Dê acesso ao Licita-VMO para a sua equipe', rota: '/painel/usuarios' });
    return out;
  });
}
