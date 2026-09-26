# BookHaven — 3-Tier AWS Book Shopping Website

A clean, responsive Node.js + Express book shopping application designed for deployment on a 3-tier AWS architecture.

## Architecture

Browser → Application Load Balancer → Node.js EC2 Auto Scaling Group → Amazon RDS MySQL

Optional:
- Jump/Bastion host for private EC2 administration
- S3/CloudFront for static assets
- CloudWatch for monitoring

## Local setup

Requirements:
- Node.js 18+
- MySQL 8+

```bash
npm install
cp .env.example .env
```

Create and seed the database:

```bash
mysql -u root -p < schema.sql
```

Update `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bookhaven
JWT_SECRET=replace_with_a_long_random_secret
```

Run:

```bash
npm start
```

Open:

http://localhost:3000

Health check:

http://localhost:3000/health

## AWS deployment

1. Create VPC and public/private subnets across two AZs.
2. Create ALB security group allowing 80/443.
3. Create application security group allowing TCP 3000 only from ALB-SG.
4. Create RDS security group allowing TCP 3306 only from APP-SG.
5. Create an RDS MySQL instance in a DB subnet group.
6. Import `schema.sql` into RDS.
7. Deploy this app to private EC2 instances.
8. Set `.env` with the RDS endpoint.
9. Run with PM2.
10. Create a target group on port 3000 with `/health`.
11. Create an ALB and forward traffic to the target group.
12. Put the application instances in an Auto Scaling Group.
13. Add HTTPS with ACM after the HTTP deployment is working.

Never commit `.env` or database passwords to GitHub.

## Main API endpoints

- `GET /health`
- `GET /api/books`
- `GET /api/books/:id`
- `GET /api/categories`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/cart`
- `POST /api/cart`
- `DELETE /api/cart/:bookId`
- `POST /api/orders`
- `GET /api/orders`


## Images and S3

Local book-cover assets are in `public/images/`. See `aws/S3-IMAGES.md` for S3/CloudFront deployment.
