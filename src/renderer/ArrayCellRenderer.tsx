import { Box } from '@mui/material';

const arrayRenderer = ({ formattedValue }: { formattedValue?: string[] }) => {
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

export default arrayRenderer;
