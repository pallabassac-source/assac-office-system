# ASSAC Attendance & Governance System - Docker Migration Guide

This project has been fully migrated and configured for **Docker** and **Docker Compose**, simplifying deployment, database persistence, and daily maintenance on Windows and LAN networks.

---

## 🏛️ System Architecture in Docker

```
                                  [ Browser / LAN Client ]
                                             │
                                   HTTP Port 80 (or custom)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    Frontend Container (assac_frontend_ui)    │
                      │               Nginx + React SPA              │
                      └───────┬───────────────────────────────┬──────┘
                              │                               │
                      /api/*  │ Reverse Proxy                 │ /uploads/* Reverse Proxy
                              ▼                               ▼
                      ┌──────────────────────────────────────────────┐
                      │    Backend Container (assac_backend_api)     │
                      │             Node.js + Express API            │
                      └───────┬───────────────────────────────┬──────┘
                              │                               │
                       Named Volume                    Named Volume
                      ┌───────▼──────┐                ┌───────▼────────┐
                      │  assac_data  │                │  assac_uploads │
                      │ attendance.db│                │ uploaded files │
                      └──────────────┘                └────────────────┘
```

### Key Improvements Made During Migration
1. **Unified Single-Port Access**: All traffic goes through port 80 (Nginx). Nginx automatically reverse-proxies `/api/` and `/uploads/` directly to the backend container.
2. **Fixed Nginx Trailing-Slash Proxy Bug**: Previous configuration dropped the `/api/` prefix, resulting in 404s. It now correctly passes `/api/` to the Express router.
3. **50 MB Upload Support in Nginx**: Nginx `client_max_body_size` is increased to 50MB so large biometric Excel spreadsheets upload without error.
4. **Resilient Native Module Compilation**: Debian Bookworm Slim backend container now installs build essentials (`python3`, `make`, `g++`) so native modules (`sqlite3`) compile reliably on any host machine.
5. **Safe Database Seeding & Volume Persistence**: The active production SQLite database (with 41 employees, departments, users, and attendance records) is stored in the Docker volume `assac_data`. If the volume is newly created, the system automatically initializes from `backend/seeds/initial_attendance.db` without data loss.
6. **Consistent Uploads Storage**: `UPLOADS_DIR` environment variable guarantees that files uploaded via Multer are stored in `/app/uploads` (the mounted volume `assac_uploads`).
7. **Production Health Checks**: The backend exposes an automated HTTP health check (`/api/health`), and the frontend container waits until the backend is healthy before serving traffic.
8. **Automated Windows Scripts**: One-click `.bat` and PowerShell scripts for starting, stopping, restarting, viewing logs, and backing up data.

---

## 🚀 Quick Start (Running with Docker)

### Prerequisites
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) must be installed and running.

### Option 1: 1-Click Batch Scripts (Easiest)
In the project root folder `d:\attendance-system`:
- **Start the system**: Double-click `docker-start.bat`
- **Stop the system**: Double-click `docker-stop.bat`
- **Restart system**: Double-click `docker-restart.bat`
- **Backup data**: Double-click `docker-backup.bat`
- **View live logs**: Double-click `docker-logs.bat`

---

### Option 2: PowerShell Management CLI
Open PowerShell in `d:\attendance-system`:

```powershell
# Start production containers in background
.\docker-manage.ps1 start

# View container status
.\docker-manage.ps1 status

# Stream live logs
.\docker-manage.ps1 logs

# Create timestamped backup of DB & uploads
.\docker-manage.ps1 backup

# Stop containers safely
.\docker-manage.ps1 stop
```

---

### Option 3: Standard Docker CLI
```powershell
# Build and run containers in background
docker compose up -d --build

# View container status
docker compose ps

# View container logs
docker compose logs -f

# Stop containers
docker compose down
```

---

## 🌐 Accessing the Application

