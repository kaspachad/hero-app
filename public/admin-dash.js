let currentPage = 1;
const pageSize = 10;
const token = localStorage.getItem('authToken');
const authHeader = { Authorization: `Bearer ${token}` };

async function fetchStats() {
  const res = await fetch('/api/admin/stats', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401) return handleUnauthorized();

  if (!res.ok) {
    console.error('Stats fetch failed with status', res.status);
    return;
  }

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
  headers: authHeader
});


  if (res.status === 401) return handleUnauthorized();

  if (!res.ok) {
    console.error('Applications fetch failed with status', res.status);
    return;
  }

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    console.warn('No JSON response (likely empty DB)');
    data.applications = [];
  }

  const tbody = document.getElementById('applications-body');
  tbody.innerHTML = '';

  if (!data.applications || data.applications.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No applications found.</td></tr>';
    return;
  }

  data.applications.forEach(app => {
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
  headers: authHeader
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
  headers: authHeader
});


  if (res.status === 401) return handleUnauthorized();

  if (res.ok) {
    alert('Denied.');
    fetchApplications(currentPage);
  } else {
    alert('Denial failed.');
  }
}

function handleUnauthorized() {
  alert("Session expired. Please log in again.");
  localStorage.removeItem('authToken');
  window.location.href = '/admin';
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

fetchStats();
fetchApplications(currentPage);

