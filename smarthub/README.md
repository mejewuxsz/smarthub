# SmartHub Docker Project

A containerized PHP web application with MySQL database using Docker.

## Prerequisites

- Docker Desktop
- Git

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smarthub.git
cd smarthub
```

2. Start the containers:
```bash
docker compose up -d
```

3. Access the application:
- Web application: http://localhost:8080
- Database: localhost:3307
  - Username: smarthub_user
  - Password: smarthub_password
  - Database: smartstudyhub

## Project Structure

```
smarthub/
├── Dockerfile          # PHP application container configuration
├── docker-compose.yml  # Multi-container Docker composition
├── index.php          # Main application file
├── test_table.php     # Database connection test
└── sql/              # SQL initialization scripts
```

## Features

- PHP 8.2 with Apache
- MySQL 8.0 Database
- Docker Compose configuration
- Volume mounting for development
- Custom network configuration

## Development

The project uses Docker volumes for development:
- Application files are mounted at `/var/www/html`
- MySQL data is persisted in a named volume
- SQL initialization scripts can be placed in `./sql`

## Environment Variables

### PHP Application
- DB_HOST=db
- DB_USER=smarthub_user
- DB_PASSWORD=smarthub_password
- DB_NAME=smartstudyhub

### MySQL Database
- MYSQL_DATABASE=smartstudyhub
- MYSQL_USER=smarthub_user
- MYSQL_PASSWORD=smarthub_password
- MYSQL_ROOT_PASSWORD=root_password

## Docker Commands

```bash
# Build and start containers
docker compose up -d

# View container logs
docker compose logs

# Stop containers
docker compose down

# Rebuild containers
docker compose up -d --build
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 