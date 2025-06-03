const express = require('express');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;
const FILE_PATH = 'Asset Repository.xlsx';

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Utility: Load sheet
function loadExcel() {
  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

// Utility: Save sheet
function saveExcel(data) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, FILE_PATH);
}

// 🔍 Search by unique field
app.get('/api/search', (req, res) => {
  const { query } = req.query;
  const data = loadExcel();

  const result = data.find(row =>
    row["Mc Serial No"] === query ||
    row["Host Name"] === query ||
    row["IP Address"] === query
  );

  if (result) res.json(result);
  else res.status(404).json({ message: "Asset not found" });
});

// ✏️ Update an asset
app.put('/api/update', (req, res) => {
  const { query, updatedData } = req.body;
  const data = loadExcel();
  const index = data.findIndex(row =>
    row["Mc Serial No"] === query ||
    row["Host Name"] === query ||
    row["IP Address"] === query
  );

  if (index === -1) return res.status(404).json({ message: "Asset not found" });

  data[index] = { ...data[index], ...updatedData };
  saveExcel(data);
  res.json({ message: "Asset updated successfully" });
});
// ➕ Add a new asset
app.post('/api/add', (req, res) => {
  const newAsset = req.body;
  const data = loadExcel();

  // Check for duplicates
  const exists = data.some(row =>
    row["Mc Serial No"] === newAsset["Mc Serial No"] ||
    row["Host Name"] === newAsset["Host Name"] ||
    row["IP Address"] === newAsset["IP Address"]
  );

  if (exists) return res.status(409).json({ message: "Asset already exists" });

  data.push(newAsset);
  saveExcel(data);
  res.status(201).json({ message: "Asset added successfully" });
});

// ❌ Delete an asset
app.delete('/api/delete', (req, res) => {
  const { query } = req.body;
  let data = loadExcel();
  const originalLength = data.length;

  data = data.filter(row =>
    row["Mc Serial No"] !== query &&
    row["Host Name"] !== query &&
    row["IP Address"] !== query
  );

  if (data.length === originalLength) {
    return res.status(404).json({ message: "Asset not found" });
  }

  saveExcel(data);
  res.json({ message: "Asset deleted successfully" });
});

try {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
  }
  