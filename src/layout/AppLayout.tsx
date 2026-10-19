import { AppBar, Box, Drawer, List, ListItemButton, ListItemText, Toolbar, Typography } from '@mui/material'
import { NavLink, Outlet } from 'react-router-dom'

const drawerWidth = 240

const navItems = [
  { label: 'Policyholders', to: '/policyholders' },
  { label: 'Policies', to: '/policies' },
]

export function AppLayout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            Insurance
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
      >
        <Toolbar />
        <List>
          {navItems.map((item) => (
            <ListItemButton key={item.to} component={NavLink} to={item.to}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
