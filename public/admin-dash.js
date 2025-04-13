let currentPage = 1;
const pageSize = 10;

async function fetchStats() {
  const res = await fetch('/api/admin/stats');
  const data = await res.json();
  document.getElementById('heroes-enlisted').textContent = data.heroes_enlisted;
  document.getElementById('spots-remaining').textContent = data.spots_remaining;
  document.getElementById('countries').textContent = data.countries;
  document.getElementById('tokens-per-hero').textContent = data.tokens_per_hero;
  document.getElementById('last-updated').textContent = new Date(data.last_updated).toLocaleString();
}

async function fetchApplications(page) {
  const res = await fetch(`/api/admin/applications?page=${page}&size=${pageSize}`);
  const data = await res.json();

  const tbody = document.getElementById('applications-body');
  tbody.innerHTML = '';

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
    method: 'POST'
  });

  if (res.ok) {
    alert('Approved!');
    fetchApplications(currentPage);
  } else {
    alert('Approval failed.');
  }
}

async function denyApp(id) {
  const res = await fetch(`/api/admin/deny/${id}`, {
    method: 'POST'
  });

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

fetchStats();
fetchApplications(currentPage);

