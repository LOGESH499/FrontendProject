import React, { useRef, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import Papa from "papaparse";
import { supabase } from "../services/supabaseClient";

export default function BulkUpload() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // ===============================
  // File Select
  // ===============================
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile?.name.toLowerCase().endsWith(".csv")) {
      setErrorMsg("Please upload a valid CSV file.");
      return;
    }

    setFile(selectedFile);
    setErrorMsg("");
  };

  // ===============================
  // Drag Events
  // ===============================
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];

    if (!droppedFile?.name.toLowerCase().endsWith(".csv")) {
      setErrorMsg("Please upload a valid CSV file.");
      return;
    }

    setFile(droppedFile);
    setErrorMsg("");
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;

          if (!rows.length) {
            setErrorMsg("CSV file is empty.");
            setLoading(false);
            return;
          }

          // Required Columns Validation
          const requiredColumns = [
            "first_name",
            "last_name",
            "personal_email",
            "manager_email",
            "job_role",
            "department",
          ];

          const fileColumns = Object.keys(rows[0]);

          const missingColumns = requiredColumns.filter(
            (col) => !fileColumns.includes(col)
          );

          if (missingColumns.length > 0) {
            setErrorMsg(
              `Missing required columns: ${missingColumns.join(", ")}`
            );
            setLoading(false);
            return;
          }

          // Get last employee number
          const { data: lastEmp } = await supabase
            .from("employees")
            .select("employee_id")
            .order("created_at", { ascending: false })
            .limit(1);

          let nextNumber = 1;

          if (lastEmp?.length) {
            nextNumber =
              parseInt(lastEmp[0].employee_id.replace("EMP", "")) + 1;
          }

          let successCount = 0;

          for (const row of rows) {
            if (!row.personal_email) continue;

            const empId = `EMP${nextNumber
              .toString()
              .padStart(3, "0")}`;

            nextNumber++;

            // Check duplicate email
            const { data: existing } = await supabase
              .from("employees")
              .select("id")
              .eq("personal_email", row.personal_email);

            if (existing.length > 0) continue;

            // Insert employee
            const { error: empError } = await supabase
              .from("employees")
              .insert([
                {
                  employee_id: empId,
                  first_name: row.first_name,
                  last_name: row.last_name,
                  personal_email: row.personal_email,
                  manager_email: row.manager_email,
                  job_role: row.job_role,
                  department: row.department,
                  status: "pending",
                },
              ]);

            if (empError) {
              console.error(empError);
              continue;
            }

            // Insert provisioning request
            await supabase.from("provisioning_requests").insert([
              {
                employee_id: empId,
                request_type: "onboarding",
                target_role: row.job_role,
                status: "pending",
                requested_by: "bulk_upload@company.com",
              },
            ]);

            successCount++;
          }

          if (successCount === 0) {
            setErrorMsg("No new records inserted (maybe duplicates).");
          } else {
            setSuccess(true);
            setFile(null);
          }
        } catch (err) {
          console.error(err);
          setErrorMsg("Upload failed. Please check data format.");
        }

        setLoading(false);
      },
    });
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" mb={3} fontWeight={600}>
          Drag & Drop CSV Upload
        </Typography>

        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        <Box
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          sx={{
            border: "2px dashed #2563eb",
            borderRadius: 3,
            p: 6,
            textAlign: "center",
            cursor: "pointer",
            background: dragActive ? "#eef2ff" : "#f8fafc",
            transition: "0.3s",
          }}
        >
          {file ? (
            <Typography fontWeight={600}>
              Selected: {file.name}
            </Typography>
          ) : (
            <Typography>
              Drag & Drop CSV file here or Click to Select
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : "Upload"}
        </Button>

        {errorMsg && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {errorMsg}
          </Alert>
        )}
      </CardContent>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" variant="filled">
          Bulk Upload Successful 🚀
        </Alert>
      </Snackbar>
    </Card>
  );
}