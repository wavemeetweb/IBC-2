// Google Form POST URL (Replace with your actual Google Form POST URL!)  
// It must end with `/formResponse`, NOT `/viewform`
const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf2Ld6SGcfTk98GGyZDqxlqhorGr2BbTblFpM-m7GjiP0fx0A/formResponse';

// Map your form fields to Google Form entry IDs (inspect your form elements to get these)
const GOOGLE_FORM_FIELDS = {
  name: 'entry.1850879627',
  service: 'entry.710044027',
  phone: 'entry.864139383',
  entryDate: 'entry.1058717687',
  email: 'entry.XXXXXXX',    // Replace 'entry.XXXXXXX' with actual entry ID for email if exists
  returnDate: 'entry.YYYYYYY' // Replace 'entry.YYYYYYY' with actual entry ID for return date if exists
};

// Helper to encode data in form-urlencoded format
const encodeFormData = data => 
  Object.entries(data).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

// Submit customer form data to Google Form
const submitToGoogleForm = async (data) => {
  const formBody = encodeFormData(data);
  
  try {
    await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      mode: 'no-cors', // bypass CORS, no response data accessible
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody
    });
    alert('Entry submitted successfully!');
  } catch (e) {
    alert('Failed to submit: ' + (e.message || e));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const printBtn = document.getElementById('printBtn');
  const searchInput = document.getElementById('searchInput');
  const sheetView = document.getElementById('sheetView');

  // Logout handler
  logoutBtn.onclick = () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
  };

  // Set Google Sheet embed URL (replace YOUR_SHEET_ID below with the actual)
  sheetView.src = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pubhtml?widget=true&headers=false';
  // You need to go to your Sheets: File > Share > Publish to web > Entire Document > Format: Web page

  // Form submission handler
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {};

    // Required fields
    data[GOOGLE_FORM_FIELDS.name] = form.name.value.trim();
    data[GOOGLE_FORM_FIELDS.service] = form.service.value.trim();
    data[GOOGLE_FORM_FIELDS.phone] = form.phone.value.trim();
    data[GOOGLE_FORM_FIELDS.entryDate] = form.entryDate.value;

    // Optional fields (only add if filled)
    if (form.email.value.trim() && GOOGLE_FORM_FIELDS.email) {
      data[GOOGLE_FORM_FIELDS.email] = form.email.value.trim();
    }
    if (form.returnDate.value && GOOGLE_FORM_FIELDS.returnDate) {
      data[GOOGLE_FORM_FIELDS.returnDate] = form.returnDate.value;
    }

    if (!data[GOOGLE_FORM_FIELDS.name] || !data[GOOGLE_FORM_FIELDS.service] || !data[GOOGLE_FORM_FIELDS.phone] || !data[GOOGLE_FORM_FIELDS.entryDate]) {
      alert('Please fill in all required fields (Name, Service, Phone, Entry Date).');
      return;
    }

    submitToGoogleForm(data);
    form.reset();
  });

  // Search filtering: Since data is in Sheet iframe and not directly accessible,
  // live search filtering of embedded Sheet is not possible without Google Sheet API.
  // You can add full custom read-write integration separately if needed.

  // Print button
  printBtn.onclick = () => {
    window.print();
  };
});
