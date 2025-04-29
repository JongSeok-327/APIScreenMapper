import { AppBar, Box, Container, Toolbar, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ 
              color: 'white', 
              textDecoration: 'none',
              flexGrow: 1 
            }}
          >
            API Screen Mapper
          </Typography>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem 
          onClick={() => {
            navigate('/');
            handleMenuClose();
          }}
          sx={{ 
            py: 1.5,
            display: 'flex', 
            alignItems: 'center', 
            gap: 2 
          }}
        >
          <HomeIcon fontSize="small" />
          홈으로
        </MenuItem>
      </Menu>

      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>
    </Box>
  );
} 