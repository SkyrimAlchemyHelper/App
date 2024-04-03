import { ReactNode, createContext, useContext, useMemo, useState } from 'react';
import { Ingridient, useIngridientEffects } from './IngridientEffects';

export type Item = {
  readonly ingridient: Ingridient;
  readonly count: number;
};

type InventoryContext = {
  inventory: ReadonlyMap<number, Item>;
  setInventory: (ingridients: ReadonlyMap<number, Item>) => void;
};

const Context = createContext<InventoryContext>({
  inventory: new Map(),
  setInventory: () => {},
});

function loadInventoryFromStorage(
  ingridients: ReadonlyMap<number, Ingridient>,
): ReadonlyMap<number, Item> {
  const map = new Map<number, Item>();
  const effectsJson = localStorage.getItem('alchemy-helper-inventory') ?? '[]';
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
      !('ingridient' in e) ||
      typeof e.ingridient !== 'number' ||
      !('count' in e) ||
      typeof e.count !== 'number' ||
      !ingridients.has(e.ingridient)
    ) {
      return;
    }

    map.set(e.ingridient, {
      ingridient: ingridients.get(e.ingridient)!,
      count: e.count,
    });
  });

  return map;
}

function storeInventoryInStorage(inventory: ReadonlyMap<number, Item>) {
  const list: {}[] = [];
  inventory.forEach((i) => {
    list.push({
      ingridient: i.ingridient.id,
      count: i.count,
    });
  });

  localStorage.setItem('alchemy-helper-inventory', JSON.stringify(list));
}

export function InventoryProvider({ children }: { children?: ReactNode }) {
  const { ingridients } = useIngridientEffects();

  const [inventory, setInventory] = useState<ReadonlyMap<number, Item>>(() =>
    loadInventoryFromStorage(ingridients),
  );

  const value = useMemo<InventoryContext>(() => {
    return {
      inventory,
      setInventory: (newInventory) => {
        setInventory(newInventory);
        storeInventoryInStorage(newInventory);
      },
    };
  }, [inventory]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useInventory(): InventoryContext {
  return useContext(Context);
}
