// --- CONFIGURATION ---
// Your Google Form POST URL ending with `/formResponse`
const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf2Ld6SGcfTk98GGyZDqxlqhorGr2BbTblFpM-m7GjiP0fx0A/formResponse';

// Your Google Form field entry IDs — replace with actual IDs from your Google Form inputs
const GOOGLE_FORM_FIELDS = {
  name: 'entry.1850879627',
  service: 'entry.710044027',
  phone: 'entry.864139383',
  entryDate: 'entry.1058717687',
  email: 'entry.1234567890',    // Replace with your email field entry ID
  returnDate: 'entry.9876543210', // Replace with your return date field entry ID
  status: 'entry.1396189706'      // Replace with your status field entry ID
};

// Your Google Sheet published CSV URL (File ➔ Publish to web ➔ Entire document ➔ CSV)
// IMPORTANT: replace YOUR_SHEET_ID with the ID from your live Google Sheet
const PUBLISHED_CSV_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?output=csv';

// DOM elements
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

// Escape HTML to prevent XSS
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// Parse CSV from Google Sheets
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cells = line.split(',');
    const obj = {};
    headers.forEach((header, i) => (obj[header] = (cells[i] || '').trim()));
    // Normalize some columns to empty string if missing
    obj.Email = obj.Email || '';
    obj['Return Date'] = obj['Return Date'] || '';
    return obj;
  });
}

// Load data from published Google Sheet CSV
async function loadSheetData() {
  try {
    const res = await fetch(PUBLISHED_CSV_URL);
    const text = await res.text();
    fullData = parseCSV(text);
    filterAndRender();
  } catch (error) {
    alert('Failed to load data from Google Sheets. Check your published CSV URL and internet connection.');
    console.error(error);
  }
}

// Filter data according to search input and status tab
function filterAndRender() {
  const term = searchInput.value.trim().toLowerCase();
  filteredData = fullData.filter(row => {
    if (row.Status !== currentStatus) return false;
    if (term === '') return true;
    return Object.values(row).some(value => value.toLowerCase().includes(term));
  });
  renderTable();
}

// Render filtered data into the HTML table
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

// Submit form data to Google Form
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

  // Always set status as Pending by default, user does not select
  data[GOOGLE_FORM_FIELDS.status] = 'Pending';

  if (!data[GOOGLE_FORM_FIELDS.name] || !data[GOOGLE_FORM_FIELDS.service] || !data[GOOGLE_FORM_FIELDS.phone] || !data[GOOGLE_FORM_FIELDS.entryDate]) {
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
    alert('Entry submitted successfully! Please wait a few seconds for it to appear in the list.');
    form.reset();

    // Wait 3 seconds then reload the sheet data to show new entry
    setTimeout(loadSheetData, 3000);
  } catch (err) {
    alert('Failed to submit entry. Please try again.');
    console.error(err);
  }
});

// Tab buttons to toggle Pending/Completed
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentStatus = button.getAttribute('data-status');
    filterAndRender();
  });
});

// Search input handler
searchInput.addEventListener('input', filterAndRender);

// Logout button
logoutBtn.addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'login.html';
});

// Print button
printBtn.addEventListener('click', () => {
  window.print();
});

// On page load, set username and load the sheet data
document.addEventListener('DOMContentLoaded', () => {
  userDisplay.textContent = sessionStorage.getItem('username') || 'User';
  loadSheetData();
});
