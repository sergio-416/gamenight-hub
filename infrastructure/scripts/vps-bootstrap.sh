#!/usr/bin/env bash
# First-time VPS bootstrap script for GameNight Hub
# Run as root on a fresh Ubuntu 24.04 VPS
# Usage: bash vps-bootstrap.sh

set -euo pipefail

DOMAIN="gamenight-hub.com"
APP_DIR="/opt/gamenight-hub"
APP_USER="gamenight"
EMAIL="admin@gamenight-hub.com"

echo "==> Updating system packages..."
apt-get update -y && apt-get upgrade -y

echo "==> Installing required packages..."
apt-get install -y curl git ufw fail2ban

echo "==> Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

echo "==> Creating application user..."
useradd -m -s /bin/bash "$APP_USER" || true
usermod -aG docker "$APP_USER"

echo "==> Setting up SSH key for $APP_USER..."
mkdir -p /home/"$APP_USER"/.ssh
cp /root/.ssh/authorized_keys /home/"$APP_USER"/.ssh/authorized_keys 2>/dev/null || true
chown -R "$APP_USER:$APP_USER" /home/"$APP_USER"/.ssh
chmod 700 /home/"$APP_USER"/.ssh
chmod 600 /home/"$APP_USER"/.ssh/authorized_keys 2>/dev/null || true

echo "==> Creating application directory..."
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo "==> Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Creating .env file template..."
cat > "$APP_DIR/.env" <<'ENVEOF'
# PostgreSQL
POSTGRES_DB=gamenight_hub
POSTGRES_USER=CHANGE_ME
POSTGRES_PASSWORD=CHANGE_ME

# Redis
REDIS_PASSWORD=CHANGE_ME

# Firebase Admin SDK
FIREBASE_PROJECT_ID=CHANGE_ME
FIREBASE_CLIENT_EMAIL=CHANGE_ME
FIREBASE_PRIVATE_KEY=CHANGE_ME

# Backend
FRONTEND_URL=https://gamenight-hub.com
ENVEOF

echo "==> Stopping any service on port 80 (needed for standalone cert)..."
systemctl stop nginx 2>/dev/null || true
docker compose -f "$APP_DIR/compose.prod.yaml" down 2>/dev/null || true

echo "==> Setting up SSL with Certbot (Let's Encrypt) — standalone mode for first cert..."
apt-get install -y certbot
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" || true

echo "==> Setting up Certbot auto-renewal (webroot mode for renewals)..."
cat > /etc/cron.d/certbot-renew <<'CRONEOF'
0 3 * * * root certbot renew --quiet --webroot -w /var/www/certbot --deploy-hook "docker compose -f /opt/gamenight-hub/compose.prod.yaml exec nginx nginx -s reload"
CRONEOF

echo "    NOTE: First cert uses --standalone (port 80 must be free)."
echo "    Renewals use --webroot with /var/www/certbot (nginx serves /.well-known/acme-challenge)."

echo "==> Hardening SSH..."
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

echo ""
echo "==> Bootstrap complete!"
echo ""
echo "Next steps:"
echo "  1. Edit $APP_DIR/.env with your actual secrets"
echo "  2. Copy compose.prod.yaml to $APP_DIR/"
echo "  3. Copy infrastructure/nginx/conf.d/ to $APP_DIR/infrastructure/nginx/conf.d/"
echo "  4. Run: cd $APP_DIR && docker compose -f compose.prod.yaml up -d"
echo "  5. Add GitHub Actions secrets: VPS_HOST, VPS_USER, VPS_SSH_KEY"
