document.addEventListener("DOMContentLoaded", () => {
    const envelopeWrapper = document.getElementById("envelope-wrapper");
    const guestNameEl = document.getElementById("guest-name");
    const bgMusic = document.getElementById("bg-music");
    
    // Parse URL parameter ?name=...
    const urlParams = new URLSearchParams(window.location.search);
    let guestName = urlParams.get("name") || "Gast";
    
    // Formatting the name
    guestNameEl.textContent = `Liebe(r) ${guestName},`;

    let opened = false;

    // Open envelope event
    envelopeWrapper.addEventListener("click", () => {
        if (opened) return;
        
        envelopeWrapper.classList.add("open");
        opened = true;
        
        // Play music (might be blocked by browser policy without user interaction, 
        // but since they clicked the envelope, it should be fine).
        bgMusic.volume = 0.5;
        bgMusic.play().catch(e => console.log("Audio play failed:", e));

        // Notify server that it was opened
        fetch('/api/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: guestName, opened: true })
        }).catch(err => console.error("Error updating status:", err));
    });
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
            document.getElementById("rsvp-section").classList.add("hidden");
            const responseMsg = document.getElementById("response-msg");
            responseMsg.parentElement.classList.remove("hidden");
            
            if (status === 'accepted') {
                responseMsg.textContent = "Wir freuen uns auf dich!";
            } else {
                responseMsg.textContent = "Schade, dass du nicht dabei sein kannst.";
            }
        }
    })
    .catch(err => console.error("Error submitting RSVP:", err));
}
