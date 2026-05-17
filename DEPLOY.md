# 🚀 HotWebHD — Production Live Deployment Guide

To deploy **HotWebHD** live with **zero bugs, zero glitches, and absolute 100% performance efficiency**, follow this production blueprint. The platform is designed to compile seamlessly and support either serverless platforms (like Vercel) or dedicated VPS hosting (like DigitalOcean, AWS, or Linode).

---

## 💎 Production Environment Variables Checklist

Ensure these variables are set inside your production environment (Vercel Dashboard or VPS `.env` file):

```ini
# Core Security
JWT_SECRET="generate-a-long-random-alphanumeric-string-for-production"

# Database Connection (See below for cloud configuration)
DATABASE_URL="file:./dev.db"

# Cashfree Production Gateway Configs
CASHFREE_APP_ID="your_live_production_app_id"
CASHFREE_SECRET_KEY="your_live_production_secret_key"
CASHFREE_API_VERSION="2023-08-01"
CASHFREE_MODE="production"
```

---

## ⚡ Option A: Serverless Cloud Deployment (Vercel + Supabase/Neon PostgreSQL)

Because Vercel is serverless, its filesystem is read-only and ephemeral. Therefore, **you cannot use SQLite in Vercel production** (your SQLite database file will get wiped out when the serverless function restarts). You must connect a cloud PostgreSQL database.

### Step 1: Spin up a Free Cloud PostgreSQL DB
1. Create a free account on **Supabase** (`https://supabase.com`) or **Neon** (`https://neon.tech`).
2. Create a new project/database, and copy your **Transaction Connection String** (it starts with `postgres://...` or `postgresql://...`).

### Step 2: Switch Prisma to PostgreSQL (1-Minute Switch)
In `prisma/schema.prisma`, change the database provider to `postgresql`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 3: Push Database Schema Live
Run this command from your terminal to deploy your database schemas straight to Supabase/Neon:
```bash
npx prisma db push
```

### Step 4: Seed the Live Database
Populate your cloud database with the default admin and user profiles plus the high-definition film trailers:
```bash
npx tsx prisma/seed.ts
```

### Step 5: Deploy to Vercel
1. Push your code to a private GitHub repository.
2. Link your repository in **Vercel** (`https://vercel.com`).
3. Add your production environment variables (from the checklist above) in Vercel's **Environment Variables** tab.
4. Set the **Build Command** to `prisma generate && next build`.
5. Click **Deploy**! Your site is live on a lightning-fast CDN with a global cloud database!

---

## 🖥️ Option B: Dedicated VPS Deployment (Ubuntu + PM2 + Nginx + SQLite or Postgres)

If you deploy to a VPS (such as a DigitalOcean Droplet, Linode, AWS EC2, or Hostinger), you can **keep using SQLite perfectly** because the VPS has persistent SSD storage.

### Step 1: Install Node.js, Git, and PM2
SSH into your Ubuntu server and run:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js v20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 Process Manager globally
sudo npm install pm2 -g
```

### Step 2: Clone and Setup Code
Clone your repository onto the server:
```bash
git clone <your-repo-url> /var/www/hotwebhd
cd /var/www/hotwebhd

# Install production dependencies
npm install

# Build database schema (using SQLite)
npx prisma db push
npx tsx prisma/seed.ts
```

### Step 3: Configure PM2 for Continuous Background Runtime
Launch the Next.js process in the background. PM2 will keep the server running 24/7 and automatically restart it if the VPS reboots:
```bash
pm2 start npm --name "hotwebhd" -- run start -- -p 3001
pm2 save
pm2 startup
```

### Step 4: Configure Nginx as a Reverse Proxy
Install Nginx to handle incoming traffic and map your custom domain (e.g., `hotwebhd.com`) to `localhost:3001`:
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/hotwebhd
```

Paste this optimized server configuration (replace `yourdomain.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hotwebhd /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Secure Your Domain with Free SSL (HTTPS)
Use Let's Encrypt (Certbot) to instantly generate an SSL certificate for secure checkout locks:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
*(Select Option `2` to automatically redirect all HTTP traffic to secure HTTPS!)*

---

## 🛡️ Live Security & Optimization Recommendations

1.  **JWT Secret Security**: Make sure your `JWT_SECRET` is strong. You can generate a robust key by running:
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
2.  **Verify Production Cashfree Keys**: Ensure your cashfree application mode is `"production"` and the keys start with standard production merchant prefixes (no `TEST` prefixes).
3.  **HMR Build Checks**: Always verify compilation locally via `npm run build` before pushing live to prevent deployment blocks.
