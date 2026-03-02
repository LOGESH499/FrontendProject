import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
} from "@mui/material";

export default function ChatPanel() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages([...messages, { text: message }]);
    setMessage("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box
      sx={{
        height: "85vh",
        width: "100%",
        background: "#fff",
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        p: 3,
      }}
    >
      <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
        {messages.map((msg, i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Paper
              sx={{
                p: 2,
                background: "#2563eb",
                color: "#fff",
                borderRadius: 2,
                maxWidth: "60%",
              }}
            >
              <Typography>{msg.text}</Typography>
            </Paper>
          </Box>
        ))}
        <div ref={bottomRef} />
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          fullWidth
          placeholder="Type message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button variant="contained" onClick={handleSend}>
          Send
        </Button>
      </Box>
    </Box>
  );
}