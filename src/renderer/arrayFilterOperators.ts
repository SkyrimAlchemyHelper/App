import {
  getGridSingleSelectOperators,
  GridFilterOperator,
} from '@mui/x-data-grid';
import { GridSingleSelectColDef } from '@mui/x-data-grid/models/colDef/gridColDef';

const singleSelect = getGridSingleSelectOperators().find(
  (o) => o.value === 'isAnyOf',
);
if (!singleSelect) {
  throw new Error('Missing select operator');
}

export const arraySingleSelectOperators: GridFilterOperator[] = [
  {
    value: 'partially',
    label: 'Partially',
    getApplyFilterFn: (filterItem, column) => {
      const col = column as GridSingleSelectColDef;
      if (col.type !== 'singleSelect' || !col.getOptionValue) {
        return null;
      }
      const { value: filterValues } = filterItem;
      if (!Array.isArray(filterValues) || filterValues.length === 0) {
        return null;
      }
      const { getOptionValue } = col;

      return (values) => {
        return (
          Array.isArray(values) &&
          filterValues.every((filterValue) =>
            values.some((value) => getOptionValue(value) === filterValue),
          )
        );
      };
    },
    InputComponent: singleSelect.InputComponent,
  },
  {
    value: 'exactly',
    label: 'Exactly',
    getApplyFilterFn: (filterItem, column) => {
      const col = column as GridSingleSelectColDef;
      if (col.type !== 'singleSelect' || !col.getOptionValue) {
        return null;
      }
      const { value: filterValues } = filterItem;
      if (!Array.isArray(filterValues) || filterValues.length === 0) {
        return null;
      }
      const { getOptionValue } = col;

      return (values) => {
        return (
          Array.isArray(values) &&
          values.length === filterValues.length &&
          filterValues.every((filterValue) =>
            values.some((value) => getOptionValue(value) === filterValue),
          )
        );
      };
    },
    InputComponent: singleSelect.InputComponent,
  },
  {
    value: 'without',
    label: 'Without',
    getApplyFilterFn: (filterItem, column) => {
      const col = column as GridSingleSelectColDef;
      if (col.type !== 'singleSelect' || !col.getOptionValue) {
        return null;
      }
      const { value: filterValues } = filterItem;
      if (!Array.isArray(filterValues) || filterValues.length === 0) {
        return null;
      }
      const { getOptionValue } = col;

      return (values) => {
        return (
          Array.isArray(values) &&
          filterValues.every((filterValue) =>
            values.every((value) => getOptionValue(value) !== filterValue),
          )
        );
      };
    },
    InputComponent: singleSelect.InputComponent,
  },
];
