const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf2Ld6SGcfTk98GGyZDqxlqhorGr2BbTblFpM-m7GjiP0fx0A/formResponse';

// Fill in with real entry IDs from your Google Form for each field!
const GOOGLE_FORM_FIELDS = {
  name: 'entry.1850879627',
  service: 'entry.710044027',
  phone: 'entry.864139383',
  entryDate: 'entry.1058717687',
  email: 'entry.1234567890',    // CHANGE to your Email field's entry ID
  returnDate: 'entry.9876543210', // CHANGE to your Return Date field's entry ID
  status: 'entry.1396189706'      // CHANGE to your Status field's entry ID
};

// Your published Google Sheet CSV URL (publish sheet to web as CSV format, then paste link here)
const PUBLISHED_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkJCR-zlwSIGXLZqQxeubhP2ztx47wXj8MTt53YMMMy7ipO0nZ7i7FD-X6bw73j5ADVoAPesqfJ7rO/pub?output=csv';

const form = document.getElementById('customerForm');
const logoutBtn = document.getElementById('logoutBtn');
const printBtn = document.getElementById('printBtn');
const searchInput = document.getElementById('searchInput');
const customerTableBody = document.querySelector('#customerTable tbody');
const tabButtons = document.querySelectorAll('.tab-btn');
const userDisplay = document.getElementById('userDisplay');

let fullData = [];
let filteredData = [];
let currentStatus = 'Pending';

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    // Basic comma-split (won't handle commas in values, but fine for simple sheets)
    const cells = line.split(',');
    const obj = {};
    headers.forEach((header, i) => (obj[header] = (cells[i] || '').trim()));
    obj.Email = obj.Email || '';
    obj['Return Date'] = obj['Return Date'] || '';
    return obj;
  });
}
async function loadSheetData() {
  try {
    const res = await fetch(PUBLISHED_CSV_URL);
    const text = await res.text();
    fullData = parseCSV(text);
    filterAndRender();
  } catch (error) {
    alert('Failed to load data from Google Sheets. Make sure the sheet is published as CSV and public.');
    console.error(error);
  }
}
function filterAndRender() {
  const term = searchInput.value.trim().toLowerCase();
  filteredData = fullData.filter(row => {
    if (row.Status !== currentStatus) return false;
    if (term === '') return true;
    return Object.values(row).some(value => value.toLowerCase().includes(term));
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
    customerTableBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${escapeHTML(row.Name)}</td>
        <td>${escapeHTML(row.Email)}</td>
        <td>${escapeHTML(row.Phone)}</td>
        <td>${escapeHTML(row.Service)}</td>
        <td>${escapeHTML(row['Entry Date'])}</td>
        <td>${escapeHTML(row['Return Date'])}</td>
        <td>${escapeHTML(row.Status)}</td>
      </tr>
    `);
  });
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
  // Always set status as Pending by default
  data[GOOGLE_FORM_FIELDS.status] = 'Pending';

  if (!data[GOOGLE_FORM_FIELDS.name] || !data[GOOGLE_FORM_FIELDS.service] ||
      !data[GOOGLE_FORM_FIELDS.phone] || !data[GOOGLE_FORM_FIELDS.entryDate]) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString()
    });
    alert('Entry submitted successfully! Wait a few seconds for it to appear.');
    form.reset();
    setTimeout(loadSheetData, 3000); // Wait 3s, then reload to fetch from sheet
  } catch (err) {
    alert('Failed to submit entry. Please try again.');
    console.error(err);
  }
});

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentStatus = button.getAttribute('data-status');
    filterAndRender();
  });
});
searchInput.addEventListener('input', filterAndRender);
logoutBtn.addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'login.html';
});
printBtn.addEventListener('click', () => window.print());

document.addEventListener('DOMContentLoaded', () => {
  userDisplay.textContent = sessionStorage.getItem('username') || 'User';
  loadSheetData();
});
