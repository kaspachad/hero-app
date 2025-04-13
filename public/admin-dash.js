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
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401) return handleUnauthorized();

  const data = await res.json();
  document.getElementById('heroes-enlisted').textContent = data.heroes_enlisted ?? 0;
  document.getElementById('spots-remaining').textContent = data.spots_remaining ?? 100;
  document.getElementById('countries').textContent = data.countries ?? 0;
  document.getElementById('tokens-per-hero').textContent = data.tokens_per_hero ?? '1B';
  document.getElementById('last-updated').textContent = data.last_updated
    ? new Date(data.last_updated).toLocaleString()
    : 'Never';
}

async function fetchApplications(page) {

  const res = await fetch(`/api/admin/applicants?page=${page}&limit=${pageSize}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const contentType = res.headers.get("content-type");

  if (res.status === 401) return handleUnauthorized();

  if (!res.ok) {
    const text = await res.text();
    console.error("Server error response:", text);
    return;
  }

  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    console.error("Not JSON response from server");
    console.log("Response body:", text);
    return;
  }

  let data;
  try {
    data = await res.json();
    console.log("Parsed data from server:", data);
  } catch (e) {
    console.warn('Error parsing JSON:', e);
    return;
  }

  const tbody = document.getElementById('applications-body');
  tbody.innerHTML = '';

  if (!data.applications || data.applications.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No applications found.</td></tr>';
    return;
  }

  tr.addEventListener('click', () => {
  currentModalApplicantId = app.id;
  document.getElementById('modal-screenname').textContent = app.screenname;
  document.getElementById('modal-email').textContent = app.email;
  document.getElementById('modal-country').textContent = app.country;
  document.getElementById('modal-age').textContent = app.age ?? '';
  document.getElementById('modal-address').textContent = app.kaspa_address;
  document.getElementById('modal-about').textContent = app.about || '';
  document.getElementById('modal-timestamp').textContent = new Date(app.timestamp).toLocaleString();
  document.getElementById('applicant-modal').style.display = 'flex';
});


  data.applications.forEach(app => {
    console.log("🧾 Rendering app:", app);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${app.screenname}</td>
      <td>${app.email}</td>
      <td>${app.country}</td>
      <td>${app.age ?? ''}</td>
      <td>${app.kaspa_address}</td>
      <td>${app.about || ''}</td>
      <td>${new Date(app.timestamp).toLocaleString()}</td>
      <td>
        <button onclick="approveApp(${app.id})">Approve</button>
        <button onclick="denyApp(${app.id})">Deny</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('current-page').textContent = page;
}

async function approveApp(id) {
  const res = await fetch(`/api/admin/approve/${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) return handleUnauthorized();

  if (res.ok) {
    alert('Approved!');
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
    fetchApplications(currentPage);
  } else {
    alert('Denial failed.');
  }
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

function closeModal() {
  document.getElementById('applicant-modal').style.display = 'none';
  currentModalApplicantId = null;
}


// Initial load
fetchStats();
fetchApplications(currentPage);

