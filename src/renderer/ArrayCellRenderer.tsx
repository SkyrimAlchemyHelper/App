import { Box } from '@mui/material';
import {
  GridBaseColDef,
  GridSingleSelectColDef,
  ValueOptions,
} from '@mui/x-data-grid/models/colDef/gridColDef';

export const arrayRenderer = ({
  formattedValue,
}: {
  formattedValue?: string[];
}) => {
  if (!Array.isArray(formattedValue)) {
    return '';
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexFlow: 'column',
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
      }}
    >
      {formattedValue.map((v, i) => (
        <Box
          sx={{ flex: '1 1 auto', height: 'auto', lineHeight: '1.7' }}
          // eslint-disable-next-line react/no-array-index-key
          key={i}
        >
          {v}
        </Box>
      ))}
    </Box>
  );
};

export const arraySingleSelectRenderer: GridBaseColDef['renderCell'] = (
  params,
) => {
  if (!Array.isArray(params.value)) {
    return '';
  }

  const colDef = params.colDef as GridSingleSelectColDef;
  if (colDef.type !== 'singleSelect') {
    return '';
  }

  const formattedValue = params.value.map((v) =>
    colDef.getOptionLabel!(v as ValueOptions),
  );

  return arrayRenderer({ formattedValue });
};
