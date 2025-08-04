import {
  Backup as BackupIcon,
  CleaningServices as CleanupIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Restore as RestoreIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useApi } from "../contexts/ApiContext";
import { useNotification } from "../contexts/NotificationContext";

interface BackupInfo {
  filename: string;
  fullPath: string;
  timestamp: Date;
  size: number;
  description?: string;
  version?: string;
}

const BackupManager: React.FC = () => {
  const api = useApi();
  const { showError, showSuccess, showWarning } = useNotification();
  const [loading, setLoading] = useState(true);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [createDialog, setCreateDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState<BackupInfo | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<BackupInfo | null>(null);
  const [viewDialog, setViewDialog] = useState<BackupInfo | null>(null);
  const [cleanupDialog, setCleanupDialog] = useState(false);
  const [backupDescription, setBackupDescription] = useState("");
  const [backupContent, setBackupContent] = useState("");
  const [keepCount, setKeepCount] = useState(10);
  const [olderThanDays, setOlderThanDays] = useState(30);

  const loadEnvironments = async () => {
    try {
      const data = await api.getPhpEnvironments();
      setEnvironments(
        data.environments.filter((env) => env.status === "active")
      );

      if (data.activeEnvironment?.version) {
        setSelectedVersion(data.activeEnvironment.version);
      } else if (data.environments.length > 0) {
        setSelectedVersion(data.environments[0].version || "");
      }
    } catch (error) {
      console.error("Error loading environments:", error);
      showError("Failed to load PHP environments");
    }
  };

  const loadBackups = async (version: string) => {
    if (!version) return;

    setLoading(true);
    try {
      const data = await api.getBackups(version);
      setBackups(
        data.backups.map((backup) => ({
          ...backup,
          timestamp: new Date(backup.timestamp),
        }))
      );
      setTotalSize(data.totalSize);
      showSuccess(`Loaded ${data.backups.length} backup(s)`);
    } catch (error) {
      console.error("Error loading backups:", error);
      showError("Failed to load backups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!selectedVersion) return;

    try {
      await api.createBackup(selectedVersion, backupDescription || undefined);
      setCreateDialog(false);
      setBackupDescription("");
      await loadBackups(selectedVersion);
      showSuccess("Backup created successfully");
    } catch (error) {
      console.error("Error creating backup:", error);
      showError("Failed to create backup");
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreDialog || !selectedVersion) return;

    try {
      await api.restoreBackup(selectedVersion, restoreDialog.fullPath, true);
      setRestoreDialog(null);
      showSuccess("Backup restored successfully");
    } catch (error) {
      console.error("Error restoring backup:", error);
      showError("Failed to restore backup");
    }
  };

  const handleDeleteBackup = async () => {
    if (!deleteDialog || !selectedVersion) return;

    try {
      await api.deleteBackup(selectedVersion, deleteDialog.fullPath);
      setDeleteDialog(null);
      await loadBackups(selectedVersion);
      showSuccess("Backup deleted successfully");
    } catch (error) {
      console.error("Error deleting backup:", error);
      showError("Failed to delete backup");
    }
  };

  const handleViewBackup = async (backup: BackupInfo) => {
    try {
      const data = await api.getBackupContent(selectedVersion, backup.fullPath);
      setBackupContent(data.content);
      setViewDialog(backup);
    } catch (error) {
      console.error("Error loading backup content:", error);
      showError("Failed to load backup content");
    }
  };

  const handleCleanupBackups = async () => {
    if (!selectedVersion) return;

    try {
      const result = await api.cleanupBackups(
        selectedVersion,
        keepCount,
        olderThanDays
      );
      setCleanupDialog(false);
      await loadBackups(selectedVersion);
      showSuccess(
        `Cleanup completed. Deleted ${result.deletedFiles.length} backup(s)`
      );
    } catch (error) {
      console.error("Error cleaning up backups:", error);
      showError("Failed to cleanup backups");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };

  useEffect(() => {
    loadEnvironments();
  }, [api]);

  useEffect(() => {
    if (selectedVersion) {
      loadBackups(selectedVersion);
    }
  }, [selectedVersion]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Loading Backups...
          </Typography>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1">
            Backup Manager
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={() => setCreateDialog(true)}
              disabled={!selectedVersion}
            >
              Create Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<CleanupIcon />}
              onClick={() => setCleanupDialog(true)}
              disabled={!selectedVersion || backups.length === 0}
            >
              Cleanup
            </Button>
            <Tooltip title="Refresh Backups">
              <IconButton
                onClick={() => loadBackups(selectedVersion)}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Controls */}
        <Card sx={{ mb: 3 }}>
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

              <Grid item xs={12} sm={6} md={8}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Chip
                    label={`${backups.length} Backup(s)`}
                    color="info"
                    size="small"
                  />
                  <Chip
                    label={`Total Size: ${formatFileSize(totalSize)}`}
                    color="primary"
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Backups Table */}
        {backups.length === 0 ? (
          <Alert severity="info">
            No backups found for the selected PHP environment.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Filename</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.fullPath}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {backup.filename}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(backup.timestamp)}</TableCell>
                    <TableCell>{formatFileSize(backup.size)}</TableCell>
                    <TableCell>{backup.description || "-"}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="View Content">
                          <IconButton
                            size="small"
                            onClick={() => handleViewBackup(backup)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Restore Backup">
                          <IconButton
                            size="small"
                            onClick={() => setRestoreDialog(backup)}
                            color="primary"
                          >
                            <RestoreIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Backup">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog(backup)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create Backup Dialog */}
        <Dialog
          open={createDialog}
          onClose={() => setCreateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Backup</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Description (Optional)"
              fullWidth
              variant="outlined"
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              placeholder="e.g., Before enabling new extensions"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateBackup} variant="contained">
              Create Backup
            </Button>
          </DialogActions>
        </Dialog>

        {/* Restore Backup Dialog */}
        <Dialog
          open={!!restoreDialog}
          onClose={() => setRestoreDialog(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Restore Backup</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Are you sure you want to restore the following backup?
            </Typography>
            {restoreDialog && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  File: {restoreDialog.filename}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(restoreDialog.timestamp)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {formatFileSize(restoreDialog.size)}
                </Typography>
              </Box>
            )}
            <Alert severity="warning" sx={{ mt: 2 }}>
              This will overwrite your current INI file. A backup of the current
              file will be created automatically.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRestoreDialog(null)}>Cancel</Button>
            <Button
              onClick={handleRestoreBackup}
              variant="contained"
              color="warning"
            >
              Restore
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Backup Dialog */}
        <Dialog
          open={!!deleteDialog}
          onClose={() => setDeleteDialog(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Backup</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Are you sure you want to delete this backup? This action cannot be
              undone.
            </Typography>
            {deleteDialog && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  File: {deleteDialog.filename}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(deleteDialog.timestamp)}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button
              onClick={handleDeleteBackup}
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Backup Dialog */}
        <Dialog
          open={!!viewDialog}
          onClose={() => setViewDialog(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Backup Content: {viewDialog?.filename}</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                height: "60vh",
                border: "1px solid #e0e0e0",
                p: 1,
                overflow: "auto",
              }}
            >
              <pre
                style={{ margin: 0, fontSize: "12px", fontFamily: "monospace" }}
              >
                {backupContent}
              </pre>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Cleanup Dialog */}
        <Dialog
          open={cleanupDialog}
          onClose={() => setCleanupDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cleanup Old Backups</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Configure cleanup settings to remove old backup files.
            </Typography>
            <TextField
              margin="dense"
              label="Keep at least"
              type="number"
              fullWidth
              variant="outlined"
              value={keepCount}
              onChange={(e) => setKeepCount(parseInt(e.target.value) || 10)}
              inputProps={{ min: 1, max: 100 }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Delete files older than (days)"
              type="number"
              fullWidth
              variant="outlined"
              value={olderThanDays}
              onChange={(e) => setOlderThanDays(parseInt(e.target.value) || 30)}
              inputProps={{ min: 1, max: 365 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCleanupDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCleanupBackups}
              variant="contained"
              color="warning"
            >
              Cleanup
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default BackupManager;
