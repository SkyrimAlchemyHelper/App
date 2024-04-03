import { useState } from 'react';
import { Button } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import { Ingridient, useIngridientEffects } from './IngridientEffects';
import { Item, useInventory } from './Inventory';
import { useSettings } from './Settings';
import { parseIntFromLog } from './ImportParsers';

function importInventory(logsLocation: string): Promise<readonly string[]> {
  return new Promise((resolve, reject) => {
    window.electron.ipcRenderer.once('import-file', (arg) => {
      if (Array.isArray(arg)) {
        resolve(arg);
      } else {
        reject(arg);
      }
    });

    window.electron.ipcRenderer.sendMessage(
      'import-file',
      `${logsLocation}\\AlchemyHelperIngridients.0.log`,
    );
  });
}

function parseInventory(
  rawData: readonly string[],
  ingridients: ReadonlyMap<number, Ingridient>,
): ReadonlyMap<number, Item> {
  const list: Item[] = [];

  rawData.forEach((row) => {
    if (!row.startsWith('Ingridient: ')) {
      throw new Error('Invalid data in log file');
    }

    const [rawId, rawCount] = row.slice(12).split(';');

    const id = parseIntFromLog(rawId);
    if (!ingridients.has(id)) {
      throw new Error('Invalid data in log file');
    }

    list.push({
      ingridient: ingridients.get(id)!,
      count: parseIntFromLog(rawCount),
    });
  });

  return new Map(
    list
      .sort((a, b) => a.ingridient.id - b.ingridient.id)
      .map((i) => [i.ingridient.id, i]),
  );
}

export default function ImportInventoryButton() {
  const {
    settings: { logsLocation },
  } = useSettings();
  const { ingridients } = useIngridientEffects();

  const { setInventory } = useInventory();
  const [loading, setLoading] = useState(false);

  const clickHandler = async () => {
    setLoading(true);
    try {
      const rawData = await importInventory(logsLocation);
      setInventory(parseInventory(rawData, ingridients));
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
