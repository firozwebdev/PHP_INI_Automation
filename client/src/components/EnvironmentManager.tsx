import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';

interface PhpEnvironment {
  name: string;
  path: string;
  version?: string;
  iniPath?: string;
  extensionDir?: string;
  status: 'active' | 'inactive' | 'error';
  isDefault?: boolean;
}

const EnvironmentManager: React.FC = () => {
  const api = useApi();
  const { showError, showSuccess, showInfo } = useNotification();
  const [loading, setLoading] = useState(true);
  const [environments, setEnvironments] = useState<PhpEnvironment[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<PhpEnvironment | null>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [detailsDialog, setDetailsDialog] = useState<PhpEnvironment | null>(null);
  const [validateDialog, setValidateDialog] = useState(false);
  const [validatePath, setValidatePath] = useState('');
  const [validateVersion, setValidateVersion] = useState('');

  const loadEnvironments = async () => {
    setLoading(true);
    try {
      const data = await api.getPhpEnvironments();
      setEnvironments(data.environments);
      setActiveEnvironment(data.activeEnvironment || null);
      setSystemInfo(data.systemInfo);
      
      if (data.environments.length === 0) {
        showInfo('No PHP environments detected. Please check your installation paths.');
      } else {
        showSuccess(`Found ${data.environments.length} PHP environment(s)`);
      }
    } catch (error) {
      console.error('Error loading environments:', error);
      showError('Failed to load PHP environments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnvironments();
  }, [api]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'warning';
    }
  };

  const handleShowDetails = async (env: PhpEnvironment) => {
    if (env.version) {
      try {
        const details = await api.getPhpVersionInfo(env.version);
        setDetailsDialog({ ...env, ...details });
      } catch (error) {
        setDetailsDialog(env);
      }
    } else {
      setDetailsDialog(env);
    }
  };

  const handleValidateCustomPath = async () => {
    if (!validatePath.trim()) {
      showError('Please enter a PHP path to validate');
      return;
    }

    try {
      const result = await api.validatePhpInstallation(validatePath, validateVersion);
      if (result.isValid) {
        showSuccess(`Valid PHP installation found! Version: ${result.detectedVersion || 'Unknown'}`);
      } else {
        showError('Invalid PHP installation or path not found');
      }
      setValidateDialog(false);
      setValidatePath('');
      setValidateVersion('');
    } catch (error) {
      showError('Failed to validate PHP installation');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Loading PHP Environments...
          </Typography>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            PHP Environment Manager
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setValidateDialog(true)}
              startIcon={<SettingsIcon />}
            >
              Validate Custom Path
            </Button>
            <Tooltip title="Refresh Environments">
              <IconButton onClick={loadEnvironments} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {environments.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              No PHP Environments Detected
            </Typography>
            <Typography variant="body2" paragraph>
              Please ensure PHP is installed and configure the environment variables in your .env file:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>PVM_PATH - For PVM installations</li>
              <li>LARAGON_PATH - For Laragon installations</li>
              <li>XAMPP_PATH - For XAMPP installations</li>
              <li>WAMP_PATH - For WAMP installations</li>
              <li>DEFAULT_PATH - For custom PHP installations</li>
            </Box>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {environments.map((env, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    border: activeEnvironment?.name === env.name ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ComputerIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {env.name}
                      </Typography>
                      {getStatusIcon(env.status)}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={env.status.charAt(0).toUpperCase() + env.status.slice(1)}
                        color={getStatusColor(env.status) as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {activeEnvironment?.name === env.name && (
                        <Chip
                          label="Active"
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      )}
                      {env.version && (
                        <Chip
                          label={`PHP ${env.version}`}
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Installation Path:
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {env.path}
                      </Typography>
                    </Box>

                    {env.iniPath && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          INI File:
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {env.iniPath}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<InfoIcon />}
                        onClick={() => handleShowDetails(env)}
                        fullWidth
                      >
                        Details
                      </Button>
                      {env.iniPath && (
                        <Tooltip title="Open INI file location">
                          <IconButton
                            size="small"
                            onClick={() => {
                              // In a real app, this would open the file explorer
                              showInfo(`INI file location: ${env.iniPath}`);
                            }}
                          >
                            <FolderIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* System Information */}
        {systemInfo && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Platform
                  </Typography>
                  <Typography variant="body1">
                    {systemInfo.platform}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Architecture
                  </Typography>
                  <Typography variant="body1">
                    {systemInfo.architecture}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Environment Details Dialog */}
        <Dialog
          open={!!detailsDialog}
          onClose={() => setDetailsDialog(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Environment Details: {detailsDialog?.name}
          </DialogTitle>
          <DialogContent>
            {detailsDialog && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(detailsDialog.status)}
                    <Typography variant="body1">
                      {detailsDialog.status.charAt(0).toUpperCase() + detailsDialog.status.slice(1)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="body1">
                    {detailsDialog.version || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Installation Path
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {detailsDialog.path}
                  </Typography>
                </Grid>
                {detailsDialog.iniPath && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      INI File Path
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                      {detailsDialog.iniPath}
                    </Typography>
                  </Grid>
                )}
                {detailsDialog.extensionDir && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Extension Directory
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                      {detailsDialog.extensionDir}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialog(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Validate Custom Path Dialog */}
        <Dialog
          open={validateDialog}
          onClose={() => setValidateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Validate Custom PHP Installation</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="PHP Executable Path"
              fullWidth
              variant="outlined"
              value={validatePath}
              onChange={(e) => setValidatePath(e.target.value)}
              placeholder="e.g., C:\php\php.exe or /usr/bin/php"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="PHP Version (Optional)"
              fullWidth
              variant="outlined"
              value={validateVersion}
              onChange={(e) => setValidateVersion(e.target.value)}
              placeholder="e.g., 8.2"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setValidateDialog(false)}>Cancel</Button>
            <Button onClick={handleValidateCustomPath} variant="contained">
              Validate
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default EnvironmentManager;
