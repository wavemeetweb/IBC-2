const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf2Ld6SGcfTk98GGyZDqxlqhorGr2BbTblFpM-m7GjiP0fx0A/formResponse';

const GOOGLE_FORM_FIELDS = {
  name: 'entry.1850879627',
  service: 'entry.710044027',
  phone: 'entry.864139383',
  entryDate: 'entry.1058717687',
  email: 'entry.XYZ_EMAIL',        // REPLACE with your Email field entry ID
  returnDate: 'entry.XYZ_RETURN',  // REPLACE with your Return Date field entry ID
  status: 'entry.XYZ_STATUS'       // REPLACE with your Status field entry ID
};

// Replace below with your actual Google Sheet published CSV URL (must be CSV for simple parse)
// Example published CSV URL, you have to get it from your Google Sheet File->Publish to web->CSV
const PUBLISHED_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?output=csv';

const form = document.getElementById('customerForm');
const logoutBtn = document.getElementById('logoutBtn');
const printBtn = document.getElementById('printBtn');
const searchInput = document.getElementById('searchInput');
const customerTableBody = document.querySelector('#customerTable tbody');
const tabButtons = document.querySelectorAll('.tab-btn');

let fullData = [];
let filteredData = [];
let currentStatusFilter = 'Pending';

function escapeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function filterAndRender() {
  let searchTerm = searchInput.value.trim().toLowerCase();

  filteredData = fullData.filter(row => {
    // Filter by current status tab
    if (row.Status !== currentStatusFilter) return false;

    if (!searchTerm) return true;

    return Object.values(row).some(val =>
      val.toLowerCase().includes(searchTerm)
    );
  });

  renderTable();
}

function renderTable() {
  customerTableBody.innerHTML = '';
  if (filteredData.length === 0) {
    customerTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No entries found.</td></tr>';
    return;
  }
  filteredData.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHTML(row.Name)}</td>
                    <td>${escapeHTML(row.Email || '-')}</td>
                    <td>${escapeHTML(row.Phone)}</td>
                    <td>${escapeHTML(row.Service)}</td>
                    <td>${escapeHTML(row['Entry Date'])}</td>
                    <td>${escapeHTML(row['Return Date'] || '')}</td>
                    <td>${escapeHTML(row.Status)}</td>`;
    customerTableBody.appendChild(tr);
  });
}

function parseCSV(text) {
  // Simple CSV parser assuming no escaped commas
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const data = line.split(',');
    const obj = {};
    headers.forEach((h,i) => obj[h.trim()] = data[i] ? data[i].trim() : '');
    return obj;
  });
}

async function loadSheetData() {
  try {
    const res = await fetch(PUBLISHED_SHEET_CSV_URL);
    const text = await res.text();
    fullData = parseCSV(text);
    filterAndRender();
  } catch (err) {
    alert('Failed to load sheet data. See console.');
    console.error(err);
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {};

  data[GOOGLE_FORM_FIELDS.name] = form.name.value.trim();
  data[GOOGLE_FORM_FIELDS.service] = form.service.value.trim();
  data[GOOGLE_FORM_FIELDS.phone] = form.phone.value.trim();
  data[GOOGLE_FORM_FIELDS.entryDate] = form.entryDate.value;

  if (form.email.value.trim() && GOOGLE_FORM_FIELDS.email) {
    data[GOOGLE_FORM_FIELDS.email] = form.email.value.trim();
  }
  if (form.returnDate.value && GOOGLE_FORM_FIELDS.returnDate) {
    data[GOOGLE_FORM_FIELDS.returnDate] = form.returnDate.value;
  }
  data[GOOGLE_FORM_FIELDS.status] = form.status.value || 'Pending';

  if (!data[GOOGLE_FORM_FIELDS.name] || !data[GOOGLE_FORM_FIELDS.service] || !data[GOOGLE_FORM_FIELDS.phone] || !data[GOOGLE_FORM_FIELDS.entryDate]) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(data).toString()
    });
    alert('Entry submitted successfully!');
    form.reset();
    loadSheetData();
  } catch (e) {
    alert('Failed to submit. Please try again.');
  }
});

logoutBtn.onclick = () => {
  sessionStorage.clear();
  window.location.href = 'login.html';
};

printBtn.onclick = () => window.print();

searchInput.addEventListener('input', () => {
  filterAndRender();
});

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStatusFilter = btn.getAttribute('data-status');
    filterAndRender();
  });
});

// Initial load
loadSheetData();
