import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './App.css';
import CssBaseline from '@mui/material/CssBaseline';
import { SettingsProvider } from './Settings';
import { IngridientEffectsProvider } from './IngridientEffects';
import AppContent from './AppContent';
import { InventoryProvider } from './Inventory';

export default function App() {
  return (
    <CssBaseline>
      <SettingsProvider>
        <IngridientEffectsProvider>
          <InventoryProvider>
            <AppContent />
          </InventoryProvider>
        </IngridientEffectsProvider>
      </SettingsProvider>
    </CssBaseline>
  );
}
