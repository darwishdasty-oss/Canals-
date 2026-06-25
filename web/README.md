# Canals Workbench — Web (iPad Edition)

The same hydraulic engineering calculator that runs as a desktop app,
now in your browser. Works on **iPad, iPhone, Android, Mac, Windows,
Linux, Chromebook** — anything with a modern browser.

## Features
- ✅ All 6 algorithms (Open Channel, Sluice Gate, Lacey, Manning, Flow Profile, Hydraulic Jump, Water Hammer)
- ✅ Touch-friendly sliders and number inputs
- ✅ Real-time charts
- ✅ PDF report downloads
- ✅ No signup, no account, no data leaves your network
- ✅ Add to Home Screen (becomes a PWA-style app)

## Quick start (run on your laptop, access from iPad)

```bash
# 1. Install
pip install -r requirements.txt

# 2. Run
streamlit run app.py

# 3. Find your laptop's IP address
#    Mac/Linux: ifconfig | grep inet
#    Windows:   ipconfig

# 4. On your iPad, open Safari and go to:
#    http://YOUR_LAPTOP_IP:8501
#    (e.g., http://192.168.1.42:8501)
```

## Deploy free to share.streamlit.io

1. Push this repo to GitHub
2. Go to https://share.streamlit.io
3. Click "New app"
4. Pick your repo and `web/app.py`
5. Get a URL like `https://yourname-canals-workbench.streamlit.app`
6. Open that URL on your iPad — bookmark it!

## Run with Docker

```bash
docker build -t canals-workbench-web .
docker run -p 8501:8501 canals-workbench-web
```

Then access from iPad at `http://YOUR_DOCKER_HOST:8501`.
