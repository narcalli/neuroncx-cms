# AWS Amplify Deployment Guide

This document guides you through deploying the Payload CMS blog to AWS Amplify with MongoDB Cloud database and S3 for media storage.

## Prerequisites

- AWS Account with Amplify, S3, and IAM access
- GitHub repository with this codebase pushed
- MongoDB Atlas account (free tier available)
- Node.js 20+ and pnpm installed locally

## Step 1: Set Up MongoDB Cloud Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (M0 free tier is suitable for demos)
3. Create a database user with a strong password
4. Whitelist all IP addresses (0.0.0.0/0) for development or specific Amplify IPs for production
5. Get the connection string in the format: `mongodb+srv://username:password@cluster.mongodb.net/database-name`
6. Store the connection string securely - you'll use it later

## Step 2: Create S3 Bucket and IAM User

### Create S3 Bucket

1. Go to AWS S3 console
2. Click "Create bucket"
3. Name: `blog-payloadcms-demo` (must be globally unique)
4. Region: Same as your Amplify app (e.g., `us-east-1`)
5. **Block Public Access**: Leave all options UNCHECKED (media needs to be accessible)
6. Create bucket

### Add Bucket Policy

1. Go to bucket Settings > Permissions > Bucket Policy
2. Add this policy (replace `blog-payloadcms-demo` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::blog-payloadcms-demo/*"
    }
  ]
}
```

### Create IAM User for Media Uploads

1. Go to IAM > Users > Create user
2. Name: `payload-cms-user`
3. Go through the steps, attach inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::blog-payloadcms-demo",
        "arn:aws:s3:::blog-payloadcms-demo/*"
      ]
    }
  ]
}
```

4. Create access key and store credentials:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### Create CloudFront Distribution (Optional)

For better performance with images:

1. Go to CloudFront > Create distribution
2. Origin domain: Your S3 bucket (`blog-payloadcms-demo.s3.amazonaws.com`)
3. Origin access: "Origin Access Control Settings" (recommended)
4. Allowed HTTP methods: GET, HEAD, PUT, POST, PATCH, DELETE (for uploads)
5. Create distribution
6. Get the distribution domain name (e.g., `d123456.cloudfront.net`)

## Step 3: Generate Secrets

Generate three secure secrets for production:

```bash
# Using OpenSSL (macOS/Linux)
openssl rand -hex 24  # Run 3 times for each secret
```

Store these securely:
- `PAYLOAD_SECRET`
- `CRON_SECRET`
- `PREVIEW_SECRET`

## Step 4: Deploy to Amplify

### Connect Repository

1. Go to AWS Amplify > Create new app > Host web app
2. Select GitHub and authorize Amplify
3. Select your repository and branch (`main`)
4. Click Next

### Configure Build Settings

1. Accept the default build settings (or manually upload `amplify.yml`)
2. Click Next

### Add Environment Variables

1. In Amplify console, go to App Settings > Environment variables
2. Add the following variables:

```
DATABASE_URL = mongodb+srv://username:password@cluster.mongodb.net/blog-db?retryWrites=true&w=majority
PAYLOAD_SECRET = [your-generated-secret]
CRON_SECRET = [your-generated-secret]
PREVIEW_SECRET = [your-generated-secret]
NEXT_PUBLIC_SERVER_URL = https://[your-app-id].amplifyapp.com
AWS_REGION = us-east-1
AWS_ACCESS_KEY_ID = [from IAM user]
AWS_SECRET_ACCESS_KEY = [from IAM user]
S3_BUCKET = blog-payloadcms-demo
CLOUDFRONT_DOMAIN = [optional: your CloudFront domain]
```

3. Save

### Deploy

1. The app should automatically build and deploy
2. Check deployment progress in Amplify console
3. Once complete, note your Amplify URL: `https://[your-app-id].amplifyapp.com`

## Step 5: Access Your Blog

1. Navigate to `https://[your-app-id].amplifyapp.com`
2. Go to `/admin` to access Payload CMS admin panel
3. Admin credentials need to be created on first setup

## Step 6: Create Initial Content (Manual)

Since we removed the seed endpoint, create content manually:

1. Go to `/admin/collections/users` and create an admin user
2. Go to `/admin/collections/posts` and create sample blog posts
3. Go to `/admin/collections/pages` and create a landing/home page
4. Go to `/admin/globals/header` to configure navigation
5. Upload images via Media collection (files will go to S3)

## Monitoring & Troubleshooting

### Check Build Logs

1. Amplify console > App details > Deployments
2. Click latest deployment to see logs
3. Common issues:
   - `DATABASE_URL` not set or invalid MongoDB Atlas IP whitelist
   - S3 bucket not accessible (missing bucket policy or IAM permissions)
   - Build timeouts (increase Node memory in Amplify settings)

### Check Application Logs

1. Amplify console > Monitoring > Logs
2. CloudWatch Logs show runtime errors

### Test Payload CMS Connection

```bash
# Local test with production credentials
DATABASE_URL="mongodb+srv://..." PAYLOAD_SECRET="..." npm run build
```

## Performance Optimization (Optional)

### Enable CloudFront for Images

Update `next.config.ts` to use CloudFront domain for image optimization:

```typescript
remotePatterns: [
  {
    hostname: 'd123456.cloudfront.net',
    protocol: 'https',
  },
]
```

### Configure Image Caching in S3

1. S3 bucket > Properties > Static website hosting → Enable
2. Set cache headers when uploading (handled by Payload plugin)

### Monitor Costs

1. AWS Cost Explorer tracks S3 and Amplify usage
2. Expected costs:
   - Amplify: ~$5-10/month with low traffic
   - S3: <$1/month with <1GB data
   - MongoDB Atlas: Free tier sufficient for blogs

## Custom Domain

1. Amplify console > App settings > Domain management
2. Add custom domain (e.g., `blog.mysite.com`)
3. Follow DNS setup instructions for your registrar

## Team Collaboration

For team access from other machines:

1. Commit changes to GitHub
2. Create `.env.local` or `.env` with test/dev credentials only
3. CI/CD will use Amplify's environment variables

Never commit actual secrets to the repository.
