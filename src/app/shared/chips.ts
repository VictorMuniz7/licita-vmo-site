import { Component, input, model, signal } from '@angular/core';

/** Campo de etiquetas: digite e aperte Enter ou vírgula. */
@Component({
  selector: 'app-chips',
  template: `
    <div class="flex min-h-[46px] flex-wrap items-center gap-1.5 bg-white px-2 py-1.5 ring-1 ring-inset ring-linha focus-within:ring-2 focus-within:ring-pentagono"
         [class.opacity-60]="desabilitado()">
      @for (v of valores(); track v; let i = $index) {
        <span class="inline-flex items-center gap-1 bg-nevoa-2 py-1 pl-2.5 pr-1 text-sm font-semibold text-tinta">
          {{ v }}
          <button type="button" class="grid h-5 w-5 place-items-center text-tinta-suave hover:text-erro" (click)="remover(i)"
                  [disabled]="desabilitado()" [attr.aria-label]="'Remover ' + v">×</button>
        </span>
      }
      <input class="min-w-[9rem] flex-1 bg-transparent px-1.5 py-1 text-[.95rem] outline-none placeholder:text-tinta-suave/70"
             [placeholder]="valores().length ? '' : placeholder()" [value]="texto()" [disabled]="desabilitado()"
             (input)="texto.set($any($event.target).value)" (keydown)="tecla($event)" (blur)="adicionar()"
             [attr.aria-label]="rotulo()" [attr.inputmode]="modo()">
    </div>
  `,
})
export class Chips {
  valores = model<string[]>([]);
  placeholder = input('');
  rotulo = input('');
  desabilitado = input(false);
  maximo = input(50);
  modo = input<string | null>(null);
  /** transforma cada item antes de adicionar (ex.: só dígitos). Retorne '' para recusar. */
  normalizar = input<(v: string) => string>(v => v);
  protected texto = signal('');

  protected tecla(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); this.adicionar(); }
    else if (e.key === 'Backspace' && !this.texto() && this.valores().length) this.remover(this.valores().length - 1);
  }

  protected adicionar() {
    const partes = this.texto().split(/[,;\n]/).map(p => this.normalizar()(p.trim())).filter(Boolean);
    if (!partes.length) { this.texto.set(''); return; }
    const atual = [...this.valores()];
    for (const p of partes) if (!atual.some(a => a.toLowerCase() === p.toLowerCase()) && atual.length < this.maximo()) atual.push(p);
    this.valores.set(atual);
    this.texto.set('');
  }

  protected remover(i: number) { this.valores.set(this.valores().filter((_, j) => j !== i)); }
}
