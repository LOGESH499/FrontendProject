import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { supabase } from "../services/supabaseClient";

export default function SingleUserForm() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    personal_email: "",
    manager_email: "",
    role: "",
    department: "",
  });

  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 🔥 Load Roles Dynamically
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from("role_license_mapping")
      .select("role_name");

    if (!error && data) {
      setRoles(data);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    let newErrors = {};

    Object.keys(form).forEach((key) => {
      if (!form[key]) newErrors[key] = "Required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateEmployeeId = async () => {
    const { data } = await supabase
      .from("employees")
      .select("employee_id")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return "EMP001";

    const last = data[0].employee_id;
    const num = parseInt(last.replace("EMP", ""));
    return `EMP${(num + 1).toString().padStart(3, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const newEmpId = await generateEmployeeId();

      // ✅ Insert into employees (Correct column: job_role)
      const { error: empError } = await supabase
        .from("employees")
        .insert([
          {
            employee_id: newEmpId,
            first_name: form.first_name,
            last_name: form.last_name,
            personal_email: form.personal_email,
            manager_email: form.manager_email,
            job_role: form.role, // ✅ Correct Column
            department: form.department,
            status: "pending",
          },
        ]);

      if (empError) {
        alert(empError.message);
        setLoading(false);
        return;
      }

      // ✅ Insert into provisioning_requests
      await supabase.from("provisioning_requests").insert([
        {
          employee_id: newEmpId,
          request_type: "onboarding",
          target_role: form.role,
          status: "pending",
          requested_by: "hr.admin@company.com",
        },
      ]);

      setSuccess(true);

      setForm({
        first_name: "",
        last_name: "",
        personal_email: "",
        manager_email: "",
        role: "",
        department: "",
      });
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h5" mb={3} fontWeight={600}>
          Employee Onboarding
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <TextField
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            error={!!errors.first_name}
            helperText={errors.first_name}
          />

          <TextField
            label="Last Name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            error={!!errors.last_name}
            helperText={errors.last_name}
          />

          <TextField
            label="Personal Email"
            name="personal_email"
            value={form.personal_email}
            onChange={handleChange}
            error={!!errors.personal_email}
            helperText={errors.personal_email}
          />

          <TextField
            label="Manager Email"
            name="manager_email"
            value={form.manager_email}
            onChange={handleChange}
            error={!!errors.manager_email}
            helperText={errors.manager_email}
          />

          {/* 🔥 Dynamic Role Dropdown */}
          <TextField
            select
            label="Job Role"
            name="role"
            value={form.role}
            onChange={handleChange}
            error={!!errors.role}
            helperText={errors.role}
          >
            {roles.map((r) => (
              <MenuItem key={r.role_name} value={r.role_name}>
                {r.role_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Department"
            name="department"
            value={form.department}
            onChange={handleChange}
            error={!!errors.department}
            helperText={errors.department}
          >
            <MenuItem value="IT">IT</MenuItem>
            <MenuItem value="HR">HR</MenuItem>
            <MenuItem value="Finance">Finance</MenuItem>
            <MenuItem value="Operations">Operations</MenuItem>
            <MenuItem value="Engineering">Engineering</MenuItem>
            <MenuItem value="Leadership">Leadership</MenuItem>
          </TextField>

          <Button type="submit" variant="contained" size="large">
            {loading ? <CircularProgress size={20} /> : "Create Employee"}
          </Button>
        </Box>
      </CardContent>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" variant="filled">
          Employee Created Successfully
        </Alert>
      </Snackbar>
    </Card>
  );
}