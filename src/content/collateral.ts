// Textos das garantias.
import type { CollateralKind } from '../engine/state';

export const collateralText: Record<
  CollateralKind,
  { label: string; noun: string; seized: string; perMonth?: boolean }
> = {
  celular: { label: 'Celular', noun: 'o celular', seized: 'Celular recolhido e vendido' },
  moto: { label: 'Moto', noun: 'a moto', seized: 'Moto recolhida e vendida' },
  inss: {
    label: 'Cartão do INSS',
    noun: 'o cartão do INSS',
    seized: 'O banco bloqueou o cartão do INSS',
    perMonth: true,
  },
};
