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

            // Musik direkt beim Öffnen des Umschlags starten
            if (bgMusic && !isPlaying) {
                bgMusic.volume = 0.5;
                bgMusic.play().then(() => {
                    if (vinylBtn) vinylBtn.classList.add("playing");
                    isPlaying = true;
                }).catch(e => console.log("Auto-play blocked by browser:", e));
            }

            // Notify server that it was opened
            if (guestName) {
                fetch('/api/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: guestName, opened: true })
                }).catch(err => console.error("Error updating status:", err));
            }

            // After flap opens, transition the screens
            setTimeout(() => {
                landingScreen.classList.add("fade-out");

                setTimeout(() => {
                    landingScreen.classList.add("hidden");
                    contentScreen.classList.remove("hidden");
                    contentScreen.classList.add("visible");

                    // Trigger scroll-based animations
                    observeSections();
                }, 1000);
            }, 1000);
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

// Intersection Observer for scroll-based fade-in
function observeSections() {
    const sections = document.querySelectorAll('.section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, {
        threshold: 0.15
    });

    sections.forEach(section => {
        observer.observe(section);
    });
}

function submitRSVP(status) {
    const urlParams = new URLSearchParams(window.location.search);
    let guestName = urlParams.get("name") || "Gast ohne Namen";

    // Buttons verstecken, damit nicht doppelt geklickt wird
    document.getElementById("rsvp-buttons").classList.add("hidden");
    const responseMsg = document.getElementById("response-msg");
    responseMsg.classList.remove("hidden");
    responseMsg.textContent = "Speichere Antwort...";

    // Prüfen, ob Firebase geladen wurde
    if (window.firebaseDB && window.firebaseAddDoc) {
        window.firebaseAddDoc(window.firebaseCollection(window.firebaseDB, "rsvps"), {
            name: guestName,
            status: status,
            timestamp: window.firebaseServerTimestamp()
        }).then(() => {
            // Erfolgreich gespeichert!
            if (status === 'accepted') {
                responseMsg.textContent = "Wir freuen uns auf euch!";
            } else {
                responseMsg.textContent = "Schade, ihr werdet uns fehlen!";
            }
        }).catch(err => {
            console.error("Firebase Fehler: ", err);
            responseMsg.textContent = "Speichern fehlgeschlagen. Bitte sagt uns per WhatsApp Bescheid!";
        });
    } else {
        console.error("Firebase ist nicht initialisiert.");
        responseMsg.textContent = "Datenbank-Fehler. Bitte sagt uns per WhatsApp Bescheid!";
    }
}
