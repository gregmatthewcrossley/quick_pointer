## Production Server Setup

This section covers the initial setup of a production Ubuntu 24.04 server, particularly for hosting providers like Hetzner.

### SSH Security Configuration

To SSH into the production server:
```bash
ssh root@178.156.207.173
```

Production servers often face constant brute force SSH attacks. To prevent these attacks from overwhelming the server or triggering hosting provider DDoS protection:

#### 1. Install and Configure Fail2ban

Fail2ban monitors log files and bans IPs that show malicious signs.

```bash
# Install fail2ban
sudo apt update && sudo apt install -y fail2ban

# Create SSH jail configuration
sudo bash -c 'cat > /etc/fail2ban/jail.d/sshd.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
backend = systemd
journalmatch = _SYSTEMD_UNIT=ssh.service + _SYSTEMD_UNIT=sshd.service
maxretry = 3
findtime = 600
bantime = 3600
ignoreip = 127.0.0.1/8 ::1 YOUR_OFFICE_IP_HERE
EOF'

# Restart fail2ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status sshd
```

This configuration will:
- Ban any IP after 3 failed login attempts within 10 minutes
- Keep them banned for 1 hour
- Always allow localhost and your office IP (replace YOUR_OFFICE_IP_HERE)

**Note**: The `port = ssh` in the configuration will automatically use the port defined in your SSH configuration.

#### 2. Configure Hetzner Cloud Firewall

Before changing the SSH port, ensure the new port is allowed in Hetzner's firewall. Our production server uses these rules:

| Sources | Protocol | Port | Type |
|---------|----------|------|------|
| Your IP/32, Any IPv6 | TCP | 22 | SSH (original) |
| Your IP/32, Any IPv6 | TCP | 5832 | SSH (custom) |
| Any IPv4, Any IPv6 | TCP | 80 | HTTP |
| Any IPv4, Any IPv6 | TCP | 443 | HTTPS |

To add the custom SSH port:
1. Go to Hetzner Cloud Console → Firewalls
2. Add the rule for port 5832 with your IP addresses
3. Apply the firewall to your server

#### 3. Change SSH Port

**Important for Ubuntu 24.04**: This version uses socket activation for SSH, requiring changes to both the socket and service configuration.

After the firewall is configured, change SSH from default port 22 to 5832:

```bash
# Back up SSH configuration
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH configuration
sudo sed -i 's/^#Port 22/Port 5832/' /etc/ssh/sshd_config

# Create systemd override for ssh.socket (DO NOT edit the system file directly)
sudo systemctl edit ssh.socket

# Add these lines in the editor that opens:
[Socket]
ListenStream=
ListenStream=5832

# Save and exit the editor

# Update fail2ban for the new port
sudo sed -i 's/port = ssh/port = 5832/' /etc/fail2ban/jail.d/sshd.local

# Reload systemd and restart services
sudo systemctl daemon-reload
sudo systemctl restart ssh.socket ssh.service
sudo systemctl restart fail2ban

# Verify SSH is listening on the new port
sudo ss -tlnp | grep :5832
```

**Important**: After changing the SSH port, you'll need to:
- Connect using: `ssh -p 5832 user@server`
- Update any deployment scripts to use the new port
- Keep the original port 22 rule in Hetzner firewall temporarily until you confirm the new port works

#### 4. Disable Password Authentication (SSH Keys Only)

After confirming your SSH key works, disable password authentication:

```bash
# Backup current config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup-passwords

# Disable password authentication
sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Add explicit settings
sudo bash -c 'echo "
# Disable password authentication
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM no" >> /etc/ssh/sshd_config'

# Restart SSH
sudo systemctl restart ssh.service

# Verify settings
sudo sshd -T | grep passwordauthentication
```

**Important**: Before doing this, ensure:
- Your SSH key is in `~/.ssh/authorized_keys`
- You have tested logging in with your SSH key
- You have a backup connection method if something goes wrong
