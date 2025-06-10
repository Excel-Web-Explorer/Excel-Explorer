let currentAsset = null;
let originalQuery = null;

console.log("script.js loaded");

function createInputField(key, value) {
  return `
    <label>${key}</label><br>
    <input type="text" name="${key}" value="${value || ''}"><br><br>
  `;
}

function populateTable(asset) {
  const headerRow = document.getElementById("tableHeaderRow");
  const dataRow = document.getElementById("tableDataRow");
  headerRow.innerHTML = "";
  dataRow.innerHTML = "";

  Object.entries(asset).forEach(([key, value]) => {
    headerRow.innerHTML += `<th>${key}</th>`;
    dataRow.innerHTML += `<td>${value}</td>`;
  });
}

async function searchAsset() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Enter a value to search.");

  const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) return alert("Asset not found.");

  const asset = await res.json();
  currentAsset = asset;
  originalQuery = query;

  populateTable(asset);
  const display = document.getElementById("assetDisplay");
display.style.display = "block";
setTimeout(() => display.style.opacity = "1", 50);

  document.getElementById("editForm").style.display = "none";
  document.getElementById("saveChangesBtn").style.display = "none";
  document.getElementById("exportPdfBtn").style.display = "inline-block";

}

function editAsset() {
  const form = document.getElementById("editForm");
  form.innerHTML = "";
  Object.entries(currentAsset).forEach(([key, value]) => {
    form.innerHTML += createInputField(key, value);
  });

  form.style.display = "block";
  const saveBtn = document.getElementById("saveChangesBtn");
  saveBtn.onclick = updateAsset;
  saveBtn.style.display = "inline-block";
}
async function showAddForm() {
  try {
    console.log("showAddForm triggered");
    const res = await fetch('/api/headers');
    const headers = await res.json();
    console.log("📦 Headers received:", headers);

    const form = document.getElementById("editForm");
    form.innerHTML = "";

    headers.forEach(header => {
      const cleanHeader = String(header).replace(/\\r|\\n/g, '').trim();
      if (!cleanHeader || cleanHeader.startsWith("__EMPTY")) return; 
      const label = document.createElement("label");
      label.textContent = cleanHeader;

      const input = document.createElement("input");
      input.type = "text";
      input.name = cleanHeader;

      form.appendChild(label);
      form.appendChild(document.createElement("br"));
      form.appendChild(input);
      form.appendChild(document.createElement("br"));
      form.appendChild(document.createElement("br"));
    });

    form.style.display = "block";

    const saveBtn = document.getElementById("saveChangesBtn");
    saveBtn.onclick = addAsset;
    saveBtn.style.display = "inline-block";

  } catch (err) {
    console.error("Error in showAddForm:", err);
  }
}




async function updateAsset() {
  const inputs = document.querySelectorAll("#editForm input");
  const updatedData = {};
  inputs.forEach(input => {
    updatedData[input.name] = input.value;
  });

  const res = await fetch("/api/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: originalQuery, updatedData })
  });

  if (res.ok) {
    alert("Asset updated!");
    searchAsset(); 
  } else {
    alert("Update failed.");
  }
}

async function addAsset() {
  const inputs = document.querySelectorAll("#editForm input");
  const newAsset = {};
  inputs.forEach(input => newAsset[input.name] = input.value);

  const res = await fetch("/api/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newAsset)
  });

  if (res.ok) {
    alert(" Asset added!");
    document.getElementById("editForm").reset();
    document.getElementById("editForm").style.display = "none";
    document.getElementById("saveChangesBtn").style.display = "none";
  } else if (res.status === 409) {
    alert(" Asset already exists (duplicate Mc Serial No, Host Name, or IP Address).");
  } else {
    alert(" Add failed due to server error.");
  }
  
}

async function deleteAsset() {
  const confirmDelete = confirm("Are you sure you want to delete this asset?");
  if (!confirmDelete) return;

  const res = await fetch("/api/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: originalQuery })
  });

  if (res.ok) {
    alert("Asset deleted.");
    document.getElementById("assetDisplay").style.display = "none";
  } else {
    alert("Delete failed.");
  }
}

function downloadExcel() {
  window.location.href = "/api/download";
}

function exportPDF() {
  if (!originalQuery) return alert("Search for an asset first.");
  window.open(`/api/export-pdf?query=${encodeURIComponent(originalQuery)}`, "_blank");
}
