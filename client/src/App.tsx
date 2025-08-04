import { Box } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import BackupManager from "./components/BackupManager";
import Dashboard from "./components/Dashboard";
import EnvironmentManager from "./components/EnvironmentManager";
import ExtensionManager from "./components/ExtensionManager";
import IniEditor from "./components/IniEditor";
import Navbar from "./components/Navbar";
import Settings from "./components/Settings";
import { ApiProvider } from "./contexts/ApiContext";
import { NotificationProvider } from "./contexts/NotificationContext";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ApiProvider>
        <NotificationProvider>
          <Router>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <Navbar />
              <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route
                    path="/environments"
                    element={<EnvironmentManager />}
                  />
                  <Route path="/editor" element={<IniEditor />} />
                  <Route path="/extensions" element={<ExtensionManager />} />
                  <Route path="/backups" element={<BackupManager />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Box>
            </Box>
          </Router>
        </NotificationProvider>
      </ApiProvider>
    </ThemeProvider>
  );
}

export default App;
