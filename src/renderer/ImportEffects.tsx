import { Button } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import { useState } from 'react';
import { Effect, Ingridient, useIngridientEffects } from './IngridientEffects';
import { useSettings } from './Settings';
import {
  parseBooleanFromLog,
  parseFloatFromLog,
  parseIntFromLog,
} from './ImportParsers';

function importIngridients(logsLocation: string): Promise<readonly string[]> {
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
      `${logsLocation}\\AlchemyHelperEffects.0.log`,
    );
  });
}

type WriteableIngridient = {
  id: number;
  name: string;
  effects: {
    readonly effect: Effect;
    readonly duration: number;
    readonly magnitute: number;
  }[];
};

function parseIngridients(
  rawData: readonly string[],
  setEffects: (effects: Map<number, Effect>) => void,
  setIngridients: (ingridients: Map<number, Ingridient>) => void,
) {
  const effects = new Map<number, Effect>();
  const ingridients: Ingridient[] = [];
  let currentIgridient: WriteableIngridient | undefined;

  rawData.forEach((row) => {
    if (row.startsWith('Ingridient: ')) {
      const [rawId, ...rest] = row.slice(12).split(';');

      currentIgridient = {
        id: parseIntFromLog(rawId),
        name: rest.join(';'),
        effects: [],
      };

      ingridients.push(currentIgridient);
    } else if (row.startsWith('Effect: ')) {
      if (!currentIgridient) {
        throw new Error('Invalid data in log file');
      }

      const [
        rawId,
        rawDuration,
        rawMagnitute,
        rawBaseCost,
        rawWithoutDuration,
        rawWithoutMagnitute,
        rawPowerEffectDuration,
        rawPowerEffectsMagnitute,
        ...rest
      ] = row.slice(8).split(';');

      const id = parseIntFromLog(rawId);
      let effect: Effect;
      if (effects.has(id)) {
        effect = effects.get(id)!;
      } else {
        effect = {
          id,
          baseCost: parseFloatFromLog(rawBaseCost),
          withDuration: !parseBooleanFromLog(rawWithoutDuration),
          withMagnitute: !parseBooleanFromLog(rawWithoutMagnitute),
          powerEffectsDuration: parseBooleanFromLog(rawPowerEffectDuration),
          powerEffectsMagnitute: parseBooleanFromLog(rawPowerEffectsMagnitute),
          name: rest.join(';'),
        };
        effects.set(id, effect);
      }

      currentIgridient.effects.push({
        effect,
        duration: parseIntFromLog(rawDuration),
        magnitute: parseFloatFromLog(rawMagnitute),
      });
    } else {
      throw new Error('Invalid data in log file');
    }
  });

  setEffects(
    new Map(
      Array.from(effects.values())
        .sort((a, b) => a.id - b.id)
        .map((e) => [e.id, e]),
    ),
  );

  setIngridients(
    new Map(ingridients.sort((a, b) => a.id - b.id).map((i) => [i.id, i])),
  );
}

export default function ImportEffectsButton() {
  const {
    settings: { logsLocation },
  } = useSettings();
  const { setEffects, setIngridients } = useIngridientEffects();
  const [loading, setLoading] = useState(false);

  const clickHandler = async () => {
    setLoading(true);
    try {
      const rawData = await importIngridients(logsLocation);
      parseIngridients(rawData, setEffects, setIngridients);
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
      Import ingridient effects
    </Button>
  );
}
