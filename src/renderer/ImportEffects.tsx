import { Button } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import { useState } from 'react';
import { idFormatter } from './idFormatter';
import {
  Effect,
  Ingredient,
  IngredientEffect,
  useIngredientEffects,
} from './IngredientEffects';
import { useSettings } from './Settings';

function importIngredients(dataLocation: string): Promise<unknown> {
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
      'Effects.json',
    );
  });
}

function parseEffect(
  row: unknown,
  effects: Map<number, Effect>,
  effectNames: Map<string, Effect>,
): IngredientEffect {
  if (!row || typeof row !== 'object') {
    throw new Error();
  }

  if (!('formId' in row) || typeof row.formId !== 'number') {
    throw new Error();
  }
  if (!('baseCost' in row) || typeof row.baseCost !== 'number') {
    throw new Error();
  }
  if (!('duration' in row) || typeof row.duration !== 'number') {
    throw new Error();
  }
  if (!('magnitute' in row) || typeof row.magnitute !== 'number') {
    throw new Error();
  }
  if (!('name' in row) || typeof row.name !== 'string') {
    throw new Error();
  }
  if (
    !('noDuration' in row) ||
    (row.noDuration !== 0 && row.noDuration !== 1)
  ) {
    throw new Error();
  }
  if (
    !('noMagnitute' in row) ||
    (row.noMagnitute !== 0 && row.noMagnitute !== 1)
  ) {
    throw new Error();
  }
  if (
    !('powerEffectsDuration' in row) ||
    (row.powerEffectsDuration !== 0 && row.powerEffectsDuration !== 1)
  ) {
    throw new Error();
  }
  if (
    !('powerEffectsMagnitute' in row) ||
    (row.powerEffectsMagnitute !== 0 && row.powerEffectsMagnitute !== 1)
  ) {
    throw new Error();
  }

  const name = row.name.trim();
  let finalName = name;
  const existingName: { -readonly [P in keyof Effect]: Effect[P] } | undefined =
    effectNames.get(name);

  if (existingName && existingName.id !== row.formId) {
    existingName.name = `${name} (${idFormatter(existingName.id)})`;
    finalName = `${name} (${idFormatter(row.formId)})`;
  }

  const existing = effects.get(row.formId);
  if (!existing) {
    const effect: Effect = {
      id: row.formId,
      name: finalName,
      baseCost: row.baseCost,
      withDuration: row.noDuration === 0,
      withMagnitute: row.noMagnitute === 0,
      powerEffectsDuration: row.powerEffectsDuration === 1,
      powerEffectsMagnitute: row.powerEffectsMagnitute === 1,
    };

    effects.set(row.formId, effect);
    effectNames.set(name, effect);

    return {
      duration: row.duration,
      magnitute: row.magnitute,
      effect,
    };
  }

  if (
    existing.id !== row.formId ||
    existing.baseCost !== row.baseCost ||
    existing.withDuration !== (row.noDuration === 0) ||
    existing.withMagnitute !== (row.noMagnitute === 0) ||
    existing.powerEffectsDuration !== (row.powerEffectsDuration === 1) ||
    existing.powerEffectsMagnitute !== (row.powerEffectsMagnitute === 1)
  ) {
    throw new Error();
  }

  return {
    duration: row.duration,
    magnitute: row.magnitute,
    effect: existing,
  };
}

function parseIngredients(
  rawData: unknown,
  setEffects: (effects: Map<number, Effect>) => void,
  setIngredients: (ingredients: Map<number, Ingredient>) => void,
) {
  const effects = new Map<number, Effect>();
  const ingredientNames = new Map<string, Ingredient>();
  const effectNames = new Map<string, Effect>();
  const ingredients: Ingredient[] = [];
  if (!rawData || typeof rawData !== 'object') {
    throw new Error();
  }
  if (!('ingredients' in rawData) || !Array.isArray(rawData.ingredients)) {
    throw new Error();
  }

  rawData.ingredients.forEach((row: unknown) => {
    if (!row || typeof row !== 'object') {
      throw new Error();
    }
    if (!('formId' in row) || typeof row.formId !== 'number') {
      throw new Error();
    }
    if (!('name' in row) || typeof row.name !== 'string') {
      throw new Error();
    }
    if (!('effects' in row) || !Array.isArray(row.effects)) {
      throw new Error();
    }

    const name = row.name.trim();
    let finalName = name;
    const existingName:
      | { -readonly [P in keyof Ingredient]: Ingredient[P] }
      | undefined = ingredientNames.get(name);

    if (existingName && existingName.id !== row.formId) {
      existingName.name = `${name} (${idFormatter(existingName.id)})`;
      finalName = `${name} (${idFormatter(row.formId)})`;
    }

    const ingredient: Ingredient = {
      id: row.formId,
      name: finalName,
      effects: row.effects.map(
        (effectRow: unknown): IngredientEffect =>
          parseEffect(effectRow, effects, effectNames),
      ),
    };

    ingredientNames.set(name, ingredient);
    ingredients.push(ingredient);
  });

  setEffects(
    new Map(
      Array.from(effects.values())
        .sort((a, b) => idFormatter(a.id).localeCompare(idFormatter(b.id)))
        .map((e) => [e.id, e]),
    ),
  );

  setIngredients(
    new Map(
      ingredients
        .sort((a, b) => idFormatter(a.id).localeCompare(idFormatter(b.id)))
        .map((i) => [i.id, i]),
    ),
  );
}

export default function ImportEffectsButton() {
  const {
    settings: { dataLocation },
  } = useSettings();
  const { setEffects, setIngredients } = useIngredientEffects();
  const [loading, setLoading] = useState(false);

  const clickHandler = async () => {
    setLoading(true);
    try {
      const rawData = await importIngredients(dataLocation);
      parseIngredients(rawData, setEffects, setIngredients);
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
      Import ingredient effects
    </Button>
  );
}
