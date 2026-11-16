import { Component, input } from '@angular/core';

let seq = 0;

/**
 * Pentágono VMO + "Licita-VMO". tom='escuro' para fundos escuros.
 * Geometria igual ao arquivo oficial (vmo-sistemas-logo-sem-titulo.svg): o V é recortado pelo pentágono.
 */
@Component({
  selector: 'app-logo',
  template: `
    <span class="inline-flex items-center gap-3 select-none">
      <svg [attr.width]="tamanho()" viewBox="-265 -265 530 486" aria-hidden="true" class="shrink-0">
        <defs>
          <clipPath [attr.id]="id + '-p'"><polygon points="0,-243.6 231.67,-75.28 143.18,197.07 -143.18,197.07 -231.67,-75.28"/></clipPath>
          <clipPath [attr.id]="id + '-m'"><rect x="-400" y="-400" width="800" height="528"/></clipPath>
        </defs>
        <polygon points="0,-230 218.74,-71.07 135.19,186.07 -135.19,186.07 -218.74,-71.07" fill="none" stroke="#1396A3" stroke-width="22" stroke-linejoin="miter" stroke-miterlimit="10"/>
        <g [attr.clip-path]="'url(#' + id + '-p)'"><polyline points="-290,-433.93 0,186.07 290,-433.93" fill="none" stroke="#1396A3" stroke-width="22" stroke-linejoin="miter" stroke-miterlimit="10"/></g>
        <g [attr.clip-path]="'url(#' + id + '-m)'"><polyline points="-145.02,168 -50,-85 0,62 50,-85 145.02,168" fill="none" stroke="#35D0D3" stroke-width="22" stroke-linejoin="miter" stroke-miterlimit="10"/></g>
      </svg>
      @if (comTexto()) {
        <span class="leading-none" [class.text-claro]="tom() === 'escuro'" [class.text-tinta]="tom() === 'claro'">
          <span class="font-display block text-[1.2rem] font-bold tracking-[-.02em]">Licita<span class="text-pentagono">-</span>VMO</span>
          <span class="block text-[.68rem] font-semibold tracking-[.12em] uppercase opacity-70 mt-1" style="font-stretch:90%">por VMO Sistemas</span>
        </span>
      }
    </span>
  `,
})
export class Logo {
  tom = input<'escuro' | 'claro'>('escuro');
  tamanho = input(40);
  comTexto = input(true);
  /** ids dos clipPaths únicos por instância (a logo aparece mais de uma vez na página) */
  protected id = 'logo-' + ++seq;
}
