import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box,
} from "@mui/material";

import SingleUserForm from "../components/SingleUserForm";
import BulkUpload from "../components/BulkUpload";
import StatusTable from "../components/StatusTable";
import ChatPanel from "../components/ChatPanel";

const drawerWidth = 240;

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderContent = () => {
    switch (activePage) {
      case "onboarding":
        return <SingleUserForm />;
      case "bulk":
        return <BulkUpload />;
      case "status":
        return <StatusTable />;
      case "chat":
        return <ChatPanel />;
      default:
        return (
          <>
            <SingleUserForm />
            <Box sx={{ mt: 4 }}>
              <BulkUpload />
            </Box>
            <Box sx={{ mt: 4 }}>
              <StatusTable />
            </Box>
          </>
        );
    }
  };

  return (
    <Box sx={{ display: "flex", background: "#f4f6f8" }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          background: "linear-gradient(90deg,#1e40af,#2563eb)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          zIndex: 1201,
        }}
      >
        <Toolbar>
          <Typography variant="h6">
            Enterprise User Provisioning System
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            background: "#ffffff",
            borderRight: "1px solid #e5e7eb",
          },
        }}
      >
        <Toolbar />
        <List>
          {[
            { label: "Dashboard", value: "dashboard" },
            { label: "Onboarding", value: "onboarding" },
            { label: "Bulk Upload", value: "bulk" },
            { label: "Status", value: "status" },
            { label: "AI Chat", value: "chat" },
          ].map((item) => (
            <ListItemButton
              key={item.value}
              selected={activePage === item.value}
              onClick={() => setActivePage(item.value)}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 2,
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          width: `calc(100% - ${drawerWidth}px)`,
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        {renderContent()}
      </Box>
    </Box>
  );
}