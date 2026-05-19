document.addEventListener("DOMContentLoaded", () => {
    const envelopeWrapper = document.getElementById("envelope-wrapper");
    const landingScreen = document.getElementById("landing-screen");
    const contentScreen = document.getElementById("content-screen");
    
    const guestNameDisplay = document.getElementById("guest-name-display");
    const bgMusic = document.getElementById("bg-music");
    const vinylBtn = document.getElementById("vinyl-btn");
    
    // Parse URL parameter ?name=...
    const urlParams = new URLSearchParams(window.location.search);
    let guestName = urlParams.get("name");
    
    // Formatting the name
    if (guestNameDisplay && guestName) {
        guestNameDisplay.textContent = `Für ${guestName}`;
    }

    let opened = false;
    let isPlaying = false;

    // Open envelope event
    if (envelopeWrapper) {
        envelopeWrapper.addEventListener("click", () => {
            if (opened) return;
            
            envelopeWrapper.classList.add("open");
            opened = true;

            // Notify server that it was opened (if name is provided)
            if (guestName) {
                fetch('/api/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: guestName, opened: true })
                }).catch(err => console.error("Error updating status:", err));
            }

            // After flap opens (approx 800ms), transition the screens
            setTimeout(() => {
                landingScreen.classList.add("fade-out");
                
                setTimeout(() => {
                    landingScreen.classList.add("hidden");
                    contentScreen.classList.remove("hidden");
                    contentScreen.classList.add("visible");
                }, 1000); // Wait for fade out
            }, 1000); // Wait for flap to open
        });
    }

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
