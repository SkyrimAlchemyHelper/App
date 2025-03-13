import { IngredientEffect } from './IngredientEffects';

export function getEffectValue(effect: IngredientEffect): number {
  const basePower = 6;
  let magnitute = 1;
  if (effect.effect.withMagnitute && effect.magnitute > 0) {
    magnitute = effect.magnitute;
    if (effect.effect.powerEffectsMagnitute) {
      magnitute = Math.round(magnitute * basePower);
    }
  }
  let duration = 1;
  if (effect.effect.withDuration && effect.duration > 0) {
    duration = effect.duration / 10;
    if (effect.effect.powerEffectsDuration) {
      duration = Math.round(duration * basePower);
    }
  }

  return Math.floor(effect.effect.baseCost * (magnitute * duration) ** 1.1);
}

export function getPotionValue(effects: readonly IngredientEffect[]): number {
  return effects.reduce((a, e) => a + getEffectValue(e), 0);
}
