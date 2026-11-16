import { Injectable, computed, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { MODO_DEMO } from './config';
import { supabase } from './supabase';
import { traduzirErro } from './formato';
import { demo } from './demo';

export interface UsuarioLogado { id: string; email: string; name: string }

const CHAVE_DEMO = 'licitavmo-demo-sessao';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly usuario = signal<UsuarioLogado | null>(null);
  readonly pronto = signal(false);
  /** true quando o usuário chegou por link de recuperação/convite e precisa definir senha */
  readonly definindoSenha = signal(false);
  readonly logado = computed(() => this.usuario() !== null);

  private inicio: Promise<void>;

  constructor() {
    this.inicio = this.iniciar();
  }

  /** Espera a sessão ser restaurada (usado pelos guards). */
  aguardar(): Promise<void> { return this.inicio; }

  private async iniciar() {
    if (MODO_DEMO) {
      try {
        const salvo = localStorage.getItem(CHAVE_DEMO);
        if (salvo) this.usuario.set(JSON.parse(salvo));
      } catch { /* sem storage */ }
      this.pronto.set(true);
      return;
    }
    const { data } = await supabase!.auth.getSession();
    this.aplicar(data.session);
    supabase!.auth.onAuthStateChange((evento, sessao) => {
      if (evento === 'PASSWORD_RECOVERY') this.definindoSenha.set(true);
      this.aplicar(sessao);
    });
    this.pronto.set(true);
  }

  private aplicar(s: Session | null) {
    const u = s?.user;
    this.usuario.set(u ? { id: u.id, email: u.email ?? '', name: (u.user_metadata?.['full_name'] as string) ?? '' } : null);
  }

  async cadastrar(nome: string, email: string, senha: string, voltarPara: string): Promise<{ precisaConfirmar: boolean }> {
    if (MODO_DEMO) {
      localStorage.setItem('licitavmo-demo-novo', '1');
      this.entrarDemo({ id: 'demo-novo', email, name: nome });
      return { precisaConfirmar: false };
    }
    const { data, error } = await supabase!.auth.signUp({
      email, password: senha,
      options: { data: { full_name: nome }, emailRedirectTo: location.origin + voltarPara },
    });
    if (error) throw new Error(traduzirErro(error.message));
    // Supabase não acusa e-mail repetido quando a confirmação está ligada: identities vem vazio
    if (data.user && data.user.identities?.length === 0) throw new Error(traduzirErro('already registered'));
    return { precisaConfirmar: !data.session };
  }

  async entrar(email: string, senha: string) {
    if (MODO_DEMO) {
      localStorage.removeItem('licitavmo-demo-novo');
      this.entrarDemo({ id: 'demo-titular', email, name: 'Marcos Ribeiro' });
      return;
    }
    const { error } = await supabase!.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(traduzirErro(error.message));
  }

  async sair() {
    if (MODO_DEMO) { localStorage.removeItem(CHAVE_DEMO); this.usuario.set(null); return; }
    await supabase!.auth.signOut();
  }

  async enviarRecuperacao(email: string) {
    if (MODO_DEMO) return;
    const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/definir-senha' });
    if (error) throw new Error(traduzirErro(error.message));
  }

  async definirSenha(senha: string) {
    if (MODO_DEMO) return;
    const { error } = await supabase!.auth.updateUser({ password: senha });
    if (error) throw new Error(traduzirErro(error.message));
    this.definindoSenha.set(false);
  }

  private entrarDemo(u: UsuarioLogado) {
    demo.resetar();
    try { localStorage.setItem(CHAVE_DEMO, JSON.stringify(u)); } catch { /* ignore */ }
    this.usuario.set(u);
  }
}
