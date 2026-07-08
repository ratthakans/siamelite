import http.server, socketserver, os, sys

ROOT = "/Users/ratthakan/Desktop/Siam Elite"
PORT = int(os.environ.get("PORT", "4612"))
os.chdir(ROOT)

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a):
        sys.stderr.write("%s - %s\n" % (self.address_string(), a[0] % a[1:]))

with socketserver.TCPServer(("127.0.0.1", PORT), H) as httpd:
    print("Serving %s on http://127.0.0.1:%d" % (ROOT, PORT), flush=True)
    httpd.serve_forever()
