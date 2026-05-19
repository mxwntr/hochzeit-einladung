document.addEventListener("DOMContentLoaded", fetchGuests);

function fetchGuests() {
    fetch('/api/guests')
        .then(res => res.json())
        .then(guests => {
            const tbody = document.getElementById("guests-tbody");
            tbody.innerHTML = "";
            
            for (const [name, info] of Object.entries(guests)) {
                const tr = document.createElement("tr");
                
                const tdName = document.createElement("td");
                tdName.textContent = name;
                
                const tdOpened = document.createElement("td");
                tdOpened.textContent = info.opened ? "Ja" : "Nein";
                
                const tdStatus = document.createElement("td");
                
                let statusText = "Ausstehend";
                let statusClass = "status-pending";
                
                if (info.status === 'accepted') {
                    statusText = "Zugesagt";
                    statusClass = "status-accepted";
                } else if (info.status === 'declined') {
                    statusText = "Abgesagt";
                    statusClass = "status-declined";
                }
                
                tdStatus.textContent = statusText;
                tdStatus.className = statusClass;
                
                tr.appendChild(tdName);
                tr.appendChild(tdOpened);
                tr.appendChild(tdStatus);
                
                tbody.appendChild(tr);
            }
        })
        .catch(err => console.error("Error fetching guests:", err));
}

function generateLink() {
    const nameInput = document.getElementById("guest-name-input").value.trim();
    if (!nameInput) {
        alert("Bitte einen Namen eingeben.");
        return;
    }
    
    // Construct the URL
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/?name=${encodeURIComponent(nameInput)}`;
    
    const linkEl = document.getElementById("generated-link");
    linkEl.href = link;
    linkEl.textContent = link;
}

// Refresh guest list every 5 seconds
setInterval(fetchGuests, 5000);
