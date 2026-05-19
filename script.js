document.addEventListener("DOMContentLoaded", () => {
    const envelopeWrapper = document.getElementById("envelope-wrapper");
    const landingScreen = document.getElementById("landing-screen");
    const contentScreen = document.getElementById("content-screen");
    const guestNameDisplay = document.getElementById("guest-name-display");
    const bgMusic = document.getElementById("bg-music");
    
    // Parse URL parameter ?name=...
    const urlParams = new URLSearchParams(window.location.search);
    let guestName = urlParams.get("name") || "Guest";
    
    // Formatting the name
    if(guestNameDisplay) {
        guestNameDisplay.textContent = `${guestName}`;
    }

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

        // After flap opens (approx 800ms), transition the screens
        setTimeout(() => {
            landingScreen.classList.add("fade-out");
            
            setTimeout(() => {
                landingScreen.classList.add("hidden");
                contentScreen.classList.remove("hidden");
                contentScreen.classList.add("visible");
                
                // Trigger staggered animations for cards
                const animateCards = document.querySelectorAll('.card-animate');
                animateCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, index * 200); // 200ms delay between each block
                });

            }, 1000); // Wait for fade out
        }, 1000); // Wait for flap to open

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
    let guestName = urlParams.get("name") || "Guest";

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
                responseMsg.textContent = "We are so excited!";
            } else {
                responseMsg.textContent = "You will be missed.";
            }
        }
    })
    .catch(err => {
        // Fallback for GitHub Pages without backend
        console.warn("Backend not found, running fallback response");
        document.getElementById("rsvp-section").classList.add("hidden");
        const responseMsg = document.getElementById("response-msg");
        responseMsg.parentElement.classList.remove("hidden");
        
        if (status === 'accepted') {
            responseMsg.textContent = "We are so excited! (Fallback mode)";
        } else {
            responseMsg.textContent = "You will be missed. (Fallback mode)";
        }
    });
}
