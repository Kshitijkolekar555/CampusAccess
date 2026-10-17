# CampusAccess Gate Deployment & Operational Guide

This document outlines the step-by-step setup required to operate the **CampusAccess Gate Security Terminal** at your college main entrance.

---

## 1. Quick Start (Single-Click Launch)

Run `start-gate-station.bat` at the repository root. This automatically starts:
- **FastAPI Face Recognition Microservice**: `http://localhost:8001`
- **Spring Boot Security Backend**: `http://localhost:8081`
- **Gate Web Terminal Frontend**: `http://localhost:3002`

Ensure MySQL is running on port `3306` (`acampusaccessdb`).

---

## 2. Client-Side Photo Compression Architecture

To ensure high performance and prevent filling up server storage with 500+ daily visitors:
- **Max Dimensions**: Scaled down automatically on the browser canvas to a bounding box of **800x800 px** while preserving aspect ratio.
- **Encoding**: Compressed to `image/jpeg` at **0.78 quality**.
- **File Size**: Each photo is reduced from **~2.5 MB down to ~60 KB - 90 KB** (a 96% reduction in payload).
- **Neural Compatibility**: The OpenCV YuNet & SFace models internally detect and extract 128-D vectors at 320x320 resolution. 800px provides crisp facial feature definition with zero loss in recognition accuracy.

---

## 3. Remote Tablet & Laptop Camera Access over Campus Wi-Fi

Modern browsers (**Google Chrome**, **Microsoft Edge**, **Safari**) **block access to the webcam (`navigator.mediaDevices.getUserMedia`)** if the connection is NOT `localhost` or `HTTPS`.

If security guards use a separate tablet, laptop, or phone over the local network (e.g. `http://192.168.1.100:3002`), use either of the following two standard deployment methods:

### Method A: Chrome Insecure Origin Flag (Fastest & Zero Setup)
On the guard's tablet or laptop:
1. Open Google Chrome.
2. Navigate to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
3. Enable the flag and enter the server's LAN address, e.g.:
   ```
   http://192.168.1.100:3002,http://192.168.1.100:8081
   ```
4. Click **Relaunch**. Chrome will now permit webcam access just like `localhost`.

### Method B: Nginx SSL Reverse Proxy (Recommended for Production)
Install Nginx on the server host with a self-signed or internal CA certificate:
```nginx
server {
    listen 443 ssl;
    server_name gate.campus.internal;

    ssl_certificate     /etc/ssl/certs/campusaccess.crt;
    ssl_certificate_key /etc/ssl/private/campusaccess.key;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8081/api/;
    }

    location /uploads/ {
        proxy_pass http://localhost:8081/uploads/;
    }
}
```

---

## 4. Production Checklist

- [x] Client-side automatic canvas compression enabled (max 800x800, quality 0.78)
- [x] Spring Boot multipart file limit set to 10MB
- [x] Relative `/uploads/` paths enabled (no hardcoded localhost in avatars)
- [x] Single-gate workflow streamlined (redundant gate selects removed)
- [x] Single-click launcher `start-gate-station.bat` created
- [x] Outpasses consolidated under **Gate & Ops**
