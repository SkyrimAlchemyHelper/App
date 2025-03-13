import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';
import { ComponentProps, useMemo } from 'react';
import { arraySingleSelectOperators } from './arrayFilterOperators';
import ImportInventoryButton from './importInventory';
import { Item, useInventory } from './Inventory';
import ImportEffectsButton from './ImportEffects';
import {
  Effect,
  Ingredient,
  IngredientEffect,
  useIngredientEffects,
} from './IngredientEffects';
import { arraySingleSelectRenderer } from './ArrayCellRenderer';
import { getPotionValue } from './effects';

type Recipe = {
  id: string;
  ingredients: readonly Ingredient[];
  effects: readonly IngredientEffect[];
  maxPotions: number;
  value: number;
};

const columns: readonly GridColDef<Recipe>[] = [
  {
    field: 'effects',
    headerName: 'Effects',
    type: 'singleSelect',
    flex: 1,
    getOptionValue: ((o: Effect) => o.id) as any,
    getOptionLabel: ((o: Effect) => o.name) as any,
    valueGetter: (_, row) => row.effects.map((e) => e.effect),
    renderCell: arraySingleSelectRenderer,
    filterOperators: arraySingleSelectOperators,
  },
  {
    field: 'ingredients',
    headerName: 'Ingredients',
    type: 'singleSelect',
    flex: 1,
    getOptionValue: ((o: Ingredient) => o.id) as any,
    getOptionLabel: ((o: Ingredient) => o.name) as any,
    renderCell: arraySingleSelectRenderer,
    filterOperators: arraySingleSelectOperators,
  },
  {
    field: 'value',
    headerName: 'Value',
    type: 'number',
    width: 120,
  },
  {
    field: 'maxPotions',
    headerName: 'Max craft count',
    type: 'number',
    width: 70,
  },
];

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <ImportEffectsButton />
      <ImportInventoryButton />
    </GridToolbarContainer>
  );
}

function getCommonEffects(
  ingredients: readonly Ingredient[],
): readonly IngredientEffect[] {
  const counts: Record<number, number> = {};
  const effects: Record<number, IngredientEffect> = {};
  const n = ingredients.length;
  for (let i = 0; i < n; i += 1) {
    const m = ingredients[i].effects.length;
    for (let j = 0; j < m; j += 1) {
      const effect = ingredients[i].effects[j];
      const { id } = effect.effect;
      if (
        !(id in effects) ||
        (effect.effect.powerEffectsMagnitute &&
          effect.magnitute > effects[id].magnitute) ||
        (effect.effect.powerEffectsDuration &&
          effect.duration > effects[id].duration)
      ) {
        effects[id] = effect;
      }

      if (id in counts) {
        counts[id] += 1;
      } else {
        counts[id] = 1;
      }
    }
  }

  const list: IngredientEffect[] = [];
  Object.entries(counts).forEach(([key, value]) => {
    if (value < 2) {
      return;
    }

    list.push(effects[key as unknown as number]);
  });

  return list;
}

function hasUselessIngredients(
  ingredients: readonly Ingredient[],
  effects: readonly IngredientEffect[],
) {
  const ingredientsLength = ingredients.length;
  if (ingredientsLength < 3) {
    return false;
  }
  const effectsLength = effects.length;

  const counts: Record<number, Record<number, number>> = {};
  for (let i = 0; i < ingredientsLength; i += 1) {
    counts[i] = {};
    const ingredientEffectsLength = ingredients[i].effects.length;
    for (let j = 0; j < ingredientEffectsLength; j += 1) {
      const ingredientEffect = ingredients[i].effects[j];
      for (let k = 0; k < effectsLength; k += 1) {
        if (ingredientEffect.effect.id !== effects[k].effect.id) {
          continue;
        }

        if (!(ingredientEffect.effect.id in counts[i])) {
          counts[i][ingredientEffect.effect.id] = 1;
        } else {
          counts[i][ingredientEffect.effect.id] += 1;
        }
      }
    }
  }

  for (let i = 0; i < ingredientsLength; i += 1) {
    if (Object.values(counts[i]).every((count) => count > 2)) {
      return true;
    }
  }

  return false;
}

