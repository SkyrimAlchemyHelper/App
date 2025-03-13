import { useState } from 'react';
import { Button } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import { idFormatter } from './idFormatter';
import { Ingredient, useIngredientEffects } from './IngredientEffects';
import { Item, useInventory } from './Inventory';
import { useSettings } from './Settings';

function importInventory(dataLocation: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    window.electron.ipcRenderer.once('import-file', (arg) => {
      if (arg) {
        resolve(arg);
      } else {
        reject();
      }
    });

    window.electron.ipcRenderer.sendMessage(
      'import-file',
      dataLocation,
      'Inventory.json',
    );
  });
}

function parseInventory(
  rawData: unknown,
  ingredients: ReadonlyMap<number, Ingredient>,
): ReadonlyMap<number, Item> {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error();
  }
  if (!('inventory' in rawData) || !Array.isArray(rawData.inventory)) {
    throw new Error();
  }
  const list: Item[] = [];

  rawData.inventory.forEach((row: unknown) => {
    if (!row || typeof row !== 'object') {
      throw new Error();
    }
    if (!('count' in row) || typeof row.count !== 'number') {
      throw new Error();
    }
    if (!('formId' in row) || typeof row.formId !== 'number') {
      throw new Error();
    }

    if (!ingredients.has(row.formId)) {
      throw new Error();
    }

    list.push({
      ingredient: ingredients.get(row.formId)!,
      count: row.count,
    });
  });

  return new Map(
    list
      .sort((a, b) =>
        idFormatter(a.ingredient.id).localeCompare(
          idFormatter(b.ingredient.id),
        ),
      )
      .map((i) => [i.ingredient.id, i]),
  );
}

export default function ImportInventoryButton() {
  const {
    settings: { dataLocation },
  } = useSettings();
  const { ingredients } = useIngredientEffects();

  const { setInventory } = useInventory();
  const [loading, setLoading] = useState(false);

  const clickHandler = async () => {
    setLoading(true);
    try {
      const rawData = await importInventory(dataLocation);
      setInventory(parseInventory(rawData, ingredients));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      color="primary"
      size="small"
      disabled={loading}
      startIcon={<PublishIcon />}
      onClick={clickHandler}
    >
      Import inventory
    </Button>
  );
}
