import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mascaraTelefone, soDigitos, UFS } from '../../core/formato';
import { PerfilRadar } from '../../core/modelos';
import { PortalService } from '../../core/portal.service';
import { Chips } from '../../shared/chips';

type Perfil = Omit<PerfilRadar, 'account_id'>;

@Component({
  selector: 'app-radar',
  imports: [FormsModule, RouterLink, Chips],
  template: `
    <header class="mb-8">
      <p class="rotulo text-pentagono">Radar de licitações</p>
      <h1 class="titulo mt-2 text-[clamp(1.8rem,3vw,2.5rem)]">Perfil do radar</h1>
      <p class="mt-2 max-w-[62ch] text-tinta-2">Quanto mais preciso o perfil, menos alerta inútil. O radar usa estas informações para escolher o que chega no seu WhatsApp.</p>
    </header>

    @if (!portal.temRadar()) {
      <div class="aviso aviso-atencao mb-6 flex flex-wrap items-center justify-between gap-3">
        <span>Seu plano não inclui o Radar. Você pode deixar o perfil pronto; os alertas começam quando contratar.</span>
        <a routerLink="/painel/assinatura" class="btn btn-escuro btn-sm">Mudar de plano</a>
      </div>
    }

    <form class="grid gap-6" (ngSubmit)="salvar()">
      <section class="cartao grid gap-5">
        <div>
          <h2 class="subtitulo text-lg">O que a empresa vende</h2>
          <p class="text-sm text-tinta-suave">Palavras que aparecem no objeto da licitação. Enter ou vírgula para separar.</p>
        </div>
        <label class="campo"><span>Palavras-chave</span>
          <app-chips [(valores)]="p.keywords" rotulo="Palavras-chave" placeholder="ex.: material de limpeza, papel toalha" />
        </label>
        <label class="campo"><span>Ignorar licitações com</span>
          <app-chips [(valores)]="p.excluded_keywords" rotulo="Palavras para ignorar" placeholder="ex.: obra, locação" />
        </label>
        <label class="campo"><span>CNAEs da empresa <em class="font-normal not-italic text-tinta-suave">(opcional)</em></span>
          <app-chips [(valores)]="p.cnaes" rotulo="CNAEs" placeholder="ex.: 4649-4/08" />
        </label>
      </section>

      <section class="cartao grid gap-5">
        <div>
          <h2 class="subtitulo text-lg">Onde e quanto</h2>
          <p class="text-sm text-tinta-suave">Deixe em branco para receber de todo o Brasil e de qualquer valor.</p>
        </div>
        <fieldset class="campo">
          <legend class="mb-2 text-sm font-semibold text-tinta-2">Estados</legend>
          <div class="flex flex-wrap gap-1.5">
            @for (uf of ufs; track uf) {
              <button type="button" class="h-9 w-11 text-sm font-bold ring-1 ring-inset"
                      [class]="p.states.includes(uf) ? 'bg-petroleo text-ciano ring-petroleo' : 'bg-white text-tinta-2 ring-linha hover:ring-pentagono'"
                      [attr.aria-pressed]="p.states.includes(uf)" (click)="alternarUf(uf)">{{ uf }}</button>
            }
          </div>
        </fieldset>
        <label class="campo"><span>Cidades específicas <em class="font-normal not-italic text-tinta-suave">(opcional)</em></span>
          <app-chips [(valores)]="p.cities" rotulo="Cidades" placeholder="ex.: Maringá, Londrina" />
        </label>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="campo"><span>Valor mínimo estimado (R$)</span>
            <input class="input" type="number" min="0" step="1000" name="min" [ngModel]="min()" (ngModelChange)="min.set($event)" placeholder="sem mínimo">
          </label>
          <label class="campo"><span>Valor máximo estimado (R$)</span>
            <input class="input" type="number" min="0" step="1000" name="max" [ngModel]="max()" (ngModelChange)="max.set($event)" placeholder="sem máximo">
          </label>
        </div>
        <label class="flex items-start gap-3 text-sm">
          <input type="checkbox" name="meepp" [(ngModel)]="p.only_me_epp" class="mt-0.5 h-4 w-4 accent-pentagono">
          <span><b>Só licitações exclusivas para ME e EPP</b><br><span class="text-tinta-suave">Útil para micro e pequenas empresas que querem disputar com menos concorrentes.</span></span>
        </label>
      </section>

      <section class="cartao grid gap-5">
        <div>
          <h2 class="subtitulo text-lg">Alertas no WhatsApp</h2>
          <p class="text-sm text-tinta-suave">Até 3 números. Cada número recebe uma mensagem de boas-vindas para autorizar os alertas.</p>
        </div>
        <label class="campo"><span>Números de WhatsApp</span>
          <app-chips [(valores)]="p.whatsapp_numbers" rotulo="Números de WhatsApp" placeholder="(44) 99999-9999" modo="tel"
                     [maximo]="3" [normalizar]="normalizarFone" />
          <small class="ajuda">Com DDD. Aperte Enter depois de cada número.</small>
        </label>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="campo"><span>Horário do resumo diário</span>
            <select class="input" name="hora" [(ngModel)]="p.alert_hour">
              @for (h of horas; track h) { <option [ngValue]="h">{{ h }}h</option> }
            </select>
          </label>
          <label class="flex items-start gap-3 self-end pb-2.5 text-sm">
            <input type="checkbox" name="audio" [(ngModel)]="p.audio_summary" class="mt-0.5 h-4 w-4 accent-pentagono">
            <span><b>Mandar resumo do edital também em áudio</b></span>
          </label>
        </div>
      </section>

      @if (erro()) { <p class="aviso aviso-erro" role="alert">{{ erro() }}</p> }
      @if (ok()) { <p class="aviso aviso-ok" role="status">Perfil salvo. O próximo alerta já usa estas regras.</p> }
      <div class="sticky bottom-0 z-10 -mx-4 border-t border-linha bg-nevoa/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <button class="btn btn-escuro px-10 py-3.5" [disabled]="enviando()">{{ enviando() ? 'Salvando…' : 'Salvar perfil' }}</button>
      </div>
    </form>
  `,
})
export class Radar implements OnInit {
  protected portal = inject(PortalService);
  protected ufs = UFS;
  protected horas = [5, 6, 7, 8, 9, 10, 12, 14, 17, 19];
  protected p: Perfil = {
    keywords: [], excluded_keywords: [], cnaes: [], states: [], cities: [], min_value_cents: null, max_value_cents: null,
    only_me_epp: false, whatsapp_numbers: [], audio_summary: true, alert_hour: 6,
  };
  protected min = signal<number | null>(null);
  protected max = signal<number | null>(null);
  protected enviando = signal(false);
  protected erro = signal('');
  protected ok = signal(false);

