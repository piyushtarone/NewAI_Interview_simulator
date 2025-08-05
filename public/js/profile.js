window.onload = async () => {
    try {
        const res = await fetch('/api/history');
        if (!res.ok) {
            throw new Error(`Failed to fetch history: ${res.statusText}`);
        }
        const history = await res.json();

        if (history.length === 0) {
            document.querySelector('.container').innerHTML += '<p>No interview history found. Complete an interview to see your progress!</p>';
            // Clear the "loading" message from the table
            document.querySelector('#history-table tbody').innerHTML = '<tr><td colspan="4">No history available.</td></tr>';
            return;
        }

        populateHistoryTable(history);
        renderProgressChart(history);
    } catch (error) {
        console.error("Error loading profile:", error);
        document.querySelector('.container').innerHTML += `<p style="color:red;">Could not load history: ${error.message}</p>`;
    }
};

function populateHistoryTable(history) {
    const tbody = document.querySelector('#history-table tbody');
    tbody.innerHTML = ''; // Clear existing rows

    history.forEach(session => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(session.date).toLocaleDateString()}</td>
            <td>${session.domain}</td>
            <td>${session.averageScore.toFixed(1)} / 10</td>
            <td>${session.evaluation.overall_proficiency}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderProgressChart(history) {
    // Reverse history so the chart shows oldest to newest (left to right)
    const reversedHistory = [...history].reverse();
    
    const labels = reversedHistory.map(session => new Date(session.date).toLocaleDateString());
    const data = reversedHistory.map(session => session.averageScore);

    const ctx = document.getElementById('progress-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Score',
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
