import {
  DataGrid,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
} from '@mui/x-data-grid';
import ImportInventoryButton from './importInventory';
import { Item, useInventory } from './Inventory';

const columns: readonly GridColDef<Item>[] = [
  {
    field: 'ingridient.name',
    headerName: 'Ingridient',
    type: 'string',
    flex: 1,
    valueGetter: (_, row) => row.ingridient.name,
  },
  {
    field: 'count',
    headerName: 'Count',
    type: 'number',
    width: 50,
  },
];

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <ImportInventoryButton />
    </GridToolbarContainer>
  );
}

export default function InventoryGrid() {
  const { inventory } = useInventory();

  return (
    <DataGrid<Item>
      columns={columns}
      rows={Array.from(inventory.values())}
      autoHeight
      rowSelection={false}
      getRowId={(p) => p.ingridient.id}
      slots={{ toolbar: CustomToolbar }}
    />
  );
}
