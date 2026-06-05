document.addEventListener("DOMContentLoaded", () => {
    const envelopeWrapper = document.getElementById("envelope-wrapper");
    const landingScreen = document.getElementById("landing-screen");
    const contentScreen = document.getElementById("content-screen");

    const guestNameDisplay = document.getElementById("guest-name-display");
    const bgMusic = document.getElementById("bg-music");
    const vinylBtn = document.getElementById("vinyl-btn");

    // Parse URL parameter ?name=... or ?name1=...&name2=...
    const urlParams = new URLSearchParams(window.location.search);
    const name1 = urlParams.get("name1");
    const name2 = urlParams.get("name2");
    let guestName = "";

    if (name1 && name2) {
        guestName = `${name1} & ${name2}`;
    } else {
        guestName = urlParams.get("name") || name1;
    }

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
                                const calendarOptions = document.getElementById("calendar-options");
                                if (calendarOptions) calendarOptions.classList.remove("hidden");
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

            // After flap opens (800ms), transition the screens
            setTimeout(() => {
                landingScreen.classList.add("fade-out");
                
                // Sofort einblenden und Scrollen freigeben, während die Landingpage ausblendet
                contentScreen.classList.remove("hidden");
                contentScreen.classList.add("visible");
                document.body.classList.remove("no-scroll");

                // Scroll-Animationen direkt triggern
                observeSections();

                setTimeout(() => {
                    landingScreen.classList.add("hidden");
                }, 1200); // Entspricht der Fade-Out Dauer (1.2s)
            }, 800);
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

function handleZusageClick() {
    const urlParams = new URLSearchParams(window.location.search);
    const name1 = urlParams.get("name1");
    const name2 = urlParams.get("name2");
    
    if (name1 && name2) {
        // Paarknöpfe beschriften
        document.getElementById("btn-attendee-1").textContent = `${name1} kommt`;
        document.getElementById("btn-attendee-2").textContent = `${name2} kommt`;
        
        document.getElementById("rsvp-buttons").classList.add("hidden");
        document.getElementById("couple-selection").classList.remove("hidden");
    } else {
        document.getElementById("rsvp-buttons").classList.add("hidden");
        document.getElementById("meal-selection").classList.remove("hidden");
    }
}

let attendee1Attending = true;
let attendee2Attending = true;
let guest1Meal = "";
let guest2Meal = "";

function toggleAttendee(num) {
    if (num === 1) {
        attendee1Attending = !attendee1Attending;
        const btn = document.getElementById("btn-attendee-1");
        if (attendee1Attending) btn.classList.add("selected");
        else btn.classList.remove("selected");
    } else {
        attendee2Attending = !attendee2Attending;
        const btn = document.getElementById("btn-attendee-2");
        if (attendee2Attending) btn.classList.add("selected");
        else btn.classList.remove("selected");
    }
}

function confirmCoupleAttendance() {
    if (!attendee1Attending && !attendee2Attending) {
        alert("Bitte wähle mindestens eine Person aus, die zusagt. Wenn niemand kommt, klicke bitte auf 'Absagen'.");
        return;
    }
    
    // Verstecke die Paarauswahl-Frage
    document.getElementById("couple-selection").classList.add("hidden");
    
    // Blende Essensauswahl ein
    document.getElementById("couple-meal-selection").classList.remove("hidden");
    
    const urlParams = new URLSearchParams(window.location.search);
    const name1 = urlParams.get("name1") || "Person 1";
    const name2 = urlParams.get("name2") || "Person 2";
    
    const row1 = document.getElementById("guest1-meal-row");
    const row2 = document.getElementById("guest2-meal-row");
    
    // Zuvor getroffene Auswahlen löschen
    guest1Meal = "";
    guest2Meal = "";
    document.querySelectorAll("#couple-meal-selection .meal-option-row button").forEach(btn => {
        btn.classList.remove("selected");
    });
    
    // Schnitzel-Config-Panels zurücksetzen/verstecken
    const config1 = document.getElementById("schnitzel-config-guest1");
    const config2 = document.getElementById("schnitzel-config-guest2");
    if (config1) config1.classList.add("hidden");
    if (config2) config2.classList.add("hidden");
    
    if (attendee1Attending) {
        row1.classList.remove("hidden");
        document.getElementById("guest1-row-title").textContent = `Hauptgang für ${name1}:`;
    } else {
        row1.classList.add("hidden");
    }
    
    if (attendee2Attending) {
        row2.classList.remove("hidden");
        document.getElementById("guest2-row-title").textContent = `Hauptgang für ${name2}:`;
    } else {
        row2.classList.add("hidden");
    }
}

// Status für Schnitzel-Optionen:
// Index 0: Einzelgast
// Index 1: Person 1 (Paar)
// Index 2: Person 2 (Paar)
const schnitzelConfig = {
    0: { type: 'Klassisch', style: 'Lintorfer-Krüstchen', side: 'Pommes' },
    1: { type: 'Klassisch', style: 'Lintorfer-Krüstchen', side: 'Pommes' },
    2: { type: 'Klassisch', style: 'Lintorfer-Krüstchen', side: 'Pommes' }
};

// Beschreibungstexte für die Zubereitungsarten
const schnitzelStyleDescriptions = {
    'Lintorfer-Krüstchen': 'Mit einem Spiegelei und Salat',
    'Jägerschnitzel': 'Mit deftiger Champignon-Rahmsauce',
    'Wiener Art': 'Der Klassiker mit Preiselbeeren',
    'Schnitzel wie von Oma': 'Mit einem Spiegelei und Schmorzwiebeln'
};

function setSchnitzelOpt(index, field, value, btnElement) {
    schnitzelConfig[index][field] = value;
    
    // Aktiven Button optisch hervorheben
    const row = btnElement.parentElement;
    row.querySelectorAll("button").forEach(btn => btn.classList.remove("selected"));
    btnElement.classList.add("selected");
    
    // Beschreibungstext live aktualisieren
    if (field === 'style') {
        const descEl = document.getElementById(`schnitzel-desc-text-${index}`);
        if (descEl) {
            descEl.textContent = schnitzelStyleDescriptions[value] || '';
        }
    }
    
    // Wenn es sich um ein Paar handelt, den ausgewählten Text aktualisieren
    if (index === 1) {
        guest1Meal = `Schnitzel (${schnitzelConfig[1].type}, ${schnitzelConfig[1].style}, ${schnitzelConfig[1].side})`;
    } else if (index === 2) {
        guest2Meal = `Schnitzel (${schnitzelConfig[2].type}, ${schnitzelConfig[2].style}, ${schnitzelConfig[2].side})`;
    }
}

function showSchnitzelConfig(index, btnElement) {
    const mealButtons = btnElement.parentElement;
    mealButtons.querySelectorAll(".meal-btn-card").forEach(btn => btn.classList.remove("selected"));
    btnElement.classList.add("selected");
    
    const configPanel = document.getElementById("schnitzel-config-single");
    if (configPanel) configPanel.classList.remove("hidden");
}

function hideSingleSchnitzelConfig() {
    const configPanel = document.getElementById("schnitzel-config-single");
    if (configPanel) configPanel.classList.add("hidden");
}

function submitSingleSchnitzel() {
    const mealText = `Schnitzel (${schnitzelConfig[0].type}, ${schnitzelConfig[0].style}, ${schnitzelConfig[0].side})`;
    submitRSVP('accepted', mealText, 1);
}

function selectMeal(guestNum, meal, btnElement) {
    const row = btnElement.parentElement;
    row.querySelectorAll(".meal-btn-card").forEach(btn => {
        btn.classList.remove("selected");
    });
    btnElement.classList.add("selected");
    
    const configId = `schnitzel-config-guest${guestNum}`;
    const configPanel = document.getElementById(configId);

    if (meal === 'Schnitzel') {
        if (configPanel) configPanel.classList.remove("hidden");
        if (guestNum === 1) {
            guest1Meal = `Schnitzel (${schnitzelConfig[1].type}, ${schnitzelConfig[1].style}, ${schnitzelConfig[1].side})`;
        } else {
            guest2Meal = `Schnitzel (${schnitzelConfig[2].type}, ${schnitzelConfig[2].style}, ${schnitzelConfig[2].side})`;
        }
    } else {
        if (configPanel) configPanel.classList.add("hidden");
        if (guestNum === 1) {
            guest1Meal = meal;
        } else {
            guest2Meal = meal;
        }
    }
}

function submitCoupleRSVP() {
    const urlParams = new URLSearchParams(window.location.search);
    const name1 = urlParams.get("name1") || "Person 1";
    const name2 = urlParams.get("name2") || "Person 2";

    let count = 0;
    let parts = [];
    let attendingNamesList = [];
    
    if (attendee1Attending) {
        if (!guest1Meal) {
            alert(`Bitte wähle einen Hauptgang für ${name1} aus!`);
            return;
        }
        parts.push(`${name1}: ${guest1Meal}`);
        attendingNamesList.push(name1);
        count++;
    }
    
    if (attendee2Attending) {
        if (!guest2Meal) {
            alert(`Bitte wähle einen Hauptgang für ${name2} aus!`);
            return;
        }
        parts.push(`${name2}: ${guest2Meal}`);
        attendingNamesList.push(name2);
        count++;
    }
    
    const combinedMeal = parts.join(" | ");
    const attendingNames = attendingNamesList.join(" & ");
    submitRSVP('accepted', combinedMeal, count, attendingNames);
}

function submitRSVP(status, meal = "", guestsCount = 1, attendingNames = "") {
    const urlParams = new URLSearchParams(window.location.search);
    const name1 = urlParams.get("name1");
    const name2 = urlParams.get("name2");
    
    let guestName = "";
    if (name1 && name2) {
        guestName = `${name1} & ${name2}`;
    } else {
        guestName = urlParams.get("name") || name1 || "Gast ohne Namen";
    }
    
    const isCouple = (name1 && name2) || urlParams.get("guests") === "2";

    // Bei einer Absage die passende Personenanzahl festlegen
    if (status === 'declined') {
        guestsCount = isCouple ? 2 : 1;
        attendingNames = ""; // Keiner kommt
    } else if (!attendingNames) {
        attendingNames = guestName; // Standardmäßig kommt der eingeladene Einzelgast
    }

    // Alle möglichen Buttons und Auswahlen verstecken
    document.getElementById("rsvp-buttons").classList.add("hidden");
    document.getElementById("meal-selection").classList.add("hidden");
    document.getElementById("couple-selection").classList.add("hidden");
    document.getElementById("couple-meal-selection").classList.add("hidden");
    
    const responseMsg = document.getElementById("response-msg");
    responseMsg.classList.remove("hidden");
    responseMsg.textContent = "Speichere Antwort...";

    // Prüfen, ob Firebase geladen wurde
    if (window.firebaseDB && window.firebaseAddDoc) {
        window.firebaseAddDoc(window.firebaseCollection(window.firebaseDB, "rsvps"), {
            name: guestName,
            attendingNames: attendingNames, // Namen derer, die tatsächlich zugesagt haben
            status: status,
            meal: meal, // Das gewählte Essen (bei Paaren kombiniert, z.B. Erika: Rinderfilet | Max: Vegetarisch)
            guestsCount: guestsCount, // Anzahl der Personen, die zu- oder absagen
            timestamp: window.firebaseServerTimestamp()
        }).then(() => {
            // Erfolgreich gespeichert!
            if (status === 'accepted') {
                responseMsg.textContent = "Wir freuen uns auf euch!";
                const calendarOptions = document.getElementById("calendar-options");
                if (calendarOptions) calendarOptions.classList.remove("hidden");
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

// Kalender-Funktion: Lädt die .ics Datei herunter (am besten für iOS/Apple & Outlook)
function addToCalendar() {
    window.location.href = "invite.ics";
}

// Google Kalender-Funktion (öffnet den Google Kalender direkt im Web/App)
function addToGoogleCalendar() {
    const url = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Hochzeit+von+Max+%26+Nadja&dates=20260826T080000Z/20260826T220000Z&details=Wir+heiraten%21%0A%0A10%3A00+Uhr%3A+Standesamt+Ratingen+%28Minoritenstra%C3%9Fe+2a%2C+40878+Ratingen%29%0AAnschlie%C3%9Fend%3A+Gastst%C3%A4tte+Meck+%28Lintorfer+Markt+18%2C+40885+Lintorf%29%0A%0AWir+freuen+uns+sehr+auf+euch%21&location=Minoritenstra%C3%9Fe+2a%2C+40878+Ratingen%2C+Deutschland";
    window.open(url, "_blank");
}

// Maps-Funktion: Öffnet die native Maps-App (Apple Maps auf iOS, Google Maps auf Android/PC) ohne Login-Zwang
function openMaps(location) {
    if (location === 'standesamt') {
        const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
        const address = "Minoritenstraße 2a, 40878 Ratingen, Germany";
        let url = "";
        if (isIOS) {
            // Öffnet Apple Maps App direkt auf Apple Geräten
            url = "https://maps.apple.com/?q=" + encodeURIComponent(address);
        } else {
            // Die standardisierte Google Maps API-URL startet auf Android direkt die Maps-App und verlangt KEIN Login
            url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
        }
        window.open(url, "_blank");
    } else {
        // Gaststätte Meck: Direktlink auf den Google Maps Eintrag
        window.open("https://maps.app.goo.gl/56SDxuUPBQt5r1NT7", "_blank");
    }
}

window.openMaps = openMaps;
window.addToCalendar = addToCalendar;
window.addToGoogleCalendar = addToGoogleCalendar;
window.setSchnitzelOpt = setSchnitzelOpt;
window.showSchnitzelConfig = showSchnitzelConfig;
window.hideSingleSchnitzelConfig = hideSingleSchnitzelConfig;
window.submitSingleSchnitzel = submitSingleSchnitzel;
