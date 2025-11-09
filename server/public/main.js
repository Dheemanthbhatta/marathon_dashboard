// ✅ Handle runner form submission
document.getElementById('runnerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // ✅ Handle multi-select and checkboxes
  data.categories = formData.getAll('categories');
  data.didFinish = formData.get('didFinish') === 'on';
  data.medalReceived = formData.get('medalReceived') === 'on';
  data.certificateReceived = formData.get('certificateReceived') === 'on';

  try {
    const res = await fetch('/api/runners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message || 'Runner submitted!');
  } catch (err) {
    console.error("❌ Error submitting runner:", err);
    alert("Submission failed");
  }
});

// ✅ Handle query selection from dropdown
async function runQuery() {
  const query = document.getElementById('querySelector').value;
  console.log("🔍 Selected query:", query);

  try {
    const res = await fetch(`/api/runners/${query}`);
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    const data = await res.json();
    displayTable(data);

    if (query === 'completion-rate-by-city') {
      renderCompletionChart(data);
    }
  } catch (err) {
    console.error("❌ Error running query:", err);
    alert("Query failed");
  }
}

// ✅ Handle city-based search
async function runCityQuery() {
  const city = document.getElementById('cityInput').value;

  try {
    const res = await fetch(`/api/runners/by-city/${city}`);
    const data = await res.json();
    displayTable(data);
  } catch (err) {
    console.error("❌ Error searching by city:", err);
    alert("City query failed");
  }
}

// ✅ Display results in a formatted table
function displayTable(data) {
  const result = document.getElementById('result');
  result.innerHTML = '';

  if (!Array.isArray(data) || data.length === 0) {
    result.textContent = 'No data found.';
    return;
  }

  const table = document.createElement('table');
  const headers = Object.keys(data[0]);

  table.innerHTML = `
    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    ${data.map(row => `
      <tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>
    `).join('')}
  `;

  result.appendChild(table);
}

// ✅ Chart rendering for completion rate
let chartInstance = null;

function renderCompletionChart(data) {
  const ctx = document.getElementById('chartCanvas').getContext('2d');
  const labels = data.map(item => item.city);
  const values = data.map(item => item.completionRate);

  if (chartInstance) {
    chartInstance.destroy(); // Clear previous chart
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Completion Rate (%)',
        data: values,
        backgroundColor: '#4CAF50'
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}