  protected normalizarFone = (v: string) => {
    const d = soDigitos(v);
    return d.length === 10 || d.length === 11 ? mascaraTelefone(d) : '';
  };

  ngOnInit() {
    const r = this.portal.radar();
    if (r) {
      const { account_id: _, ...resto } = r;
      this.p = { ...resto, whatsapp_numbers: resto.whatsapp_numbers.map(n => mascaraTelefone(n)) };
      this.min.set(r.min_value_cents != null ? r.min_value_cents / 100 : null);
      this.max.set(r.max_value_cents != null ? r.max_value_cents / 100 : null);
    }
  }

  protected alternarUf(uf: string) {
    this.p.states = this.p.states.includes(uf) ? this.p.states.filter(x => x !== uf) : [...this.p.states, uf].sort();
  }

  async salvar() {
    this.erro.set(''); this.ok.set(false);
    const min = this.min(), max = this.max();
    if (min != null && max != null && +min > +max) { this.erro.set('O valor mínimo está maior que o máximo.'); return; }
    this.enviando.set(true);
    try {
      await this.portal.salvarRadar({
        ...this.p,
        whatsapp_numbers: this.p.whatsapp_numbers.map(n => soDigitos(n)),
        min_value_cents: min != null && `${min}` !== '' ? Math.round(+min * 100) : null,
        max_value_cents: max != null && `${max}` !== '' ? Math.round(+max * 100) : null,
      });
      this.ok.set(true);
    } catch (e) { this.erro.set((e as Error).message); }
    finally { this.enviando.set(false); }
  }
}
