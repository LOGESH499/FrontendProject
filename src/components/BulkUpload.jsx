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

const WEBHOOK_URL = "https://your-webhook-url.com/webhook/bulk"; // optional

export default function BulkUpload() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile?.name.toLowerCase().endsWith(".csv")) {
      setErrorMsg("Please upload a valid CSV file.");
      return;
    }
    setFile(selectedFile);
    setErrorMsg("");
  };

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

  // 🔥 Generate Starting Employee ID
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

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSummary(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let inserted = 0;
        let failed = 0;

        try {
          // ✅ Generate starting employee ID once
          let currentEmployeeId = await generateEmployeeId();
          let currentNumber = parseInt(
            currentEmployeeId.replace("EMP", "")
          );

          for (const row of results.data) {
            try {
              if (!row.personal_email) {
                failed++;
                continue;
              }

              // 🔎 Check duplicate email
              const { data: existing } = await supabase
                .from("employees")
                .select("id")
                .eq("personal_email", row.personal_email);

              if (existing.length > 0) {
                failed++;
                continue;
              }

              // ✅ Generate sequential employee_id
              const newEmployeeId = `EMP${currentNumber
                .toString()
                .padStart(3, "0")}`;
              currentNumber++;

              // ✅ Insert into employees
              const { error: empError } = await supabase
                .from("employees")
                .insert([
                  {
                    employee_id: newEmployeeId,
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
                failed++;
                continue;
              }

              // ✅ Insert into provisioning_requests
              await supabase.from("provisioning_requests").insert([
                {
                  employee_id: newEmployeeId,
                  request_type: "onboarding",
                  target_role: row.job_role,
                  status: "pending",
                  requested_by: "bulk.upload@system.com",
                },
              ]);

              inserted++;
            } catch (innerErr) {
              console.error(innerErr);
              failed++;
            }
          }

          setSummary({ inserted, failed });

          if (inserted > 0) {
            setSuccess(true);
            setFile(null);
          }

          // 🔥 Optional webhook
          if (inserted > 0 && WEBHOOK_URL !== "") {
            await fetch(WEBHOOK_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: "Bulk upload completed",
                inserted,
              }),
            });
          }
        } catch (err) {
          console.error(err);
          setErrorMsg("Bulk upload failed.");
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

        {summary && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Inserted: {summary.inserted} | Failed: {summary.failed}
          </Alert>
        )}

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
          Bulk Upload Completed Successfully 🚀
        </Alert>
      </Snackbar>
    </Card>
  );
}