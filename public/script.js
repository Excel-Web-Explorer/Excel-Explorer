let currentAsset = null;
let originalQuery = null;

console.log("✅ script.js loaded");

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
  document.getElementById("assetDisplay").style.display = "block";
  document.getElementById("editForm").style.display = "none";
  document.getElementById("saveChangesBtn").style.display = "none";
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

function showAddForm() {
  const form = document.getElementById("editForm");
  form.innerHTML = `
    <label>IP Address</label><br><input name="IP Address"><br><br>
    <label>Host Name</label><br><input name="Host Name"><br><br>
    <label>Mc Serial No</label><br><input name="Mc Serial No"><br><br>
  `;
  form.style.display = "block";
  const saveBtn = document.getElementById("saveChangesBtn");
  saveBtn.onclick = addAsset;
  saveBtn.style.display = "inline-block";
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
    searchAsset(); // Refresh the table
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
    alert("Asset added!");
    document.getElementById("editForm").reset();
    document.getElementById("editForm").style.display = "none";
    document.getElementById("saveChangesBtn").style.display = "none";
  } else {
    alert("Add failed.");
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
