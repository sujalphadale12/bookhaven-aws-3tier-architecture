# S3 Product Images

Book cover assets are in `public/images/`.

Upload them with:

```bash
aws s3 sync public/images/ s3://YOUR-BUCKET/book-images/
```

For production, prefer CloudFront + Origin Access Control rather than making the whole bucket public.

The SQL seed uses `/images/*.svg` for local development. For S3/CloudFront, update the `cover_url` values in `books` to your CloudFront image URLs.
