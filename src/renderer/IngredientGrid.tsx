import {
  DataGrid,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';
import { useMemo } from 'react';
import { arraySingleSelectOperators } from './arrayFilterOperators';
import { idFormatter } from './idFormatter';
import { Effect, Ingredient, useIngredientEffects } from './IngredientEffects';
import ImportEffectsButton from './ImportEffects';
import { arrayRenderer, arraySingleSelectRenderer } from './ArrayCellRenderer';
import { getEffectValue } from './effects';

const floatNumberFormatter = Intl.NumberFormat(undefined, {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const floatFormatter = (v: readonly number[]) => {
  return v.map((n) => floatNumberFormatter.format(n));
};

const columns: readonly GridColDef<Ingredient>[] = [
  {
    field: 'id',
    headerName: 'ID',
    type: 'number',
    valueFormatter: idFormatter,
    width: 100,
  },
  {
    field: 'name',
    headerName: 'Name',
    type: 'string',
    flex: 1,
  },
  {
    field: 'effectName',
    headerName: 'Effect',
    type: 'singleSelect',
    flex: 1,
    getOptionValue: ((o: Effect) => o.id) as any,
    getOptionLabel: ((o: Effect) => o.name) as any,
    valueGetter: (_, row) => row.effects.map((e) => e.effect),
    renderCell: arraySingleSelectRenderer,
    filterOperators: arraySingleSelectOperators,
  },
  {
    field: 'effectDuration',
    headerName: 'Duration',
    type: 'number',
    valueGetter: (_, row) => row.effects.map((e) => e.duration),
    width: 50,
    renderCell: arrayRenderer,
  },
  {
    field: 'effectMagnitute',
    headerName: 'Magnitute',
    type: 'number',
    valueGetter: (_, row) => row.effects.map((e) => e.magnitute),
    valueFormatter: floatFormatter,
    width: 50,
    renderCell: arrayRenderer,
  },
  {
    field: 'effectValue',
    headerName: 'Effect value',
    type: 'number',
    valueGetter: (_, row) => row.effects.map((e) => getEffectValue(e)),
    getSortComparator: (dir) =>
      dir === 'asc'
        ? (a, b) => Math.min(...a) - Math.min(...b)
        : (a, b) => Math.max(...b) - Math.max(...a),
    width: 50,
    renderCell: arrayRenderer,
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
    </GridToolbarContainer>
  );
}

export default function IngredientGrid() {
  const { ingredients, effects } = useIngredientEffects();

  const cols = useMemo(
    () =>
      columns.map((column) => {
        if (column.field === 'effectName') {
          return {
            ...column,
            valueOptions: Array.from(effects.values()),
          };
        }

        return column;
      }),
    [effects],
  );

  return (
    <DataGrid<Ingredient>
      columns={cols}
      rows={Array.from(ingredients.values())}
      rowSelection={false}
      autoHeight
      slots={{ toolbar: CustomToolbar }}
      getRowHeight={({ model }) => (model as Ingredient).effects.length * 32}
      initialState={{
        sorting: {
          sortModel: [{ field: 'effectValue', sort: 'desc' }],
        },
      }}
    />
  );
}
