import json
import os
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 3000
DB_FILE = "database.json"
PUBLIC_DIR = "."

def read_db():
    if not os.path.exists(DB_FILE):
        return {"guests": {}}
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {"guests": {}}

def write_db(data):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

class InviteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        if self.path == "/api/guests":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            db = read_db()
            self.wfile.write(json.dumps(db.get("guests", {})).encode("utf-8"))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path in ["/api/status", "/api/rsvp"]:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))
            
            name = data.get("name")
            if not name:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "Name required"}')
                return

            db = read_db()
            if name not in db["guests"]:
                db["guests"][name] = {"opened": False, "status": "pending"}

            if self.path == "/api/status":
                opened = data.get("opened")
                if opened is not None:
                    db["guests"][name]["opened"] = opened
            
            elif self.path == "/api/rsvp":
                status = data.get("status")
                if status:
                    db["guests"][name]["opened"] = True
                    db["guests"][name]["status"] = status

            write_db(db)
            
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"success": true}')
        else:
            self.send_error(404, "Endpoint not found")

if __name__ == "__main__":
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, InviteHandler)
    print(f"Server is running on http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
