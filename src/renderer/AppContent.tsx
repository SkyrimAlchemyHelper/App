import { Box, Tab, Tabs } from '@mui/material';
import { ReactNode, useState } from 'react';
import { SettingsForm } from './Settings';
import IngredientGrid from './IngredientGrid';
import InventoryGrid from './InventoryGrid';
import RecipeGrid from './RecipeGrid';

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

type TabPanelProps = {
  children?: ReactNode;
  index: number;
};

function TabPanel(props: TabPanelProps) {
  const { children, index } = props;

  return (
    <Box
      role="tabpanel"
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      sx={{ p: 3, flex: '1 1 auto' }}
    >
      {children}
    </Box>
  );
}

export default function AppContent() {
  const [activeTab, setValue] = useState(0);

  const handleChange = (_: unknown, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexFlow: 'column',
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', flex: '0 1 auto' }}>
        <Tabs value={activeTab} onChange={handleChange} aria-label="Navigation">
          <Tab label="Settings" {...a11yProps(0)} />
          <Tab label="Ingredients" {...a11yProps(1)} />
          <Tab label="Inventory" {...a11yProps(2)} />
          <Tab label="Recipes" {...a11yProps(3)} />
        </Tabs>
      </Box>
      {activeTab !== 0 ? null : (
        <TabPanel index={0}>
          <SettingsForm />
        </TabPanel>
      )}
      {activeTab !== 1 ? null : (
        <TabPanel index={1}>
          <IngredientGrid />
        </TabPanel>
      )}
      {activeTab !== 2 ? null : (
        <TabPanel index={2}>
          <InventoryGrid />
        </TabPanel>
      )}
      {activeTab !== 3 ? null : (
        <TabPanel index={3}>
          <RecipeGrid />
        </TabPanel>
      )}
    </Box>
  );
}
