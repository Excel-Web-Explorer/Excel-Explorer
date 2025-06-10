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

const TOTAL_COLUMNS = 36;

function loadExcel() {
  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const range = XLSX.utils.decode_range("A1:AK1000");

  const headers = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
    const header = cell && cell.v ? String(cell.v).trim() : `UNKNOWN_${C}`;
    headers.push(header);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: headers,
    range: 1
  });

  
  const completeRows = rows.map(row => {
    const completeRow = {};
    headers.forEach(h => {
      completeRow[h] = row[h] || '';
    });
    return completeRow;
  });

  return completeRows;
}

function saveExcel(data) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, FILE_PATH);
}

app.get('/api/search', (req, res) => {
  const { query } = req.query;
  const data = loadExcel();

  const result = data.find(row =>
    row["Mc Serial No"] === query ||
    row["Host Name"] === query ||
    row["IP Address"] === query
  );

  if (!result) return res.status(404).json({ message: "Asset not found" });

  res.json(result);
});

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

app.post('/api/add', (req, res) => {
  const newAsset = req.body;
  const data = loadExcel();

  const conflictFields = [];

 
  if (data.some(row => row["Mc Serial No"] === newAsset["Mc Serial No"])) {
    conflictFields.push("Mc Serial No");
  }
  if (data.some(row => row["Host Name"] === newAsset["Host Name"])) {
    conflictFields.push("Host Name");
  }
  if (data.some(row => row["IP Address"] === newAsset["IP Address"])) {
    conflictFields.push("IP Address");
  }

  if (conflictFields.length > 0) {
    return res.status(409).json({
      message: `Asset already exists with duplicate field(s): ${conflictFields.join(', ')}`
    });
  }

 
  data.push(newAsset);
  saveExcel(data);
  res.status(201).json({ message: "Asset added successfully" });
});


app.get('/api/headers', (req, res) => {
  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const range = XLSX.utils.decode_range("A1:AK1");
  const headers = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
    const header = cell && cell.v ? String(cell.v).trim() : `UNKNOWN_${C}`;
    headers.push(header);
  }

  res.json(headers);
});

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

const PDFDocument = require('pdfkit');

app.get('/api/export-pdf', (req, res) => {
  const { query } = req.query;
  const data = loadExcel();

  const asset = data.find(row =>
    row["Mc Serial No"] === query ||
    row["Host Name"] === query ||
    row["IP Address"] === query
  );

  if (!asset) return res.status(404).json({ message: "Asset not found" });

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${asset["Host Name"] || "asset"}.pdf`);
  doc.pipe(res);

  doc.fontSize(16).text('Asset Report', { underline: true });
  doc.moveDown();

  Object.entries(asset).forEach(([key, value]) => {
    doc.fontSize(12).text(`${key}: ${value || 'N/A'}`);
  });

  doc.end();
});




app.get('/api/download', (req, res) => {
  res.download(FILE_PATH, 'Asset Repository.xlsx');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
