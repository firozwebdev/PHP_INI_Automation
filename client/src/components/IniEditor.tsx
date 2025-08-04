import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  Visibility as PreviewIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const IniEditor: React.FC = () => {
  const api = useApi();
  const { showError, showSuccess, showWarning } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [iniContent, setIniContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [iniPath, setIniPath] = useState('');
  const [lastModified, setLastModified] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [backupDialog, setBackupDialog] = useState(false);

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

  const loadIniContent = async (version: string) => {
    if (!version) return;
    
    setLoading(true);
    try {
      const data = await api.getRawIniContent(version);
      setIniContent(data.content);
      setOriginalContent(data.content);
      setIniPath(data.iniPath);
      setLastModified(new Date(data.lastModified));
      setHasChanges(false);
      showSuccess('INI file loaded successfully');
    } catch (error) {
      console.error('Error loading INI content:', error);
      showError('Failed to load INI file content');
    } finally {
      setLoading(false);
    }
  };

  const validateContent = async (content: string) => {
    try {
      const result = await api.validateIniContent(content);
      setValidation(result);
      
      if (!result.isValid) {
        showWarning(`INI validation found ${result.errors.length} error(s)`);
      }
    } catch (error) {
      console.error('Error validating content:', error);
    }
  };

  const handleContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      setIniContent(value);
      setHasChanges(value !== originalContent);
      
      // Debounced validation
      const timeoutId = setTimeout(() => {
        validateContent(value);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSave = async () => {
    if (!selectedVersion || !hasChanges) return;
    
    setSaving(true);
    try {
      await api.updateIniContent(selectedVersion, iniContent);
      setOriginalContent(iniContent);
      setHasChanges(false);
      showSuccess('INI file saved successfully');
      
      // Reload to get updated timestamp
      await loadIniContent(selectedVersion);
    } catch (error) {
      console.error('Error saving INI content:', error);
      showError('Failed to save INI file');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!selectedVersion) return;
    
    try {
      await api.createBackup(selectedVersion, 'Manual backup before editing');
      showSuccess('Backup created successfully');
      setBackupDialog(false);
    } catch (error) {
      console.error('Error creating backup:', error);
      showError('Failed to create backup');
    }
  };

  const handleRefresh = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to refresh?')) {
        loadIniContent(selectedVersion);
      }
    } else {
      loadIniContent(selectedVersion);
    }
  };

  useEffect(() => {
    loadEnvironments();
  }, [api]);

  useEffect(() => {
    if (selectedVersion) {
      loadIniContent(selectedVersion);
    }
  }, [selectedVersion]);

  const getValidationIcon = () => {
    if (!validation) return null;
    
    if (validation.isValid) {
      return <ValidIcon color="success" />;
    } else if (validation.errors.length > 0) {
      return <ErrorIcon color="error" />;
    } else {
      return <WarningIcon color="warning" />;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            PHP INI Editor
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<BackupIcon />}
              onClick={() => setBackupDialog(true)}
              disabled={!selectedVersion}
            >
              Create Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setPreviewDialog(true)}
              disabled={!iniContent}
            >
              Preview
            </Button>
            <Tooltip title="Refresh Content">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Controls */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={4}>
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
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getValidationIcon()}
                      <Typography variant="body2" color="text.secondary">
                        {validation?.isValid ? 'Valid INI syntax' : 
                         validation?.errors.length ? `${validation.errors.length} error(s)` :
                         validation?.warnings.length ? `${validation.warnings.length} warning(s)` :
                         'Not validated'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={12} md={4}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {hasChanges && (
                        <Chip
                          label="Unsaved Changes"
                          color="warning"
                          size="small"
                        />
                      )}
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={!hasChanges || saving || !selectedVersion}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>

                {iniPath && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      File: {iniPath}
                    </Typography>
                    {lastModified && (
                      <Typography variant="body2" color="text.secondary">
                        Last modified: {lastModified.toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Validation Messages */}
          {validation && !validation.isValid && (
            <Grid item xs={12}>
              {validation.errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Syntax Errors:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              
              {validation.warnings.length > 0 && (
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>
                    Warnings:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </Grid>
          )}

          {/* Editor */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 0 }}>
                {loading ? (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Loading INI file...
                    </Typography>
                    <LinearProgress />
                  </Box>
                ) : (
                  <Box sx={{ height: '70vh', border: '1px solid #e0e0e0' }}>
                    <Editor
                      height="100%"
                      defaultLanguage="ini"
                      value={iniContent}
                      onChange={handleContentChange}
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        renderWhitespace: 'selection',
                        folding: true,
                        bracketMatching: 'always',
                      }}
                      theme="vs"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Preview Dialog */}
        <Dialog
          open={previewDialog}
          onClose={() => setPreviewDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>INI File Preview</DialogTitle>
          <DialogContent>
            <Box sx={{ height: '60vh', border: '1px solid #e0e0e0' }}>
              <Editor
                height="100%"
                defaultLanguage="ini"
                value={iniContent}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
                theme="vs"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Backup Dialog */}
        <Dialog
          open={backupDialog}
          onClose={() => setBackupDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create Backup</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Create a backup of the current INI file before making changes?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will create a timestamped backup that you can restore later if needed.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBackupDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateBackup} variant="contained">
              Create Backup
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default IniEditor;
