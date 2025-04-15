let currentPage = 1;
const pageSize = 10;
let currentModalApplicantId = null;
const token = localStorage.getItem('authToken');

function handleUnauthorized() {
  alert("Session expired or unauthorized. Please log in again.");
  localStorage.removeItem('authToken');
  window.location.href = '/admin';
}

async function fetchStats() {
  const res = await fetch('/api/admin/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) return handleUnauthorized();

  const data = await res.json();
  document.getElementById('heroes-enlisted').textContent = data.heroes_enlisted ?? 0;
  document.getElementById('spots-remaining').textContent = data.spots_remaining ?? 100;
  document.getElementById('countries').textContent = data.countries ?? 0;
  document.getElementById('tokens-per-hero').textContent = data.tokens_per_hero ?? '1B';
}

async function fetchApplications(page) {
  const res = await fetch(`/api/admin/applicants?page=${page}&limit=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const contentType = res.headers.get("content-type");
  if (res.status === 401) return handleUnauthorized();

  if (!res.ok || !contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    console.error("Invalid server response:", text);
    return;
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    console.warn('Error parsing JSON:', e);
    return;
  }

  const tbody = document.getElementById('applications-body');
  tbody.innerHTML = '';

  if (!data.applications || data.applications.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9">No applications found.</td></tr>';
    return;
  }

  data.applications.forEach(app => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${app.screenname}</td>
      <td>${app.email}</td>
      <td>${app.country}</td>
      <td>${app.age ?? ''}</td>
      <td>${app.social_media || ''}</td>
      <td>${app.kaspa_address}</td>
      <td>${app.about || ''}</td>
      <td>${new Date(app.timestamp).toLocaleString()}</td>
      <td>
        <button onclick="approveApp(${app.id})">Approve</button>
        <button onclick="denyApp(${app.id})">Deny</button>
      </td>
    `;

    // Modal popup on row click
    tr.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() === 'button') return; // Skip if button clicked

      currentModalApplicantId = app.id;
      document.getElementById('modal-screenname').textContent = app.screenname;
      document.getElementById('modal-email').textContent = app.email;
      document.getElementById('modal-country').textContent = app.country;
      document.getElementById('modal-age').textContent = app.age ?? '';
      document.getElementById('modal-social-media').textContent = app.social_media || '';
      document.getElementById('modal-address').textContent = app.kaspa_address;
      document.getElementById('modal-about').textContent = app.about || '';
      document.getElementById('modal-timestamp').textContent = new Date(app.timestamp).toLocaleString();
      document.getElementById('applicant-modal').style.display = 'flex';
    });

    tbody.appendChild(tr);
  });

  document.getElementById('current-page').textContent = page;
}

function downloadCSV() {
  fetch(`/api/admin/applicants?page=1&limit=9999`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.applications || !data.applications.length) {
        alert("No applicants to export.");
        return;
      }

      const headers = Object.keys(data.applications[0]);
      const csvRows = [
        headers.join(','), // Header row
        ...data.applications.map(row =>
          headers.map(field => `"${(row[field] ?? '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ];

      const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(csvBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'applicants.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error('CSV download failed:', err);
      alert("Error downloading CSV.");
    });
}

async function approveApp(id) {
  const res = await fetch(`/api/admin/approve/${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) return handleUnauthorized();

  if (res.ok) {
    alert('Approved!');
    closeModal();
    fetchApplications(currentPage);
  } else {
    alert('Approval failed.');
  }
}

async function denyApp(id) {
  const res = await fetch(`/api/admin/deny/${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) return handleUnauthorized();

  if (res.ok) {
    alert('Denied.');
    closeModal();
    fetchApplications(currentPage);
  } else {
    alert('Denial failed.');
  }
}

function closeModal() {
  document.getElementById('applicant-modal').style.display = 'none';
  currentModalApplicantId = null;
}

document.getElementById('prev-page').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchApplications(currentPage);
  }
});

document.getElementById('next-page').addEventListener('click', () => {
  currentPage++;
  fetchApplications(currentPage);
});

document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  fetchApplications(currentPage);
});
