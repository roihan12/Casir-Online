# Casir-Online Deployment Guide

This guide will walk you through deploying the Casir-Online application. 

The architecture is split to optimize for your 2GB RAM / 2 CPU VPS:
- **Frontend** is deployed on **Vercel** for optimal performance and easy CI/CD.
- **Backend Services** (API, WhatsApp integration, Face Recognition, Monitoring) run on your **VPS** using Docker Compose.
- **Database** is hosted on **Supabase**.
- **Cache** is hosted on **Upstash Redis**.

---

## Prerequisites

- **GitHub Repository** with your code.
- **Vercel Account** linked to your GitHub.
- **VPS** with at least 2GB RAM / 2 CPU, running Ubuntu 22.04 or 24.04 (recommended), and with a static IP address.
- **Supabase Account** with a PostgreSQL database created.
- **Upstash Account** with a Redis database created.

---

## Phase 1: Vercel Frontend Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." > "Project"**.
2. Import your GitHub repository.
3. In the "Configure Project" step, set the "Framework Preset" to **Vite** (if it isn't auto-detected).
4. Unfold "Environment Variables" and add the following:
   - `VITE_API_BASE_URL`: `http://<YOUR_VPS_IP>:3000/api` (Replace `<YOUR_VPS_IP>` with your actual VPS IP, or your domain if you set one up).
   - Any other frontend specific variables you might have.
5. Click **"Deploy"**. Vercel will build and deploy your frontend.
6. Once deployed, note down the **Vercel URL** (e.g., `https://casir-online.vercel.app`). You will need this for the backend CORS settings.

---

## Phase 2: VPS Setup & Optimization

Because your VPS has 2GB of RAM, running multiple Docker containers (including the monitoring stack) can quickly exhaust the memory and cause the server to crash (Out-Of-Memory/OOM).

To prevent this, **you MUST create a Swap file** (Virtual RAM).

1. **SSH into your VPS:**
   ```bash
   ssh root@<YOUR_VPS_IP> DAU2j2k@mjzzJNH DAU2j2k@mjzzJNH
   ```

2. **Create a 4GB Swap File:**
   Run the following commands one by one to create and enable swap:
   ```bash
   fallocate -l 4G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   ```

3. **Make the Swap permanent (survive reboots):**
   ```bash
   echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
   ```

4. **Verify Swap is active:**
   ```bash
   free -h
   ```
   *You should now see Swap space of 4.0Gi available alongside your memory.*

5. **Install Docker & Docker Compose:**
   Follow the official Docker installation guide for Ubuntu or run this convenience script:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

---

## Phase 3: Security & Server Hardening (Industrial Setup)

For an industrial-grade production environment, you must secure your VPS to prevent unauthorized access and attacks.

1. **Create a non-root User (Highly Recommended):**
   Running everything as root is dangerous. Create a dedicated user:
   ```bash
   adduser casir-admin
   usermod -aG sudo casir-admin
   rsync --archive --chown=casir-admin:casir-admin ~/.ssh /home/casir-admin
   ```
   *For the rest of the guide (and in your CI/CD), use `casir-admin` or another non-root user.*

2. **Configure UFW (Uncomplicated Firewall):**
   Only allow traffic on necessary ports.
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh     # Or your custom SSH port
   sudo ufw allow http    # Port 80 for NGINX
   sudo ufw allow https   # Port 443 for NGINX/Certbot
   sudo ufw enable
   ```

3. **Secure SSH Configuration:**
   Edit the SSH config file: `sudo nano /etc/ssh/sshd_config`
   - Change `PermitRootLogin yes` to `PermitRootLogin no` (Ensure you created the user in step 1 first!)
   - Change `PasswordAuthentication yes` to `PasswordAuthentication no` (Ensure you have SSH keys set up!)
   - *(Optional)* Change `Port 22` to a custom port to reduce bot scanners (e.g., `Port 2222`). If you do this, remember to allow it in UFW (`sudo ufw allow 2222`).
   
   Restart SSH to apply changes: 
   ```bash
   sudo systemctl restart sshd
   ```

4. **Install Fail2Ban (Protection against brute-force):**
   ```bash
   sudo apt update && sudo apt install fail2ban -y && sudo systemctl enable fail2ban && sudo systemctl start fail2ban
   ```

5. **Enable Unattended Upgrades:**
   Ensures your server automatically installs critical security patches.
   ```bash
   sudo apt install unattended-upgrades -y && sudo dpkg-reconfigure --priority=low unattended-upgrades
   ```

---

## Phase 4: Project Configuration on VPS

1. **Clone your repository:**
   ```bash
   git clone https://github.com/<YOUR_GITHUB_USERNAME>/Casir-Online.git
   cd Casir-Online
   ```

2. **Setup the `.env` file:**
   - Copy the example config or create a new one:
     ```bash
     cp .env.production.example .env.production
     # OR just edit the server folder one directly depending on where you store it
     nano server/.env
     ```
   - **Crucial variables you MUST set:**
     - `DATABASE_URL`: Your Supabase connection string.
     - `DIRECT_URL`: Your Supabase direct connection string (if applicable for Prisma).
     - `REDIS_URL`: Your Upstash Redis connection string.
     - `ALLOWED_ORIGINS`: Your Vercel domain (e.g., `https://casir-online.vercel.app`).
     - *All other existing required secrets (JWT, Midtrans, etc).*

---

## Phase 5: Initial Backend Deployment

1. **Start the specific VPS Docker Compose file:**
   ```bash
   # Run the custom compose file we created for the VPS constraints
   docker compose -f docker-compose.vps.yml up -d --build
   ```

2. **Verify it's running:**
   ```bash
   docker compose -f docker-compose.vps.yml ps
   ```
   *You should see nginx, server, whatsapp, face-recognition, and the monitoring stack running.*

3. **Check Logs (Optional but recommended):**
   ```bash
   docker compose -f docker-compose.vps.yml logs -f server
   ```

---

## Phase 6: CI/CD Setup using GitHub Actions

We have configured a GitHub Actions workflow `.github/workflows/deploy-vps.yml` that will:
1. Run Integration Tests using Vitest and a temporary Postgres Testcontainer.
2. Automatically deploy the backend to your VPS if the tests pass.

To make this work, you must add the following **Repository Secrets** in your GitHub repository:

1. Go to your repository on GitHub.
2. Navigate to **Settings > Secrets and variables > Actions > New repository secret**.
3. Add the following secrets:

| Secret Name | Description |
| :--- | :--- |
| `SSH_HOST` | The IP Address of your VPS (e.g., `123.45.67.89`) |
| `SSH_USER` | Your SSH username (usually `root` or `casir-admin`) |
| `SSH_PORT` | *(Optional)* Custom SSH Port if you changed it during server hardening setup (Default is `22`) |
| `SSH_KEY` | Your **Private** SSH Key (`-----BEGIN RSA PRIVATE KEY-----...`). *Make sure this key is authorized on your VPS (`~/.ssh/authorized_keys`).* |

### Authorizing the SSH Key (if you haven't already):
If you only login to your VPS via password or don't have a dedicated key pair for GitHub, do this on your local machine or VPS:
```bash
# Generate a new key inside the VPS (no passphrase)
ssh-keygen -t rsa -b 4096 -C "github-actions"

# Add the public key to authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# Display the private key, copy the ENTIRE output, and paste it into GitHub for SSH_KEY
cat ~/.ssh/id_rsa
```

Now, every time you push to the `main` branch (specifically changes to the `server`, `face-recognition`, or `docker` files), GitHub Actions will run the tests and deploy your code automatically!
