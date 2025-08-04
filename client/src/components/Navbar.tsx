import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Computer as ComputerIcon,
  Edit as EditIcon,
  Extension as ExtensionIcon,
  Backup as BackupIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/environments', label: 'Environments', icon: <ComputerIcon /> },
    { path: '/editor', label: 'INI Editor', icon: <EditIcon /> },
    { path: '/extensions', label: 'Extensions', icon: <ExtensionIcon /> },
    { path: '/backups', label: 'Backups', icon: <BackupIcon /> },
  ];

  const moreItems = [
    { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <CodeIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            PHP INI Automation Pro
          </Typography>
          <Chip
            label="v2.0"
            size="small"
            color="secondary"
            sx={{ ml: 2, fontWeight: 500 }}
          />
        </Box>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          {navigationItems.map((item) => (
            <Tooltip key={item.path} title={item.label}>
              <Button
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                  borderRadius: 2,
                  px: 2,
                }}
              >
                {item.label}
              </Button>
            </Tooltip>
          ))}

          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{
              ml: 1,
              backgroundColor: anchorEl ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Mobile Navigation */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
            },
          }}
        >
          {/* Mobile: Show all navigation items */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {navigationItems.map((item) => (
              <MenuItem
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  handleMenuClose();
                }}
                selected={isActive(item.path)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {item.icon}
                  {item.label}
                </Box>
              </MenuItem>
            ))}
            <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 1, pt: 1 }}>
              {moreItems.map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    handleMenuClose();
                  }}
                  selected={isActive(item.path)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {item.icon}
                    {item.label}
                  </Box>
                </MenuItem>
              ))}
            </Box>
          </Box>

          {/* Desktop: Show only more items */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {moreItems.map((item) => (
              <MenuItem
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  handleMenuClose();
                }}
                selected={isActive(item.path)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {item.icon}
                  {item.label}
                </Box>
              </MenuItem>
            ))}
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