Once started:
- **Web Application Portal**: [http://localhost](http://localhost) (or `http://localhost:80`)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **LAN Access**: Replace `localhost` with your computer's local IP (e.g. `http://192.168.10.117`)

### Default System Accounts
| Role | Username | Default Password | Access Level |
|---|---|---|---|
| **Super Admin** | `superadmin` | `super123` | Complete administrative authority |
| **Office Admin** | `admin` | `admin123` | HR & Biometric management |
| **IMS Admin** | `ims` | `ims123` | Intern onboarding & certificates |
| **Staff Employee** | `employee` | `emp123` | Employee forms & personal records |
| **Research Intern** | `intern` | `intern123` | Intern attendance & deliverables |

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` to `.env` (already created) to customize your configuration:

```ini
# Change frontend port if port 80 is occupied (e.g., IIS or Skype)
FRONTEND_PORT=80

# Change backend API port if needed
BACKEND_PORT=5000

# Node Environment
NODE_ENV=production

# Security Secret
JWT_SECRET=assac_production_super_secret_key_2026
```

> **Tip:** If port 80 is already used by another service on your machine, simply change `FRONTEND_PORT=8080` in `.env`. You can then access the system at `http://localhost:8080`.

---

## 💾 Data Persistence & Backups

### Where is data stored?
Docker manages persistent data in two isolated volumes:
1. `assac_data` / `DATA_VOLUME_PATH`: Contains `/app/data/attendance.db` (all employee profiles, attendance records, users, and audit logs).
2. `assac_uploads` / `STORAGE_VOLUME_PATH`: Contains `/app/uploads/` (all uploaded Excel files, forms, and up to 10 GB intern deliverables).

### 🚀 Mounting the 1.0 TB `/data` Partition (Production IMS Server)
By default, standard named volumes reside in `/var/lib/docker/volumes/` on the OS root partition (`/dev/mapper/localhost--vg-root`, ~208 GB).
To use the high-capacity **1.0 TB dedicated data volume** (`/dev/mapper/vgdata-data` mounted at `/data` with 1017 GB available):

1. **Create directories on the 1.0 TB mount**:
```bash
mkdir -p /data/uploads /data/attendance_db
chmod -R 777 /data/uploads /data/attendance_db
```

2. **Configure `.env`**:
```bash
STORAGE_VOLUME_PATH=/data/uploads
DATA_VOLUME_PATH=/data/attendance_db
```

3. **Restart Docker Containers**:
```bash
docker compose down
docker compose up -d
```
Once restarted, the system stores all files and large uploads directly on `/dev/mapper/vgdata-data`, and the storage status gauge will report **1.0 TB Capacity with 1017 GB Free**.

### How to backup?
Run `docker-backup.bat` or `.\docker-manage.ps1 backup`.
This exports:
- `backups/attendance_backup_YYYYMMDD_HHMMSS.db`
- `backups/uploads_backup_YYYYMMDD_HHMMSS/`

### How to restore a backup into Docker?
```powershell
docker cp backups\attendance_backup_YYYYMMDD_HHMMSS.db assac_backend_api:/app/data/attendance.db
docker compose restart backend
```

---

## 🛠️ Live Development with Docker (Hot-Reloading)

If you want to edit React code or backend code and see changes update live inside Docker:

```powershell
# Start dev compose with volume mounts
.\docker-manage.ps1 dev
# OR:
docker compose -f docker-compose.dev.yml up --build
```
- Frontend runs with Vite on `http://localhost:5173` with instant Hot Module Replacement (HMR).
- Backend runs with `node --watch` on `http://localhost:5000` with instant restart on file change.

---

## ❓ Frequently Asked Questions & Troubleshooting

### Q: "Failed to connect to the docker API / pipe not found"
**Cause:** Docker Desktop is not started on Windows.  
**Fix:** Launch **Docker Desktop** from your Windows Start Menu, wait until the whale icon in the taskbar turns solid (engine running), then run `docker-start.bat`.

### Q: "Port 80 is already in use"
**Cause:** Windows IIS (World Wide Web Publishing Service), Skype, or another web server is listening on port 80.  
**Fix:** Edit `.env` and set `FRONTEND_PORT=3000` or `FRONTEND_PORT=8080`, then restart with `docker-restart.bat`. Access the app at `http://localhost:3000`.

### Q: How do I access this from other office laptops on the LAN?
Find your computer's local IP address (run `ipconfig` in Command Prompt). Look for IPv4 Address (e.g. `192.168.10.117`). Any user on the same Wi-Fi or local network can open `http://192.168.10.117` in their web browser!
