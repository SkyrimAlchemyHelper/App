import { Box, Button, ButtonGroup, TextField } from '@mui/material';
import {
  ChangeEvent,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

type StoredSettings = {
  readonly dataLocation: string;
};

const defaultSettings: StoredSettings = {
  dataLocation: '',
};

const SettingsContext = createContext<{
  settings: StoredSettings;
  setSettings: (settings: StoredSettings) => void;
}>({
  settings: defaultSettings,
  setSettings: () => {},
});

function storeSettings(settings: StoredSettings) {
  localStorage.setItem('alchemy-helper-settings', JSON.stringify(settings));
}

export function SettingsProvider({ children }: { children?: ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(() => {
    const settingsJSON =
      localStorage.getItem('alchemy-helper-settings') ?? '{}';
    let parsedSettings: unknown;
    try {
      parsedSettings = JSON.parse(settingsJSON);
    } catch {
      return defaultSettings;
    }

    if (!parsedSettings || typeof parsedSettings !== 'object') {
      return defaultSettings;
    }

    const processedSettings: {
      -readonly [P in keyof StoredSettings]?: StoredSettings[P];
    } = {};
    if (
      'dataLocation' in parsedSettings &&
      typeof parsedSettings.dataLocation === 'string'
    ) {
      processedSettings.dataLocation = parsedSettings.dataLocation;
    } else {
      processedSettings.dataLocation = defaultSettings.dataLocation;
    }

    return processedSettings as StoredSettings;
  });

  const value = useMemo(
    () => ({
      settings,
      setSettings: (newSettings: StoredSettings) => {
        setSettings(newSettings);
        storeSettings(newSettings);
      },
    }),
    [settings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): {
  settings: StoredSettings;
  setSettings: (settings: StoredSettings) => void;
} {
  return useContext(SettingsContext);
}

const selectDirectory = (defaultPath: string) =>
  new Promise<string>((resolve, reject) => {
    window.electron.ipcRenderer.once('select-directory', (arg) => {
      if (typeof arg === 'string') {
        resolve(arg);
      } else {
        reject(arg);
      }
    });

    window.electron.ipcRenderer.sendMessage('select-directory', defaultPath);
  });

export function SettingsForm(): ReactNode {
  const { settings, setSettings } = useSettings();
  const [dataLocation, setDataLocation] = useState(settings.dataLocation);

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        setSettings({ dataLocation });
      }}
    >
      <TextField
        fullWidth
        name="dataLocation"
        label="Data location"
        value={dataLocation || ''}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setDataLocation(event.target.value);
        }}
        helperText={
          <>
            Example C:\Steam\steamapps\common\Skyrim Special
            Edition\Data\skse\plugins\AlchemyHelper
          </>
        }
        InputProps={{
          endAdornment: (
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  setDataLocation(await selectDirectory(dataLocation));
                } catch {
                  // Ignore.
                }
              }}
            >
              Browse...
            </Button>
          ),
        }}
      />
      <ButtonGroup sx={{ mt: 1 }}>
        <Button variant="outlined" type="submit">
          Save
        </Button>
      </ButtonGroup>
    </Box>
  );
}
