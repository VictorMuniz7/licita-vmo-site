import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { config } from '../../core/config';
import { mascaraCep, mascaraCnpj, mascaraTelefone, UFS } from '../../core/formato';
import { NovaConta } from '../../core/modelos';
import { PortalService } from '../../core/portal.service';

@Component({
  selector: 'app-empresa',
  imports: [FormsModule],
  template: `
    <header class="mb-8">
      <p class="rotulo text-pentagono">Conta</p>
      <h1 class="titulo mt-2 text-[clamp(1.8rem,3vw,2.5rem)]">Dados da empresa</h1>
      <p class="mt-2 text-tinta-2">Usados nas faturas e no Licita-VMO.</p>
    </header>

    <form class="cartao grid gap-5 sm:grid-cols-6" (ngSubmit)="salvar()" #f="ngForm">
      <label class="campo sm:col-span-3">
        <span>CNPJ</span>
        <input class="input" [value]="mCnpj(portal.conta()?.cnpj ?? '')" disabled>
        <small class="ajuda">Para trocar o CNPJ, fale com o nosso suporte: <a class="font-semibold text-pentagono" [href]="'mailto:' + email">{{ email }}</a></small>
      </label>
      <label class="campo sm:col-span-3">
        <span>Telefone / WhatsApp</span>
        <input class="input" name="phone" inputmode="tel" required [ngModel]="d.phone" (ngModelChange)="d.phone = mTel($event)">
      </label>
      <label class="campo sm:col-span-6">
        <span>Razão social</span>
        <input class="input" name="company_name" required minlength="3" [(ngModel)]="d.company_name">
      </label>
      <label class="campo sm:col-span-6">
        <span>Nome fantasia</span>
        <input class="input" name="trade_name" [(ngModel)]="d.trade_name">
      </label>
      <label class="campo sm:col-span-6">
        <span>E-mail para faturas</span>
        <input class="input" type="email" name="billing_email" required email [(ngModel)]="d.billing_email">
      </label>
      <label class="campo sm:col-span-2">
        <span>CEP</span>
        <input class="input" name="cep" inputmode="numeric" [ngModel]="d.address_zip" (ngModelChange)="d.address_zip = mCep($event)">
      </label>
      <label class="campo sm:col-span-3">
        <span>Cidade</span>
        <input class="input" name="cidade" [(ngModel)]="d.address_city">
      </label>
      <label class="campo sm:col-span-1">
        <span>UF</span>
        <select class="input" name="uf" [(ngModel)]="d.address_state">
          <option value="">—</option>
          @for (u of ufs; track u) { <option [value]="u">{{ u }}</option> }
        </select>
      </label>
      @if (erro()) { <p class="aviso aviso-erro sm:col-span-6" role="alert">{{ erro() }}</p> }
      @if (ok()) { <p class="aviso aviso-ok sm:col-span-6" role="status">Dados salvos.</p> }
      <div class="sm:col-span-6">
        <button class="btn btn-escuro px-8" [disabled]="enviando() || f.invalid || f.pristine">{{ enviando() ? 'Salvando…' : 'Salvar alterações' }}</button>
      </div>
    </form>
  `,
})
export class Empresa implements OnInit {
  protected portal = inject(PortalService);
  protected ufs = UFS;
  protected email = config.emailContato;
  protected mCnpj = mascaraCnpj;
  protected mTel = mascaraTelefone;
  protected mCep = mascaraCep;
  protected d: Partial<NovaConta> = {};
  protected enviando = signal(false);
  protected erro = signal('');
  protected ok = signal(false);

  ngOnInit() {
    const c = this.portal.conta()!;
    this.d = {
      company_name: c.company_name, trade_name: c.trade_name ?? '', phone: mascaraTelefone(c.phone ?? ''),
      billing_email: c.billing_email ?? '', address_zip: mascaraCep(c.address_zip ?? ''),
      address_city: c.address_city ?? '', address_state: c.address_state ?? '',
    };
  }

  async salvar() {
    this.erro.set(''); this.ok.set(false); this.enviando.set(true);
    try { await this.portal.salvarConta(this.d); this.ok.set(true); }
    catch (e) { this.erro.set((e as Error).message); }
    finally { this.enviando.set(false); }
  }
}
