# AWS 3-Tier Deployment

## Target architecture

Internet → ALB → private EC2 Node.js instances → private RDS MySQL.

Recommended components:
- VPC
- 2 public subnets for ALB
- 2 private application subnets for EC2
- 2 private database subnets for RDS
- ALB
- Target Group on port 3000
- Auto Scaling Group
- RDS MySQL
- Jump/Bastion host or SSM for administration
- CloudWatch
- ACM for HTTPS

## Security groups

ALB-SG:
- TCP 80 from 0.0.0.0/0
- TCP 443 from 0.0.0.0/0 when HTTPS is enabled

APP-SG:
- TCP 3000 from ALB-SG
- SSH 22 only from Jump-SG if using SSH

RDS-SG:
- TCP 3306 from APP-SG only

Do not make RDS public.

## Application server

```bash
npm install
cp .env.example .env
nano .env
npm start
```

For production process management:

```bash
sudo npm install -g pm2
pm2 start server.js --name bookhaven
pm2 save
pm2 startup
```

Health check:
`GET /health`

## Important

Do not commit `.env` or private keys to GitHub.
