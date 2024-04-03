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
import { useMemo } from 'react';
import ImportInventoryButton from './importInventory';
import { Item, useInventory } from './Inventory';
import ImportEffectsButton from './ImportEffects';
import { Ingridient, IngridientEffect } from './IngridientEffects';
import arrayRenderer from './ArrayCellRenderer';
import { getPotionValue } from './effects';

type Recipe = {
  id: string;
  ingridients: readonly Ingridient[];
  effects: readonly IngridientEffect[];
  maxPotions: number;
  value: number;
};

const columns: readonly GridColDef<Recipe>[] = [
  {
    field: 'effects',
    headerName: 'Effects',
    type: 'string',
    flex: 1,
    valueGetter: (_, row) => row.effects.map((e) => e.effect.name),
    renderCell: arrayRenderer,
  },
  {
    field: 'ingridients',
    headerName: 'Ingridients',
    type: 'string',
    flex: 1,
    valueGetter: (_, row) => row.ingridients.map((i) => i.name),
    renderCell: arrayRenderer,
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
  ingridients: readonly Ingridient[],
): readonly IngridientEffect[] {
  const counts: Record<number, number> = {};
  const effects: Record<number, IngridientEffect> = {};
  const n = ingridients.length;
  for (let i = 0; i < n; i += 1) {
    const m = ingridients[i].effects.length;
    for (let j = 0; j < m; j += 1) {
      const effect = ingridients[i].effects[j];
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

  const list: IngridientEffect[] = [];
  Object.entries(counts).forEach(([key, value]) => {
    if (value < 2) {
      return;
    }

    list.push(effects[key as unknown as number]);
  });

  return list;
}

function checkRecipe(items: readonly Item[]): Recipe | undefined {
  const ingridients = items.map((i) => i.ingridient);
  const effects = getCommonEffects(ingridients);
  if (effects.length < 1) {
    return undefined;
  }

  return {
    id: ingridients.map((i) => i.id).join('-'),
    ingridients: Array.from(ingridients).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    effects,
    maxPotions: items.reduce((a, v) => Math.min(a, v.count), Infinity),
    value: getPotionValue(effects),
  };
}

function isRecipeImproved(recipe1: Recipe, recipe2: Recipe) {
  return recipe2.effects.length > recipe1.effects.length;
}

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
        if (recipe2 && (!recipe1 || isRecipeImproved(recipe1, recipe2))) {
          recipes.push(recipe2);
        }
      }
    }
  }

  return recipes;
}

export default function RecipeGrid() {
  const { inventory, setInventory } = useInventory();
  const recipes = useMemo(() => generateRecipes(inventory), [inventory]);
  const columnsWithActiions = useMemo(() => {
    const cols = Array.from(columns);
    cols.push({
      type: 'actions',
      field: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<>-1</>}
          onClick={() => {
            const newInventory = new Map(inventory);
            params.row.ingridients.forEach((i) => {
              const item = inventory.get(i.id)!;
              if (item.count === 1) {
                newInventory.delete(i.id);
              } else {
                newInventory.set(i.id, {
                  ingridient: item.ingridient,
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
            params.row.ingridients.forEach((i) => {
              const item = inventory.get(i.id)!;
              if (item.count === params.row.maxPotions) {
                newInventory.delete(i.id);
              } else {
                newInventory.set(i.id, {
                  ingridient: item.ingridient,
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
  }, [inventory, setInventory]);

  return (
    <DataGrid<Recipe>
      columns={columnsWithActiions}
      rows={recipes}
      slots={{ toolbar: CustomToolbar }}
      autoHeight
      getRowHeight={(p) => {
        const model = p.model as Recipe;

        return Math.max(model.effects.length, model.ingridients.length) * 32;
      }}
      rowSelection={false}
      initialState={{
        sorting: {
          sortModel: [{ field: 'value', sort: 'desc' }],
        },
      }}
    />
  );
}
