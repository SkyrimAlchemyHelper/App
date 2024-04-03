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
  readonly logsLocation: string;
};

const defaultSettings: StoredSettings = {
  logsLocation:
    '%UserProfile%\\Documents\\My Games\\Skyrim Special Edition\\Logs\\Script\\User',
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
      'logsLocation' in parsedSettings &&
      typeof parsedSettings.logsLocation === 'string'
    ) {
      processedSettings.logsLocation = parsedSettings.logsLocation;
    } else {
      processedSettings.logsLocation = defaultSettings.logsLocation;
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
  const [logsLocation, setLogsLocation] = useState(settings.logsLocation);

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        setSettings({ logsLocation });
      }}
    >
      <TextField
        fullWidth
        name="logsLocation"
        label="Logs location"
        value={logsLocation}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setLogsLocation(event.target.value);
        }}
        InputProps={{
          endAdornment: (
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  setLogsLocation(await selectDirectory(logsLocation));
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
