# Musik für die Einladung

In diesem Ordner kannst du deine eigene MP3-Datei für die Hintergrundmusik ablegen!

Damit dein Lied auf der Webseite abgespielt wird:
1. Kopiere deine Audio-Datei (z.B. `unser-lied.mp3`) in diesen Ordner.
2. Öffne die Datei `index.html` im Hauptverzeichnis deines Projekts.
3. Suche ziemlich weit oben im Code nach dem `<audio>` Block. Der sieht aktuell so aus:
   ```html
   <audio id="bg-music" loop>
       <source src="https://cdn.pixabay.com/.../audio_f823e2fb7c.mp3" type="audio/mpeg">
   </audio>
   ```
4. Ersetze den langen Link im `src="..."` Attribut durch den Pfad zu deinem Lied.

**Beispiel:**
```html
<audio id="bg-music" loop>
    <source src="audio/unser-lied.mp3" type="audio/mpeg">
</audio>
```
