// ======= CONFIGURATION =======
// Your Google Form POST URL (ends with /formResponse)
const GOOGLE_FORM_URL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSf2LdDjx-something/formResponse";

// Update these with your actual form entry IDs
const GOOGLE_FORM_FIELDS = {
  name: "entry.1850877",
  service: "entry.7100440",
  phone: "entry.8641383",
  entryDate: "entry.1058717",
  email: "entry.1848412",
  returnDate: "entry.1910426",
  status: "entry.1396189"
};

// Published CSV URL of your Google Sheet (you must publish your sheet and replace YOUR_ID):
const PUBLISHED_CSV_URL = "https://docs.google.com/spreadsheets/d/e/YOUR_ID/pub?gid=0&single=true&output=csv";

const form = document.getElementById("customerForm");
const logoutBtn = document.getElementById("logoutBtn");
const printBtn = document.getElementById("printBtn");
const searchInput = document.getElementById("searchInput");
const userDisplay = document.getElementById("userDisplay");
const customerTableBody = document.querySelector("#customerTable tbody");
const tabButtons = document.querySelectorAll(".tab-btn");

let fullData = [];
let filteredData = [];
let currentStatus = "Pending";

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = cells[i] ? cells[i].trim() : "";
    });
    return obj;
  });
}

async function loadSheetData() {
  try {
    const res = await fetch(PUBLISHED_CSV_URL);
    const text = await res.text();
    fullData = parseCSV(text);
    filterAndRender();
  } catch (err) {
    alert("Failed to load data from Sheet. Check your CSV URL.");
    console.error(err);
  }
}

function filterAndRender() {
  const term = searchInput.value.toLowerCase();

  filteredData = fullData.filter(
    (row) =>
      row.Status === currentStatus &&
      (term === "" ||
        Object.values(row).some(
          (val) => val && val.toLowerCase().includes(term)
        ))
  );

  renderTable();
}

function renderTable() {
  customerTableBody.innerHTML = "";

  if (filteredData.length === 0) {
    customerTableBody.innerHTML =
      "<tr><td colspan='7' style='text-align:center;padding:20px'>No entries found</td></tr>";
    return;
  }

  filteredData.forEach((row) => {
    customerTableBody.insertAdjacentHTML(
      "beforeend",
      `<tr>
      <td>${escapeHTML(row.Name)}</td>
      <td>${escapeHTML(row.Email || "-")}</td>
      <td>${escapeHTML(row.Phone)}</td>
      <td>${escapeHTML(row.Service)}</td>
      <td>${escapeHTML(row["Entry Date"])}</td>
      <td>${escapeHTML(row["Return Date"] || "")}</td>
      <td>${escapeHTML(row.Status)}</td>
    </tr>`
    );
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {};
  data[GOOGLE_FORM_FIELDS.name] = form.name.value.trim();
  data[GOOGLE_FORM_FIELDS.service] = form.service.value.trim();
  data[GOOGLE_FORM_FIELDS.phone] = form.phone.value.trim();
  data[GOOGLE_FORM_FIELDS.entryDate] = form.entryDate.value;
  if (form.email.value.trim())
    data[GOOGLE_FORM_FIELDS.email] = form.email.value.trim();
  if (form.returnDate.value)
    data[GOOGLE_FORM_FIELDS.returnDate] = form.returnDate.value;

  // Always set status to pending for new entries
  data[GOOGLE_FORM_FIELDS.status] = "Pending";

  if (
    !data[GOOGLE_FORM_FIELDS.name] ||
    !data[GOOGLE_FORM_FIELDS.service] ||
    !data[GOOGLE_FORM_FIELDS.phone] ||
    !data[GOOGLE_FORM_FIELDS.entryDate]
  ) {
    alert("Please fill in all required fields");
    return;
  }

  try {
    await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString(),
    });
    alert("Entry submitted! It will appear shortly");
    form.reset();
    // Wait 3 seconds then refresh sheet data to reflect new entry
    setTimeout(loadSheetData, 3000);
  } catch (err) {
    alert("Failed to submit entry. Please try again.");
    console.error(err);
  }
});

tabButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentStatus = btn.getAttribute("data-status");
    filterAndRender();
  })
);

searchInput.addEventListener("input", filterAndRender);

logoutBtn.addEventListener("click", () => {
  sessionStorage.clear();
  window.location.href = "login.html";
});

printBtn.addEventListener("click", () => window.print());

window.addEventListener("DOMContentLoaded", () => {
  userDisplay.textContent = sessionStorage.getItem("username") || "User";
  loadSheetData();
});
