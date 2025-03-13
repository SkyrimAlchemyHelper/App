import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './App.css';
import CssBaseline from '@mui/material/CssBaseline';
import { SettingsProvider } from './Settings';
import { IngredientEffectsProvider } from './IngredientEffects';
import AppContent from './AppContent';
import { InventoryProvider } from './Inventory';

export default function App() {
  return (
    <CssBaseline>
      <SettingsProvider>
        <IngredientEffectsProvider>
          <InventoryProvider>
            <AppContent />
          </InventoryProvider>
        </IngredientEffectsProvider>
      </SettingsProvider>
    </CssBaseline>
  );
}
