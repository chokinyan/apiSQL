# apiSQL

A RESTful API service for SQL database operations.

## Description

apiSQL provides a simple interface to interact with SQL databases through HTTP requests. It allows you to perform CRUD operations on your database without writing raw SQL queries.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/apiSQL.git

# Enter the project directory
cd apiSQL

# Install dependencies
npm install
```

## Usage

Start the server:

```bash
npm start
```

The API will be available at `http://localhost:3000`.

## API Endpoints

### GET /api/tables
Returns a list of all tables in the database.

### GET /api/tables/:tableName
Returns all records from the specified table.

### GET /api/tables/:tableName/:id
Returns a specific record by ID from the specified table.

### POST /api/tables/:tableName
Creates a new record in the specified table.

### PUT /api/tables/:tableName/:id
Updates a specific record in the specified table.

### DELETE /api/tables/:tableName/:id
Deletes a specific record from the specified table.

## License

[MIT](LICENSE)
