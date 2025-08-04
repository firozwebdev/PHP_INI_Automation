import {
  Backup as BackupIcon,
  CheckCircle as CheckCircleIcon,
  Computer as ComputerIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  Extension as ExtensionIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../contexts/ApiContext";
import { useNotification } from "../contexts/NotificationContext";

interface DashboardStats {
  environments: {
    total: number;
    active: number;
    errors: number;
  };
  extensions: {
    total: number;
    enabled: number;
    available: number;
  };
  backups: {
    total: number;
    totalSize: number;
  };
  systemInfo: {
    platform: string;
    architecture: string;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const api = useApi();
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [healthStatus, setHealthStatus] = useState<
    "healthy" | "warning" | "error"
  >("healthy");

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load PHP environments
      const environments = await api.getPhpEnvironments();

      // Load extensions for active environment
      let extensionStats = { total: 0, enabled: 0, available: 0 };
      if (environments.activeEnvironment?.version) {
        try {
          const extensions = await api.getExtensions(
            environments.activeEnvironment.version
          );
          extensionStats = {
            total: extensions.extensions.length,
            enabled: extensions.summary.enabled,
            available: extensions.summary.available,
          };
        } catch (error) {
          console.warn("Could not load extension stats:", error);
        }
      }

      // Load backups for active environment
      let backupStats = { total: 0, totalSize: 0 };
      if (environments.activeEnvironment?.version) {
        try {
          const backups = await api.getBackups(
            environments.activeEnvironment.version
          );
          backupStats = {
            total: backups.totalCount,
            totalSize: backups.totalSize,
          };
        } catch (error) {
          console.warn("Could not load backup stats:", error);
        }
      }

      // Check health
      try {
        await api.healthCheck();
        setHealthStatus("healthy");
      } catch (error) {
        setHealthStatus("error");
      }

      setStats({
        environments: {
          total: environments.environments.length,
          active: environments.environments.filter(
            (env) => env.status === "active"
          ).length,
          errors: environments.environments.filter(
            (env) => env.status === "error"
          ).length,
        },
        extensions: extensionStats,
        backups: backupStats,
        systemInfo: environments.systemInfo,
      });

      if (environments.environments.length === 0) {
        setHealthStatus("warning");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      showError("Failed to load dashboard data");
      setHealthStatus("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [api]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getHealthStatusColor = () => {
    switch (healthStatus) {
      case "healthy":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      default:
        return "info";
    }
  };

  const getHealthStatusIcon = () => {
    switch (healthStatus) {
      case "healthy":
        return <CheckCircleIcon />;
      case "warning":
        return <WarningIcon />;
      case "error":
        return <ErrorIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Loading Dashboard...
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
          <Typography variant="h4" component="h1" gutterBottom>
            PHP INI Automation Dashboard
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip
              icon={getHealthStatusIcon()}
              label={`System ${
                healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)
              }`}
              color={getHealthStatusColor()}
              variant="outlined"
            />
            <Tooltip title="Refresh Dashboard">
              <IconButton onClick={loadDashboardData} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {healthStatus === "error" && (
          <Alert severity="error" sx={{ mb: 3 }}>
            System health check failed. Please check your PHP installations and
            server configuration.
          </Alert>
        )}

        {healthStatus === "warning" && stats?.environments.total === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            No PHP environments detected. Please configure your PHP installation
            paths in the environment variables.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* PHP Environments Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <ComputerIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">PHP Environments</Typography>
                </Box>
                <Typography variant="h3" color="primary" gutterBottom>
                  {stats?.environments.total || 0}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <Chip
                    label={`${stats?.environments.active || 0} Active`}
                    color="success"
                    size="small"
                  />
                  {(stats?.environments.errors || 0) > 0 && (
                    <Chip
                      label={`${stats?.environments.errors} Errors`}
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/environments")}
                  fullWidth
                >
                  Manage Environments
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Extensions Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <ExtensionIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Extensions</Typography>
                </Box>
                <Typography variant="h3" color="primary" gutterBottom>
                  {stats?.extensions.enabled || 0}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <Chip
                    label={`${stats?.extensions.total || 0} Total`}
                    color="info"
                    size="small"
                  />
                  <Chip
                    label={`${stats?.extensions.available || 0} Available`}
                    color="success"
                    size="small"
                  />
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/extensions")}
                  fullWidth
                >
                  Manage Extensions
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Backups Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <BackupIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Backups</Typography>
                </Box>
                <Typography variant="h3" color="primary" gutterBottom>
                  {stats?.backups.total || 0}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <Chip
                    label={formatFileSize(stats?.backups.totalSize || 0)}
                    color="info"
                    size="small"
                  />
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/backups")}
                  fullWidth
                >
                  Manage Backups
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <EditIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Quick Actions</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate("/editor")}
                    fullWidth
                  >
                    Edit INI File
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate("/extensions")}
                    fullWidth
                  >
                    Toggle Extensions
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate("/backups")}
                    fullWidth
                  >
                    Create Backup
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* System Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Platform
                    </Typography>
                    <Typography variant="body1">
                      {stats?.systemInfo.platform || "Unknown"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Architecture
                    </Typography>
                    <Typography variant="body1">
                      {stats?.systemInfo.architecture || "Unknown"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Health Status
                    </Typography>
                    <Chip
                      icon={getHealthStatusIcon()}
                      label={
                        healthStatus.charAt(0).toUpperCase() +
                        healthStatus.slice(1)
                      }
                      color={getHealthStatusColor()}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {new Date().toLocaleTimeString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard;
