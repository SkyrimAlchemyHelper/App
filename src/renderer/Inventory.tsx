import { ReactNode, createContext, useContext, useMemo, useState } from 'react';
import { Ingredient, useIngredientEffects } from './IngredientEffects';

export type Item = {
  readonly ingredient: Ingredient;
  readonly count: number;
};

type InventoryContext = {
  inventory: ReadonlyMap<number, Item>;
  setInventory: (ingredients: ReadonlyMap<number, Item>) => void;
};

const Context = createContext<InventoryContext>({
  inventory: new Map(),
  setInventory: () => {},
});

function loadInventoryFromStorage(
  ingredients: ReadonlyMap<number, Ingredient>,
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
      !('ingredient' in e) ||
      typeof e.ingredient !== 'number' ||
      !('count' in e) ||
      typeof e.count !== 'number' ||
      !ingredients.has(e.ingredient)
    ) {
      return;
    }

    map.set(e.ingredient, {
      ingredient: ingredients.get(e.ingredient)!,
      count: e.count,
    });
  });

  return map;
}

function storeInventoryInStorage(inventory: ReadonlyMap<number, Item>) {
  const list: {}[] = [];
  inventory.forEach((i) => {
    list.push({
      ingredient: i.ingredient.id,
      count: i.count,
    });
  });

  localStorage.setItem('alchemy-helper-inventory', JSON.stringify(list));
}

export function InventoryProvider({ children }: { children?: ReactNode }) {
  const { ingredients } = useIngredientEffects();

  const [inventory, setInventory] = useState<ReadonlyMap<number, Item>>(() =>
    loadInventoryFromStorage(ingredients),
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
