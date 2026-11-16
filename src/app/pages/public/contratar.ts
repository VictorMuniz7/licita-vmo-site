import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MODO_DEMO } from '../../core/config';
import { cnpjValido, data, hojeISO, mascaraCep, mascaraCnpj, mascaraTelefone, reais, UFS } from '../../core/formato';
import { NovaConta, PlanoId } from '../../core/modelos';
import { PortalService } from '../../core/portal.service';
import { AuthService } from '../../core/auth.service';
import { Logo } from '../../shared/logo';

@Component({
  selector: 'app-contratar',
  imports: [FormsModule, RouterLink, Logo],
  templateUrl: './contratar.html',
})
export class Contratar implements OnInit {
  protected portal = inject(PortalService);
  protected auth = inject(AuthService);
  private router = inject(Router);
  private rota = inject(ActivatedRoute);

  protected planoId = signal<PlanoId>('combo');
  protected plano = computed(() => this.portal.planos().find(p => p.id === this.planoId()) ?? null);
  protected sub = computed(() => {
    const s = this.portal.assinatura();
    return s && s.status !== 'canceled' ? s : null;
  });
  /** Cancelou, mas o período pago ainda não acabou: assinar de novo não cobra agora. Guarda a data do fim. */
  protected reativacao = computed(() => {
    const s = this.portal.assinatura();
    return s?.status === 'canceled' && s.access_until && s.access_until >= hojeISO() ? s.access_until : null;
  });
  protected reativado = signal('');
  protected passo = computed<'empresa' | 'pagamento'>(() => this.portal.conta() ? 'pagamento' : 'empresa');
  protected reais = reais;
  protected dt = data;
  protected ufs = UFS;
  protected demo = MODO_DEMO;

  protected empresa: NovaConta = {
    company_name: '', trade_name: '', cnpj: '', phone: '', billing_email: '',
    address_zip: '', address_city: '', address_state: '',
  };
  protected erro = signal('');
  protected enviando = signal(false);
  protected trocado = signal(false);

  protected mCnpj = mascaraCnpj;
  protected mTel = mascaraTelefone;
  protected mCep = mascaraCep;

  async ngOnInit() {
    const id = this.rota.snapshot.paramMap.get('plano') as PlanoId;
    this.planoId.set(id);
    await this.portal.carregar();
    if (!this.portal.planos().some(p => p.id === id)) this.router.navigateByUrl('/planos');
    this.empresa.billing_email = this.auth.usuario()?.email ?? '';
  }

  protected cnpjOk() { return cnpjValido(this.empresa.cnpj); }

  async salvarEmpresa() {
    this.erro.set('');
    if (!this.cnpjOk()) { this.erro.set('CNPJ inválido. Confira os números.'); return; }
    this.enviando.set(true);
    try { await this.portal.criarConta(this.empresa); }
    catch (e) { this.erro.set((e as Error).message); }
    finally { this.enviando.set(false); }
  }

  async pagar() {
    this.erro.set(''); this.enviando.set(true);
    const ate = this.reativacao();
    try {
      const url = await this.portal.contratar(this.planoId());
      if (url) {
        if (url.startsWith('/')) { await this.router.navigateByUrl(url); return; }
        window.location.href = url;   // fatura do Asaas (Pix, boleto ou cartão)
        return;
      }
      if (ate) this.reativado.set(ate); else this.trocado.set(true);
    } catch (e) {
      this.erro.set((e as Error).message);
    } finally {
      this.enviando.set(false);
    }
  }
}
