# Database

Run `../schema.sql` against local MySQL or Amazon RDS MySQL.

For RDS, use the endpoint as `DB_HOST` in `.env`.

Example:

mysql -h <rds-endpoint> -u admin -p < schema.sql
