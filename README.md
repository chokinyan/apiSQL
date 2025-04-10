# apiSQL

A RESTful API service for SQL database operations.

## Description

apiSQL provides a simple interface to interact with SQL databases through HTTP requests. It allows you to perform CRUD operations on your database without writing raw SQL queries.

## Installation

```bash
# Clone the repository
git clone https://github.com/chokinyan/apiSQL.git

# Enter the project directory
cd apiSQL

# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory of the project and add the following environment variables:

```
DB_HOST=localhost       # Database server hostname
DB_USER=username        # Database username
DB_PASSWORD=password    # Database password
DB_DATABASE=database_name     # Database name
DB_PORT=3306            # Database server port (default: 3306 for MySQL)
DB_USER_TABLE=users          # Main table name for authentication
DB_USER_COLLUM=username # Column name for username/email in authentication table
DB_PASSWORD_COLLUM=password # Column name for password in authentication table
DB_AOUTH_TABLE
DB_ITEM_TABLE
DB_USER_NAME_COLLUM
```

## Usage

Start the server:

```bash
npm start
```

The API will be available at `http://localhost:3000`.

## License

[MIT](LICENSE)
