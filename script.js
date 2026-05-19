document.addEventListener("DOMContentLoaded", () => {
    const guestNameDisplay = document.getElementById("guest-name-display");
    const bgMusic = document.getElementById("bg-music");
    const vinylBtn = document.getElementById("vinyl-btn");
    
    // Parse URL parameter ?name=...
    const urlParams = new URLSearchParams(window.location.search);
    let guestName = urlParams.get("name");
    
    // Formatting the name
    if (guestNameDisplay && guestName) {
        guestNameDisplay.textContent = `Liebe(r) ${guestName},`;
        
        // Notify server that it was opened (if name is provided)
        fetch('/api/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: guestName, opened: true })
        }).catch(err => console.error("Error updating status:", err));
    }

    let isPlaying = false;

    // Play/Pause music when clicking vinyl
    if (vinylBtn && bgMusic) {
        vinylBtn.addEventListener("click", () => {
            if (isPlaying) {
                bgMusic.pause();
                vinylBtn.classList.remove("playing");
                isPlaying = false;
            } else {
                bgMusic.volume = 0.5;
                bgMusic.play().then(() => {
                    vinylBtn.classList.add("playing");
                    isPlaying = true;
                }).catch(e => console.log("Audio play failed:", e));
            }
        });
    }
});

function submitRSVP(status) {
    const urlParams = new URLSearchParams(window.location.search);
    let guestName = urlParams.get("name") || "Gast";

    fetch('/api/rsvp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: guestName, status: status })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById("rsvp-buttons").classList.add("hidden");
            const responseMsg = document.getElementById("response-msg");
            responseMsg.classList.remove("hidden");
            
            if (status === 'accepted') {
                responseMsg.textContent = "Wir freuen uns!";
            } else {
                responseMsg.textContent = "Schade!";
            }
        }
    })
    .catch(err => {
        // Fallback for GitHub Pages without backend
        console.warn("Backend not found, running fallback response");
        document.getElementById("rsvp-buttons").classList.add("hidden");
        const responseMsg = document.getElementById("response-msg");
        responseMsg.classList.remove("hidden");
        
        if (status === 'accepted') {
            responseMsg.textContent = "Wir freuen uns! (Nur Demo)";
        } else {
            responseMsg.textContent = "Schade! (Nur Demo)";
        }
    });
}
