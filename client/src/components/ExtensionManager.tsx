import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Extension as ExtensionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';

interface ExtensionInfo {
  name: string;
  displayName: string;
  description: string;
  category: string;
  enabled: boolean;
  available: boolean;
  required: boolean;
  dependencies?: string[];
  conflicts?: string[];
  phpVersions?: string[];
}

const ExtensionManager: React.FC = () => {
  const api = useApi();
  const { showError, showSuccess, showWarning } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [filteredExtensions, setFilteredExtensions] = useState<ExtensionInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: boolean }>({});
  const [extensionDetails, setExtensionDetails] = useState<ExtensionInfo | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const loadEnvironments = async () => {
    try {
      const data = await api.getPhpEnvironments();
      setEnvironments(data.environments.filter(env => env.status === 'active'));
      
      if (data.activeEnvironment?.version) {
        setSelectedVersion(data.activeEnvironment.version);
      } else if (data.environments.length > 0) {
        setSelectedVersion(data.environments[0].version || '');
      }
    } catch (error) {
      console.error('Error loading environments:', error);
      showError('Failed to load PHP environments');
    }
  };

  const loadExtensions = async (version: string) => {
    if (!version) return;
    
    setLoading(true);
    try {
      const data = await api.getExtensions(version);
      setExtensions(data.extensions);
      setSummary(data.summary);
      setPendingChanges({});
      showSuccess(`Loaded ${data.extensions.length} extensions`);
    } catch (error) {
      console.error('Error loading extensions:', error);
      showError('Failed to load extensions');
    } finally {
      setLoading(false);
    }
  };

  const filterExtensions = () => {
    let filtered = extensions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ext =>
        ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ext.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ext.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(ext => ext.category === selectedCategory);
    }

    // Status filters
    if (showOnlyEnabled) {
      filtered = filtered.filter(ext => ext.enabled || pendingChanges[ext.name] === true);
    }

    if (showOnlyAvailable) {
      filtered = filtered.filter(ext => ext.available);
    }

    setFilteredExtensions(filtered);
  };

  const handleToggleExtension = (extensionName: string, enabled: boolean) => {
    const currentState = extensions.find(ext => ext.name === extensionName)?.enabled || false;
    const newState = enabled;
    
    if (newState !== currentState) {
      setPendingChanges(prev => ({
        ...prev,
        [extensionName]: newState,
      }));
    } else {
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[extensionName];
        return updated;
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedVersion || Object.keys(pendingChanges).length === 0) return;
    
    setSaving(true);
    try {
      const changes = Object.entries(pendingChanges).map(([name, enable]) => ({
        name,
        enable,
      }));
      
      await api.bulkToggleExtensions(selectedVersion, changes);
      
      // Reload extensions to get updated state
      await loadExtensions(selectedVersion);
      
      showSuccess(`Successfully updated ${changes.length} extension(s)`);
    } catch (error) {
      console.error('Error saving changes:', error);
      showError('Failed to save extension changes');
    } finally {
      setSaving(false);
    }
  };

  const handleShowDetails = async (extension: ExtensionInfo) => {
    try {
      const details = await api.getExtensionInfo(extension.name);
      setExtensionDetails(details);
    } catch (error) {
      setExtensionDetails(extension);
    }
  };

  const getCategories = () => {
    const categories = ['All', ...new Set(extensions.map(ext => ext.category))];
    return categories.sort();
  };

  const getExtensionState = (extension: ExtensionInfo) => {
    if (pendingChanges.hasOwnProperty(extension.name)) {
      return pendingChanges[extension.name];
    }
    return extension.enabled;
  };

  const hasPendingChanges = () => {
    return Object.keys(pendingChanges).length > 0;
  };

  useEffect(() => {
    loadEnvironments();
  }, [api]);

  useEffect(() => {
    if (selectedVersion) {
      loadExtensions(selectedVersion);
    }
  }, [selectedVersion]);

  useEffect(() => {
    filterExtensions();
  }, [extensions, searchTerm, selectedCategory, showOnlyEnabled, showOnlyAvailable, pendingChanges]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Loading Extensions...
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
            Extension Manager
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveChanges}
              disabled={!hasPendingChanges() || saving}
            >
              {saving ? 'Saving...' : `Save Changes (${Object.keys(pendingChanges).length})`}
            </Button>
            <Tooltip title="Refresh Extensions">
              <IconButton onClick={() => loadExtensions(selectedVersion)} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>PHP Environment</InputLabel>
                  <Select
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    label="PHP Environment"
                  >
                    {environments.map((env) => (
                      <MenuItem key={env.version} value={env.version}>
                        {env.name} - PHP {env.version}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search extensions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                  >
                    {getCategories().map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showOnlyEnabled}
                        onChange={(e) => setShowOnlyEnabled(e.target.checked)}
                      />
                    }
                    label="Show only enabled"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showOnlyAvailable}
                        onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                      />
                    }
                    label="Show only available"
                  />
                </Box>
              </Grid>
            </Grid>

            {/* Summary */}
            {summary && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`Total: ${summary.total}`} color="info" size="small" />
                <Chip label={`Enabled: ${summary.enabled}`} color="success" size="small" />
                <Chip label={`Available: ${summary.available}`} color="primary" size="small" />
                {hasPendingChanges() && (
                  <Chip
                    label={`Pending Changes: ${Object.keys(pendingChanges).length}`}
                    color="warning"
                    size="small"
                  />
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Extensions List */}
        {filteredExtensions.length === 0 ? (
          <Alert severity="info">
            No extensions found matching your criteria.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {filteredExtensions.map((extension) => {
              const isEnabled = getExtensionState(extension);
              const hasPendingChange = pendingChanges.hasOwnProperty(extension.name);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={extension.name}>
                  <Card
                    sx={{
                      height: '100%',
                      border: hasPendingChange ? 2 : 0,
                      borderColor: 'warning.main',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ExtensionIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                          {extension.displayName}
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isEnabled}
                              onChange={(e) => handleToggleExtension(extension.name, e.target.checked)}
                              disabled={extension.required}
                            />
                          }
                          label=""
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={extension.category}
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {isEnabled ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Enabled"
                            color="success"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        ) : (
                          <Chip
                            icon={<CancelIcon />}
                            label="Disabled"
                            color="default"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {extension.required && (
                          <Chip
                            label="Required"
                            color="error"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {!extension.available && (
                          <Chip
                            label="Not Available"
                            color="warning"
                            size="small"
                          />
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {extension.description}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {extension.name}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<InfoIcon />}
                          onClick={() => handleShowDetails(extension)}
                        >
                          Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Extension Details Dialog */}
        <Dialog
          open={!!extensionDetails}
          onClose={() => setExtensionDetails(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Extension Details: {extensionDetails?.displayName}
          </DialogTitle>
          <DialogContent>
            {extensionDetails && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {extensionDetails.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1">
                    {extensionDetails.category}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {extensionDetails.description}
                  </Typography>
                </Grid>
                {extensionDetails.dependencies && extensionDetails.dependencies.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Dependencies
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {extensionDetails.dependencies.map((dep) => (
                        <Chip key={dep} label={dep} size="small" />
                      ))}
                    </Box>
                  </Grid>
                )}
                {extensionDetails.conflicts && extensionDetails.conflicts.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Conflicts
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {extensionDetails.conflicts.map((conflict) => (
                        <Chip key={conflict} label={conflict} size="small" color="error" />
                      ))}
                    </Box>
                  </Grid>
                )}
                {extensionDetails.phpVersions && extensionDetails.phpVersions.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      PHP Version Support
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {extensionDetails.phpVersions.map((version) => (
                        <Chip key={version} label={version} size="small" color="info" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExtensionDetails(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ExtensionManager;