function checkRecipe(items: readonly Item[]): Recipe | undefined {
  const ingredients = items.map((i) => i.ingredient);
  const effects = getCommonEffects(ingredients);
  if (effects.length < 1 || hasUselessIngredients(ingredients, effects)) {
    return undefined;
  }

  return {
    id: ingredients.map((i) => i.id).join('-'),
    ingredients: Array.from(ingredients).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    effects,
    maxPotions: items.reduce((a, v) => Math.min(a, v.count), Infinity),
    value: getPotionValue(effects),
  };
}

const getRowHeight: ComponentProps<typeof DataGrid<Recipe>>['getRowHeight'] = (
  p,
) => {
  const model = p.model as Recipe;

  return Math.max(model.effects.length, model.ingredients.length) * 32;
};

const initialState: ComponentProps<typeof DataGrid<Recipe>>['initialState'] = {
  sorting: {
    sortModel: [{ field: 'value', sort: 'desc' }],
  },
};

const slots: ComponentProps<typeof DataGrid<Recipe>>['slots'] = {
  toolbar: CustomToolbar,
};

function generateRecipes(inventory: ReadonlyMap<number, Item>) {
  const recipes: Recipe[] = [];
  const n = inventory.size;
  const items = Array.from(inventory.values());

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const recipe1 = checkRecipe([items[i], items[j]]);
      if (recipe1) {
        recipes.push(recipe1);
      }
      for (let k = j + 1; k < n; k += 1) {
        const recipe2 = checkRecipe([items[i], items[j], items[k]]);
        if (recipe2) {
          recipes.push(recipe2);
        }
      }
    }
  }

  return recipes;
}

export default function RecipeGrid() {
  const { inventory, setInventory } = useInventory();
  const { effects, ingredients } = useIngredientEffects();
  const recipes = useMemo(() => generateRecipes(inventory), [inventory]);
  const columnsWithActions = useMemo(() => {
    const cols = columns.map((col) => {
      if (col.field === 'effects') {
        return {
          ...col,
          valueOptions: Array.from(effects.values()),
        };
      }

      if (col.field === 'ingredients') {
        return {
          ...col,
          valueOptions: Array.from(ingredients.values()),
        };
      }

      return col;
    });

    cols.push({
      type: 'actions',
      field: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<>-1</>}
          onClick={() => {
            const newInventory = new Map(inventory);
            params.row.ingredients.forEach((i) => {
              const item = inventory.get(i.id)!;
              if (item.count === 1) {
                newInventory.delete(i.id);
              } else {
                newInventory.set(i.id, {
                  ingredient: item.ingredient,
                  count: item.count - 1,
                });
              }
            });
            setInventory(newInventory);
          }}
          label="Craft one"
        />,
        <GridActionsCellItem
          icon={<>-{params.row.maxPotions}</>}
          onClick={() => {
            const newInventory = new Map(inventory);
            params.row.ingredients.forEach((i) => {
              const item = inventory.get(i.id)!;
              if (item.count === params.row.maxPotions) {
                newInventory.delete(i.id);
              } else {
                newInventory.set(i.id, {
                  ingredient: item.ingredient,
                  count: item.count - params.row.maxPotions,
                });
              }
            });
            setInventory(newInventory);
          }}
          label="Craft max"
        />,
      ],
    });

    return cols;
  }, [effects, ingredients, inventory, setInventory]);

  return (
    <DataGrid<Recipe>
      columns={columnsWithActions}
      rows={recipes}
      slots={slots}
      autoHeight
      getRowHeight={getRowHeight}
      rowSelection={false}
      initialState={initialState}
    />
  );
}
