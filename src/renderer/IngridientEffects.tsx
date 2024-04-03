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

export type IngridientEffect = {
  readonly effect: Effect;
  readonly duration: number;
  readonly magnitute: number;
};

export type Ingridient = {
  readonly id: number;
  readonly name: string;
  readonly effects: readonly IngridientEffect[];
};

type IngridientContext = {
  effects: ReadonlyMap<number, Effect>;
  setEffects: (ingridients: ReadonlyMap<number, Effect>) => void;
  ingridients: ReadonlyMap<number, Ingridient>;
  setIngridients: (ingridients: ReadonlyMap<number, Ingridient>) => void;
  effectIngridients: ReadonlyMap<number, readonly Ingridient[]>;
};

const Context = createContext<IngridientContext>({
  effects: new Map(),
  setEffects: () => {},
  ingridients: new Map(),
  setIngridients: () => {},
  effectIngridients: new Map(),
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

function loadIngridientsFromStorage(
  effects: ReadonlyMap<number, Effect>,
): ReadonlyMap<number, Ingridient> {
  const map = new Map<number, Ingridient>();
  const effectsJson =
    localStorage.getItem('alchemy-helper-ingridients') ?? '[]';
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

function storeIngridientsInStorage(
  ingridients: ReadonlyMap<number, Ingridient>,
) {
  const list: {}[] = [];
  ingridients.forEach((i) => {
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

  localStorage.setItem('alchemy-helper-ingridients', JSON.stringify(list));
}

export function IngridientEffectsProvider({
  children,
}: {
  children?: ReactNode;
}) {
  const [effects, setEffects] = useState<ReadonlyMap<number, Effect>>(() =>
    loadEffectsFromStorage(),
  );

  const [ingridients, setIngridients] = useState<
    ReadonlyMap<number, Ingridient>
  >(() => loadIngridientsFromStorage(effects));

  const value = useMemo<IngridientContext>(() => {
    const effectIngridients = new Map<number, Ingridient[]>();
    ingridients.forEach((i) => {
      i.effects.forEach((e) => {
        let list: Ingridient[];
        if (effectIngridients.has(e.effect.id)) {
          list = effectIngridients.get(e.effect.id)!;
        } else {
          list = [];
          effectIngridients.set(e.effect.id, list);
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
      ingridients,
      setIngridients: (newIngridients) => {
        setIngridients(newIngridients);
        storeIngridientsInStorage(newIngridients);
      },
      effectIngridients,
    };
  }, [ingridients, effects]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useIngridientEffects(): IngridientContext {
  return useContext(Context);
}
