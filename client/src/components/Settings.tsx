import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Computer as ComputerIcon,
  Folder as FolderIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';

const Settings: React.FC = () => {
  const api = useApi();
  const { showError, showSuccess, showInfo } = useNotification();
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [aboutDialog, setAboutDialog] = useState(false);

  // Environment paths
  const [pvmPath, setPvmPath] = useState('');
  const [laragonPath, setLaragonPath] = useState('');
  const [xamppPath, setXamppPath] = useState('');
  const [wampPath, setWampPath] = useState('');
  const [defaultPath, setDefaultPath] = useState('');

  // Application settings
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupRetention, setBackupRetention] = useState(30);
  const [validateOnSave, setValidateOnSave] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const loadSettings = () => {
    // Load from environment variables or localStorage
    setPvmPath(process.env.REACT_APP_PVM_PATH || '');
    setLaragonPath(process.env.REACT_APP_LARAGON_PATH || '');
    setXamppPath(process.env.REACT_APP_XAMPP_PATH || '');
    setWampPath(process.env.REACT_APP_WAMP_PATH || '');
    setDefaultPath(process.env.REACT_APP_DEFAULT_PATH || '');

    // Load application settings from localStorage
    setAutoBackup(localStorage.getItem('autoBackup') !== 'false');
    setBackupRetention(parseInt(localStorage.getItem('backupRetention') || '30'));
    setValidateOnSave(localStorage.getItem('validateOnSave') !== 'false');
    setShowAdvanced(localStorage.getItem('showAdvanced') === 'true');
  };

  const saveSettings = () => {
    // Save application settings to localStorage
    localStorage.setItem('autoBackup', autoBackup.toString());
    localStorage.setItem('backupRetention', backupRetention.toString());
    localStorage.setItem('validateOnSave', validateOnSave.toString());
    localStorage.setItem('showAdvanced', showAdvanced.toString());

    showSuccess('Settings saved successfully');
  };

  const checkHealth = async () => {
    try {
      const health = await api.healthCheck();
      setHealthStatus(health);
      
      // Get system info from environments
      const environments = await api.getPhpEnvironments();
      setSystemInfo(environments.systemInfo);
    } catch (error) {
      console.error('Error checking health:', error);
      setHealthStatus({ status: 'ERROR', error: 'Failed to connect to server' });
    }
  };

  useEffect(() => {
    loadSettings();
    checkHealth();
  }, [api]);

  const environmentPaths = [
    {
      name: 'PVM Path',
      description: 'Path to PVM PHP installations',
      value: pvmPath,
      setValue: setPvmPath,
      example: 'C:/Users/Username/pvm/',
    },
    {
      name: 'Laragon Path',
      description: 'Path to Laragon bin directory',
      value: laragonPath,
      setValue: setLaragonPath,
      example: 'C:/laragon/bin/',
    },
    {
      name: 'XAMPP Path',
      description: 'Path to XAMPP PHP directory',
      value: xamppPath,
      setValue: setXamppPath,
      example: 'C:/xampp/php/',
    },
    {
      name: 'WAMP Path',
      description: 'Path to WAMP bin directory',
      value: wampPath,
      setValue: setWampPath,
      example: 'C:/wamp64/bin/',
    },
    {
      name: 'Default Path',
      description: 'Default PHP installation path',
      value: defaultPath,
      setValue: setDefaultPath,
      example: 'C:/php/',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Settings
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={() => setAboutDialog(true)}
            >
              About
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveSettings}
            >
              Save Settings
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* System Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">System Status</Typography>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={checkHealth}
                    size="small"
                  >
                    Refresh
                  </Button>
                </Box>
                
                {healthStatus ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {healthStatus.status === 'OK' ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                        <Typography variant="body2">
                          Server: {healthStatus.status}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Version: {healthStatus.version}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Environment: {healthStatus.environment}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Platform: {systemInfo?.platform} {systemInfo?.architecture}
                      </Typography>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Loading system status...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Environment Paths */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  PHP Environment Paths
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Configure paths to your PHP installations. These paths are used to automatically detect PHP environments.
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  Note: These settings require server restart to take effect. Update your .env file on the server with these values.
                </Alert>

                <Grid container spacing={2}>
                  {environmentPaths.map((path) => (
                    <Grid item xs={12} key={path.name}>
                      <TextField
                        fullWidth
                        label={path.name}
                        value={path.value}
                        onChange={(e) => path.setValue(e.target.value)}
                        placeholder={path.example}
                        helperText={path.description}
                        InputProps={{
                          startAdornment: <FolderIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Application Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Application Settings
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Auto Backup"
                      secondary="Automatically create backups before making changes"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoBackup}
                          onChange={(e) => setAutoBackup(e.target.checked)}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Validate on Save"
                      secondary="Validate INI syntax before saving changes"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={validateOnSave}
                          onChange={(e) => setValidateOnSave(e.target.checked)}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Show Advanced Options"
                      secondary="Display advanced configuration options"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAdvanced}
                          onChange={(e) => setShowAdvanced(e.target.checked)}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <TextField
                  fullWidth
                  label="Backup Retention (days)"
                  type="number"
                  value={backupRetention}
                  onChange={(e) => setBackupRetention(parseInt(e.target.value) || 30)}
                  inputProps={{ min: 1, max: 365 }}
                  helperText="Number of days to keep backup files"
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ComputerIcon />}
                      onClick={() => window.location.href = '/environments'}
                    >
                      Manage PHP Environments
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={() => window.location.href = '/extensions'}
                    >
                      Configure Extensions
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={checkHealth}
                    >
                      Run System Check
                    </Button>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Application Info
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Version 2.0.0" size="small" />
                  <Chip label="React Frontend" size="small" />
                  <Chip label="Node.js Backend" size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* About Dialog */}
        <Dialog open={aboutDialog} onClose={() => setAboutDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>About PHP INI Automation Pro</DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              PHP INI Automation Pro v2.0.0
            </Typography>
            <Typography variant="body1" paragraph>
              A professional tool for managing PHP configuration files with an intuitive web interface.
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Features:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Multi-environment PHP detection" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Syntax-highlighted INI editor" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Extension management with descriptions" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Automatic backup and restore" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Configuration validation" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Professional web interface" />
              </ListItem>
            </List>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Technology Stack:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Chip label="React" size="small" />
              <Chip label="TypeScript" size="small" />
              <Chip label="Material-UI" size="small" />
              <Chip label="Monaco Editor" size="small" />
              <Chip label="Node.js" size="small" />
              <Chip label="Express.js" size="small" />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAboutDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Settings;
