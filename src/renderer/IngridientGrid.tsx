import {
  DataGrid,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';
import { Ingridient, useIngridientEffects } from './IngridientEffects';
import ImportEffectsButton from './ImportEffects';
import arrayRenderer from './ArrayCellRenderer';
import { getEffectValue } from './effects';

const idFormetter = (v: number) =>
  v.toString(16).padStart(8, '0').toUpperCase();

const columns: readonly GridColDef<Ingridient>[] = [
  {
    field: 'id',
    headerName: 'ID',
    type: 'number',
    valueFormatter: idFormetter,
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
    valueGetter: (_, row) => row.effects.map((e) => e.effect.name),
    flex: 1,
    renderCell: arrayRenderer,
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

export default function IngridientGrid() {
  const { ingridients } = useIngridientEffects();

  return (
    <DataGrid<Ingridient>
      columns={columns}
      rows={Array.from(ingridients.values())}
      rowSelection={false}
      autoHeight
      slots={{ toolbar: CustomToolbar }}
      getRowHeight={({ model }) => (model as Ingridient).effects.length * 32}
      initialState={{
        sorting: {
          sortModel: [{ field: 'effectValue', sort: 'desc' }],
        },
      }}
    />
  );
}
