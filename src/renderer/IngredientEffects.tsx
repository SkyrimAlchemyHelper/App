import { ReactNode, createContext, useContext, useMemo, useState } from 'react';

export type Effect = {
  readonly id: number;
  readonly name: string;
  readonly baseCost: number;
  readonly withDuration: boolean;
  readonly withMagnitute: boolean;
  readonly powerEffectsDuration: boolean;
  readonly powerEffectsMagnitute: boolean;
};

export type IngredientEffect = {
  readonly effect: Effect;
  readonly duration: number;
  readonly magnitute: number;
};

export type Ingredient = {
  readonly id: number;
  readonly name: string;
  readonly effects: readonly IngredientEffect[];
};

type IngredientContext = {
  effects: ReadonlyMap<number, Effect>;
  setEffects: (ingredients: ReadonlyMap<number, Effect>) => void;
  ingredients: ReadonlyMap<number, Ingredient>;
  setIngredients: (ingredients: ReadonlyMap<number, Ingredient>) => void;
  effectIngredients: ReadonlyMap<number, readonly Ingredient[]>;
};

const Context = createContext<IngredientContext>({
  effects: new Map(),
  setEffects: () => {},
  ingredients: new Map(),
  setIngredients: () => {},
  effectIngredients: new Map(),
});

function loadEffectsFromStorage(): ReadonlyMap<number, Effect> {
  const map = new Map<number, Effect>();
  const effectsJson = localStorage.getItem('alchemy-helper-effects') ?? '[]';
  let parsedEffects: unknown;
  try {
    parsedEffects = JSON.parse(effectsJson);
  } catch {
    return map;
  }

  if (!Array.isArray(parsedEffects)) {
    return map;
  }

  parsedEffects.forEach((e: unknown) => {
    if (
      !e ||
      typeof e !== 'object' ||
      !('id' in e) ||
      typeof e.id !== 'number' ||
      !('name' in e) ||
      typeof e.name !== 'string' ||
      !('baseCost' in e) ||
      typeof e.baseCost !== 'number' ||
      !('powerEffectsMagnitute' in e) ||
      typeof e.powerEffectsMagnitute !== 'boolean' ||
      !('powerEffectsDuration' in e) ||
      typeof e.powerEffectsDuration !== 'boolean' ||
      !('withDuration' in e) ||
      typeof e.withDuration !== 'boolean' ||
      !('withMagnitute' in e) ||
      typeof e.withMagnitute !== 'boolean'
    ) {
      return;
    }

    map.set(e.id, {
      id: e.id,
      name: e.name,
      baseCost: e.baseCost,
      powerEffectsMagnitute: e.powerEffectsMagnitute,
      powerEffectsDuration: e.powerEffectsDuration,
      withDuration: e.withDuration,
      withMagnitute: e.withMagnitute,
    });
  });

  return map;
}

function loadIngredientsFromStorage(
  effects: ReadonlyMap<number, Effect>,
): ReadonlyMap<number, Ingredient> {
  const map = new Map<number, Ingredient>();
  const effectsJson =
    localStorage.getItem('alchemy-helper-ingredients') ?? '[]';
  let parsedEffects: unknown;
  try {
    parsedEffects = JSON.parse(effectsJson);
  } catch {
    return map;
  }

  if (!Array.isArray(parsedEffects)) {
    return map;
  }

  parsedEffects.forEach((i: unknown) => {
    if (
      !i ||
      typeof i !== 'object' ||
      !('id' in i) ||
      typeof i.id !== 'number' ||
      !('name' in i) ||
      typeof i.name !== 'string' ||
      !('effects' in i) ||
      !Array.isArray(i.effects) ||
      i.effects.some(
        (e: unknown) =>
          !e ||
          typeof e !== 'object' ||
          !('duration' in e) ||
          typeof e.duration !== 'number' ||
          !('magnitute' in e) ||
          typeof e.magnitute !== 'number' ||
          !('effect' in e) ||
          typeof e.effect !== 'number' ||
          !effects.has(e.effect),
      )
    ) {
      return;
    }

    map.set(i.id, {
      id: i.id,
      name: i.name,
      effects: i.effects.map((e) => ({
        duration: e.duration,
        magnitute: e.magnitute,
        effect: effects.get(e.effect)!,
      })),
    });
  });

  return map;
}

function storeEffectsInStorage(effects: ReadonlyMap<number, Effect>) {
  localStorage.setItem(
    'alchemy-helper-effects',
    JSON.stringify(Array.from(effects.values())),
  );
}

function storeIngredientsInStorage(
  ingredients: ReadonlyMap<number, Ingredient>,
) {
  const list: {}[] = [];
  ingredients.forEach((i) => {
    list.push({
      id: i.id,
      name: i.name,
      effects: i.effects.map((e) => ({
        magnitute: e.magnitute,
        duration: e.duration,
        effect: e.effect.id,
      })),
    });
  });

  localStorage.setItem('alchemy-helper-ingredients', JSON.stringify(list));
}

export function IngredientEffectsProvider({
  children,
}: {
  children?: ReactNode;
}) {
  const [effects, setEffects] = useState<ReadonlyMap<number, Effect>>(() =>
    loadEffectsFromStorage(),
  );

  const [ingredients, setIngredients] = useState<
    ReadonlyMap<number, Ingredient>
  >(() => loadIngredientsFromStorage(effects));

  const value = useMemo<IngredientContext>(() => {
    const effectIngredients = new Map<number, Ingredient[]>();
    ingredients.forEach((i) => {
      i.effects.forEach((e) => {
        let list: Ingredient[];
        if (effectIngredients.has(e.effect.id)) {
          list = effectIngredients.get(e.effect.id)!;
        } else {
          list = [];
          effectIngredients.set(e.effect.id, list);
        }

        list.push(i);
      });
    });

    return {
      effects,
      setEffects: (newEffects) => {
        setEffects(newEffects);
        storeEffectsInStorage(newEffects);
      },
      ingredients,
      setIngredients: (newIngredients) => {
        setIngredients(newIngredients);
        storeIngredientsInStorage(newIngredients);
      },
      effectIngredients,
    };
  }, [ingredients, effects]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useIngredientEffects(): IngredientContext {
  return useContext(Context);
}
