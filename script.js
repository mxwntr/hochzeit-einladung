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

    // ZUGRIFFSKONTROLLE: Wenn kein Name vorhanden ist, Seite sperren
    if (!guestName) {
        const noAccessScreen = document.getElementById("no-access-screen");
        if (noAccessScreen) {
            noAccessScreen.classList.remove("hidden");
        }
        if (landingScreen) {
            landingScreen.classList.add("hidden");
        }
        return; // Ausführung hier stoppen!
    }

    // Formatting the name
    if (guestNameDisplay && guestName) {
        guestNameDisplay.textContent = `Für ${guestName}`;
    }

    // Prüfen, ob dieser Gast bereits geantwortet hat
    function checkExistingRSVP() {
        if (window.firebaseDB && window.firebaseQuery) {
            const q = window.firebaseQuery(
                window.firebaseCollection(window.firebaseDB, "rsvps"),
                window.firebaseWhere("name", "==", guestName),
                window.firebaseLimit(1)
            );
            window.firebaseGetDocs(q).then((querySnapshot) => {
                if (!querySnapshot.empty) {
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        const rsvpButtons = document.getElementById("rsvp-buttons");
                        const responseMsg = document.getElementById("response-msg");
                        if (rsvpButtons && responseMsg) {
                            rsvpButtons.classList.add("hidden");
                            responseMsg.classList.remove("hidden");
                            if (data.status === 'accepted') {
                                responseMsg.textContent = "Du hast bereits zugesagt. Wir freuen uns auf euch!";
                                const calendarBtn = document.getElementById("calendar-btn");
                                if (calendarBtn) calendarBtn.classList.remove("hidden");
                            } else {
                                responseMsg.textContent = "Du hast bereits abgesagt. Schade!";
                            }
                        }
                    });
                }
            }).catch(err => console.error("Fehler beim Prüfen der bestehenden Zusage:", err));
        } else {
            // Falls Firebase noch nicht fertig geladen ist, kurz warten und nochmal versuchen
            setTimeout(checkExistingRSVP, 100);
        }
    }
    checkExistingRSVP();

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
                    if (vinylBtn) {
                        vinylBtn.classList.add("playing");
                        const playBtn = vinylBtn.querySelector(".play-btn");
                        if (playBtn) playBtn.textContent = "❚❚";
                    }
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
            const playBtn = vinylBtn.querySelector(".play-btn");
            if (isPlaying) {
                bgMusic.pause();
                vinylBtn.classList.remove("playing");
                if (playBtn) playBtn.textContent = "▶";
                isPlaying = false;
            } else {
                bgMusic.volume = 0.5;
                bgMusic.play().then(() => {
                    vinylBtn.classList.add("playing");
                    if (playBtn) playBtn.textContent = "❚❚";
                    isPlaying = true;
                }).catch(e => console.log("Audio play failed:", e));
            }
        });

        // Event listener für das Ende des Lieds
        bgMusic.addEventListener("ended", () => {
            vinylBtn.classList.remove("playing");
            const playBtn = vinylBtn.querySelector(".play-btn");
            if (playBtn) playBtn.textContent = "▶";
            isPlaying = false;
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
                const calendarBtn = document.getElementById("calendar-btn");
                if (calendarBtn) calendarBtn.classList.remove("hidden");
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

// Kalender-Download Funktion (.ics)
function downloadCalendarEvent() {
    const calendarContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Max und Nadja//Hochzeit//DE",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:hochzeit-max-nadja-2026",
        "DTSTAMP:20260519T120000Z",
        "DTSTART;TZID=Europe/Berlin:20260826T100000",
        "DTEND;TZID=Europe/Berlin:20260826T235900",
        "SUMMARY:Hochzeit von Max & Nadja",
        "DESCRIPTION:Wir freuen uns riesig auf euch!\\n\\nAblauf:\\n- 10:00 Uhr: Standesamt Ratingen\\n- Anschliessend: Restaurante Milano in Ratingen Lintorf",
        "LOCATION:Standesamt Ratingen, Ratingen, Deutschland",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([calendarContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Hochzeit_Max_und_Nadja.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
