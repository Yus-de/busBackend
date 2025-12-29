# 🚀 Deployment Guide

Guide for deploying the Bus Ticket Booking Backend to production.

## Prerequisites

- Node.js 16+ installed
- PostgreSQL database (local or cloud)
- Environment variables configured
- Domain name (optional, for production)

---

## Environment Setup

### 1. Production Environment Variables

Create a `.env` file with production values:

```env
NODE_ENV=production
PORT=5000

# Database (use connection pooling in production)
DATABASE_URL=postgresql://user:password@host:5432/bus_db?connection_limit=10

# JWT Secrets (generate strong secrets)
JWT_ACCESS_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Seat Lock
SEAT_LOCK_DURATION=10

# Payment
PAYMENT_WEBHOOK_SECRET=<webhook-secret>
```

### 2. Generate Strong Secrets

```bash
# Generate JWT secrets
openssl rand -base64 32
```

---

## Database Setup

### 1. Create Production Database

```sql
CREATE DATABASE bus_db;
```

### 2. Run Migrations

```bash
npm run prisma:migrate
```

### 3. Create Admin User

```bash
npm run create:admin admin@yourcompany.com secure_password "Admin Name"
```

---

## Deployment Options

### Option 1: Traditional Server (PM2)

#### Install PM2

```bash
npm install -g pm2
```

#### Start Application

```bash
pm2 start src/server.js --name bus-backend
```

#### PM2 Commands

```bash
# View logs
pm2 logs bus-backend

# Restart
pm2 restart bus-backend

# Stop
pm2 stop bus-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

#### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'bus-backend',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

Start with:
```bash
pm2 start ecosystem.config.js
```

---

### Option 2: Docker

#### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "src/server.js"]
```

#### Create .dockerignore

```
node_modules
.env
.git
*.log
```

#### Build and Run

```bash
# Build image
docker build -t bus-backend .

# Run container
docker run -d \
  --name bus-backend \
  -p 5000:5000 \
  --env-file .env \
  bus-backend
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: bus_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/bus_db
      NODE_ENV: production
    depends_on:
      - db
    restart: unless-stopped

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

---

### Option 3: Cloud Platforms

#### Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create bus-backend`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
5. Set environment variables:
   ```bash
   heroku config:set JWT_ACCESS_SECRET=your_secret
   heroku config:set JWT_REFRESH_SECRET=your_secret
   ```
6. Deploy: `git push heroku main`
7. Run migrations: `heroku run npm run prisma:migrate`

#### Railway

1. Connect GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy automatically

#### AWS (EC2 + RDS)

1. Launch EC2 instance
2. Set up RDS PostgreSQL
3. Install Node.js on EC2
4. Clone repository
5. Configure environment variables
6. Use PM2 or systemd to run application
7. Set up Nginx reverse proxy

---

## Reverse Proxy (Nginx)

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### 1. Application Logs

- Use PM2 logs or Docker logs
- Set up log rotation
- Consider using Winston or Pino for structured logging

### 2. Health Checks

Monitor the health endpoint:
```
GET /health
```

### 3. Database Monitoring

- Monitor connection pool
- Set up alerts for slow queries
- Regular backups

### 4. Error Tracking

Consider integrating:
- Sentry
- Rollbar
- LogRocket

---

## Security Checklist

- [ ] Strong JWT secrets
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Database credentials secured
- [ ] Environment variables not committed
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles this)

---

## Performance Optimization

1. **Database Indexing**
   - Add indexes on frequently queried fields
   - Review Prisma schema for optimization

2. **Connection Pooling**
   - Configure PostgreSQL connection pool
   - Use connection string with `?connection_limit=10`

3. **Caching** (Future)
   - Redis for session storage
   - Cache frequently accessed routes

4. **Load Balancing**
   - Use multiple instances with PM2 cluster mode
   - Set up load balancer (Nginx, AWS ALB)

---

## Backup Strategy

### Database Backups

```bash
# Manual backup
pg_dump -U user -d bus_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U user -d bus_db < backup_20240115.sql

# Automated backups (cron)
0 2 * * * pg_dump -U user -d bus_db > /backups/bus_db_$(date +\%Y\%m\%d).sql
```

---

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   npm audit
   npm update
   ```

2. **Database Migrations**
   ```bash
   npm run prisma:migrate
   ```

3. **Monitor Logs**
   - Check for errors
   - Review performance metrics

4. **Backup Verification**
   - Test restore procedures
   - Verify backup integrity

---

## Troubleshooting

### Application Won't Start

1. Check environment variables
2. Verify database connection
3. Check port availability
4. Review application logs

### Database Connection Issues

1. Verify DATABASE_URL format
2. Check firewall rules
3. Verify database credentials
4. Check connection pool limits

### High Memory Usage

1. Enable PM2 cluster mode
2. Review memory leaks
3. Optimize database queries
4. Consider horizontal scaling

---

## Support

For issues or questions:
- Check logs: `pm2 logs` or `docker logs`
- Review error messages
- Check database connectivity
- Verify environment variables

