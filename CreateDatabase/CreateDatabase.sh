#!/bin/bash

# MariaDB database creation script
echo "Creating database from colloc.sql..."

# Default parameters - customize these as needed
read -p "Enter the database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter the database user [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -p "Enter the database password []: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-password}

SQL_FILE="$(dirname "$0")/colloc.sql"

# Create the database using the SQL file
echo "Executing SQL file using MariaDB..."

# Execute the SQL file
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD < "$SQL_FILE"

if [ $? -ne 0 ]; then
    echo "Error: Database creation failed!"
    exit 1
else
    echo "Database created successfully!"
fi

exit 0
