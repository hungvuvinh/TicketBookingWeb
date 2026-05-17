const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const dns = require('dns');

// Workaround: force public DNS servers for SRV resolution when local DNS refuses
dns.setServers(['1.1.1.1', '8.8.8.8']);
const apiRouter = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected MongoDB'))
  .catch(err => console.error(err));

app.use("/api", apiRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
