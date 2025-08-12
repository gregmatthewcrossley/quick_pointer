# Quick Pointer - Kamal Deployment Guide

## Prerequisites

1. **Docker Hub Account**
   - Create an account at https://hub.docker.com
   - Go to Account Settings → Security
   - Create a new Access Token
   - Save the username and access token for later

2. **Server Access**
   - Ensure you have root SSH access to 178.156.207.173
   - Server should have Docker installed (Kamal will install it if missing)

## Deployment Steps

1. **Set Environment Variables**
   ```bash
   export DOCKER_USERNAME="your-docker-hub-username"
   export DOCKER_PASSWORD="your-docker-hub-access-token"
   ```

2. **Initial Server Setup**
   ```bash
   kamal server bootstrap
   ```

3. **Build and Deploy**
   ```bash
   kamal deploy
   ```

4. **Check Status**
   ```bash
   kamal app logs
   kamal app containers
   ```

## Useful Commands

- **View logs**: `kamal app logs -f`
- **Open console**: `kamal console`
- **Open shell**: `kamal shell`
- **Redeploy**: `kamal deploy`
- **Rollback**: `kamal rollback [version]`

## DNS Configuration Required

**Before deploying**, add this DNS record to your dinnerbell.design domain:
```
quickpointer.dinnerbell.design A 178.156.207.173
```

## Accessing Your App

Once deployed, your app will be available at:
- https://quickpointer.dinnerbell.design (SSL via Let's Encrypt)

## Configuration Details

- **Service**: quick_pointer  
- **Server**: 178.156.207.173 (Hetzner)
- **Registry**: Docker Hub
- **SSL**: Disabled (can be enabled with domain)
- **Database**: SQLite (in-memory cache storage)
- **Volumes**: Persistent storage mounted for app data

## Troubleshooting

- Check server connectivity: `kamal server details`
- View configuration: `kamal config`
- Check Docker status: `kamal server details`
- View deployment history: `kamal app versions`