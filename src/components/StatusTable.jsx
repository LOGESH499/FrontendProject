import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Button,
  MenuItem,
  TextField,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid } from "@mui/x-data-grid";
import { supabase } from "../services/supabaseClient";

export default function StatusTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);

    let query = supabase
      .from("provisioning_requests")
      .select(`
        id,
        employee_id,
        target_role,
        status,
        created_at,
        employees (
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch error:", error);
      setLoading(false);
      return;
    }

    const formatted = data.map((item) => ({
      id: item.id,
      employee_id: item.employee_id,
      name: item.employees
        ? `${item.employees.first_name} ${item.employees.last_name}`
        : "N/A",
      target_role: item.target_role,
      status: item.status,
      created_at: new Date(item.created_at).toLocaleDateString(),
    }));

    setRows(formatted);
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "success";
      case "failed":
        return "error";
      case "processing":
        return "warning";
      case "pending":
        return "info";
      default:
        return "default";
    }
  };

  const columns = [
    { field: "employee_id", headerName: "Employee ID", flex: 1 },
    { field: "name", headerName: "Employee Name", flex: 1.5 },
    { field: "target_role", headerName: "Role", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: "created_at",
      headerName: "Created Date",
      flex: 1,
    },
  ];

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 6px 25px rgba(0,0,0,0.06)",
      }}
    >
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5" fontWeight={600}>
            Provisioning Status
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              select
              size="small"
              label="Filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ width: 160 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Table */}
        <Box sx={{ height: 520 }}>
          {loading ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ textAlign: "center", mt: 5, color: "#6b7280" }}>
              No provisioning records found.
            </Box>
          ) : (
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5, page: 0 } },
              }}
              disableRowSelectionOnClick
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f8fafc",
                  fontWeight: 600,
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f1f5f9",
                },
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}