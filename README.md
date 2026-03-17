# Smart-Coop

A Spring Boot 4.0 REST API for managing enterprise cooperatives, backed by PostgreSQL and fully containerized with Docker. This domain-agnostic system supports various cooperative types including Agriculture, Financial, Transport, Artisan, and Service cooperatives.

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Runtime     | Java 25                             |
| Framework   | Spring Boot 4.0.3                   |
| ORM         | Hibernate 7 / Spring Data JPA 4     |
| Database    | PostgreSQL 15                       |
| Build       | Maven (wrapper included)            |
| Containers  | Docker & Docker Compose             |

## Prerequisites

- **Java 25** JDK installed (only needed for local development)
- **Docker** and **Docker Compose** installed and running

## Project Structure

```
smartcoop/
├── .env                        # Environment variables (ports, credentials)
├── docker-compose.yml          # Orchestrates db + app containers
├── Dockerfile                  # Multi-stage build (alternative to buildpacks)
├── pom.xml                     # Maven dependencies & plugins
└── src/main/
    ├── java/com/smartcoop/
    │   ├── SmartcoopApplication.java      # Entry point
    │   ├── controller/                    # REST controllers
    │   ├── dto/                           # Request/Response DTOs
    │   ├── model/                         # JPA entities
    │   ├── repository/                    # Spring Data JPA repositories
    │   ├── service/                       # Business logic
    │   └── security/                      # JWT & Spring Security config
    └── resources/
        ├── application.yaml               # Datasource & Hibernate config
        └── data.sql                       # Seed data for roles
```

## Environment Configuration

All configuration is driven by the `.env` file — no credentials or ports are hardcoded in source files. Review and edit the `.env` file before building if needed.

Minimum email-related variables:

```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@example.com
```

## Build & Run

### Step 1 — Build the Docker Image

```bash
./mvnw spring-boot:build-image -DskipTests \"-Dspring-boot.build-image.imageName=smarcoop:latest"
```

### Step 2 — Start the Services

```bash
docker compose up -d
```

The `app` container waits for the `db` healthcheck to pass before starting.

### Step 3 — Verify

Check container status:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs -f app
```

## Connecting Your Database GUI

Use the values from your `.env` file to connect with DBeaver, pgAdmin, DataGrip, etc. The `cooperatives` table will be in the **public** schema.

---

## API Reference

Base URL: `http://localhost:8080/api/v1`

### Authentication

| Method | Endpoint                      | Auth       | Description                        |
|--------|-------------------------------|------------|------------------------------------|
| POST   | `/auth/setup-super-admin`     | None       | Create the first Super Admin       |
| POST   | `/auth/login`                 | None       | Authenticate and get JWT token     |
| POST   | `/auth/register-coop-admin`   | SUPER_ADMIN| Register a Cooperative Admin       |

### Cooperatives

| Method | Endpoint                           | Auth        | Description                    |
|--------|------------------------------------|-------------|--------------------------------|
| POST   | `/admin/cooperatives`              | SUPER_ADMIN | Register a new cooperative     |

### Public Applications

| Method | Endpoint                       | Auth | Description |
|--------|--------------------------------|------|-------------|
| POST   | `/public/cooperatives/apply`   | None | Guest applies for cooperative registration (saved as INACTIVE) |

`/public/cooperatives/apply` also triggers:
- In-app notifications for Super Admins
- HTML email notifications for Super Admins
- Optional guest acknowledgement email when `guestEmail` is provided

### Catalog (CoopItems) - Domain-Agnostic Item Management

Items represent any trackable commodity or service (e.g., "Coffee Grade A", "Transport Route", "Loan Product").

| Method | Endpoint       | Auth                                | Description                      |
|--------|----------------|-------------------------------------|----------------------------------|
| POST   | `/items`       | COOP_ADMIN                          | Create a new item for the coop   |
| GET    | `/items`       | COOP_ADMIN, FIELD_OFFICER, ACCOUNTANT | List all items for the coop |
| PUT    | `/items/{id}`  | COOP_ADMIN                          | Update an item                   |
| DELETE | `/items/{id}`  | COOP_ADMIN                          | Deactivate an item               |

**Example: Create an Item**

```bash
curl -X POST http://localhost:8080/api/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <COOP_ADMIN_TOKEN>" \
  -d '{
    "name": "Coffee Grade A",
    "unitOfMeasure": "KG",
    "defaultUnitPrice": 5000.00
  }'
```

### Activities (Member Transactions) - Domain-Agnostic Activity Tracking

Activities record member contributions, transactions, or deliveries tied to a CoopItem.

| Method | Endpoint          | Auth                                 | Description                          |
|--------|-------------------|--------------------------------------|--------------------------------------|
| POST   | `/activities`     | COOP_ADMIN, FIELD_OFFICER            | Record a member activity             |
| GET    | `/activities/coop`| COOP_ADMIN, FIELD_OFFICER, ACCOUNTANT | List activities for the cooperative  |
| GET    | `/activities/me`  | MEMBER                               | View my activity history             |

**Example: Record an Activity**

```bash
curl -X POST http://localhost:8080/api/v1/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <FIELD_OFFICER_TOKEN>" \
  -d '{
    "memberId": 3,
    "itemId": 1,
    "metricValue": 150.5,
    "notes": "High quality delivery from Kimironko farm"
  }'
```

### Payments

| Method | Endpoint                          | Auth       | Description                      |
|--------|-----------------------------------|------------|----------------------------------|
| POST   | `/payments/generate/{activityId}` | ACCOUNTANT | Generate payment for an activity |
| GET    | `/payments/pending`                | ACCOUNTANT | List pending payments            |
| PATCH  | `/payments/{id}/pay?reference=`    | ACCOUNTANT | Mark payment as paid             |

### Users

| Method | Endpoint                    | Auth                      | Description                      |
|--------|-----------------------------|---------------------------|----------------------------------|
| POST   | `/users/staff`              | COOP_ADMIN                | Create staff user for coop       |
| GET    | `/users/my-coop`            | COOP_ADMIN                | List staff in my cooperative     |
| GET    | `/users/all`                | SUPER_ADMIN               | List all system users            |
| PATCH  | `/users/{id}/toggle-status` | COOP_ADMIN, SUPER_ADMIN   | Enable/disable a user            |
| DELETE | `/users/{id}`               | COOP_ADMIN, SUPER_ADMIN   | Delete a user                    |

### Members

Members are cooperative users with the MEMBER role. Use the Users API to create members by passing `role: "MEMBER"` in the UserRequest.

**Supported Member Types by Cooperative:**
- **Agriculture:** Farmers, harvest contributors  
- **Transport:** Drivers, logistics coordinators  
- **Financial:** Loan applicants, savers, borrowers  
- **Artisan:** Craftspeople, producers  
- **Service:** Service providers, technicians

### Activities

The Activity module is domain-agnostic and supports various cooperative types (Agriculture, Transport, Financial, etc.). Activities can represent crop deliveries, route logs, service completions, or any measurable member contribution.

| Method | Endpoint          | Auth                                | Description                        |
|--------|-------------------|-------------------------------------|------------------------------------|
| POST   | `/activities`     | COOP_ADMIN, FIELD_OFFICER           | Record a member activity           |
| GET    | `/activities/coop`| COOP_ADMIN, FIELD_OFFICER, ACCOUNTANT | List all activities for my coop   |
| GET    | `/activities/me`  | MEMBER                              | Get my activity history            |

**Activity Types Examples:**
- `CROP_DELIVERY` - Agriculture coops (unit: KG, MT)
- `ROUTE_LOG` - Transport coops (unit: KM, TRIPS)
- `SERVICE_HOURS` - Service coops (unit: HOURS)
- `LOAN_ISSUED` - Financial coops (unit: RWF)
- `PRODUCT_SOLD` - Artisan coops (unit: PIECES)

### Payments

| Method | Endpoint                          | Auth       | Description                      |
|--------|------------------------------------|------------|----------------------------------|
| POST   | `/payments/generate/{activityId}` | ACCOUNTANT | Generate payment for an activity |
| GET    | `/payments/pending`                | ACCOUNTANT | List pending payments            |
| PATCH  | `/payments/{id}/pay?reference=`    | ACCOUNTANT | Mark payment as paid             |

### User Profile

| Method | Endpoint                  | Auth                                    | Description                    |
|--------|---------------------------|-----------------------------------------|--------------------------------|
| GET    | `/profile/me`             | Authenticated                           | Get my profile                 |
| PUT    | `/profile/me`             | Authenticated                           | Update my profile              |
| POST   | `/users/{userId}/profile` | SUPER_ADMIN, COOP_ADMIN, FIELD_OFFICER  | Create profile for a user      |

### Notifications

| Method | Endpoint                          | Auth          | Description                              |
|--------|-----------------------------------|---------------|------------------------------------------|
| GET    | `/notifications/me`               | Authenticated | Get my notifications (newest first)      |
| GET    | `/notifications/me/unread-count` | Authenticated | Get unread notification count            |
| PATCH  | `/notifications/{id}/read`       | Authenticated | Mark a notification as read (owner only) |

---

## Sample Test Data

### 1. Setup Super Admin (First Run Only)

```bash
curl -X POST http://localhost:8080/api/v1/auth/setup-super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "Admin@123",
    "fullName": "System Administrator",
    "email": "admin@smartcoop.rw",
    "phone": "+250788000001"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "superadmin",
    "password": "Admin@123"
  }'
```

Save the returned `token` for subsequent requests.

### 3. Register a Cooperative

```bash
curl -X POST http://localhost:8080/api/v1/admin/cooperatives \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "name": "Kigali Coffee Farmers Cooperative",
    "rcaRegistrationNumber": "RCA-2024-001234",
    "tinNumber": "123456789",
    "category": "COFFEE",
    "type": "AGRICULTURE",
    "province": "Kigali",
    "district": "Gasabo",
    "sector": "Kimironko",
    "representativeName": "Jean Baptiste Uwimana",
    "representativePhone": "+250788100200"
  }'
```

### 3b. Guest Apply for Cooperative (Public)

```bash
curl -X POST http://localhost:8080/api/v1/public/cooperatives/apply \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kigali Coffee Farmers Cooperative",
    "rcaRegistrationNumber": "RCA-2024-001235",
    "tinNumber": "123456780",
    "category": "COFFEE",
    "type": "AGRICULTURE",
    "guestEmail": "guest@example.com",
    "province": "Kigali",
    "district": "Gasabo",
    "sector": "Kimironko",
    "representativeName": "Jeanne Mukamana",
    "representativePhone": "+250788999888"
  }'
```

### 4. Activate a Cooperative

```bash
curl -X PUT http://localhost:8080/api/v1/admin/cooperatives/1/activate \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 5. Register a Cooperative Admin

```bash
curl -X POST http://localhost:8080/api/v1/auth/register-coop-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "username": "coopadmin1",
    "password": "CoopAdmin@123",
    "fullName": "Marie Claire Mukamana",
    "email": "marie@kigalicoffee.rw",
    "phone": "+250788200300",
    "cooperativeId": 1
  }'
```

### 6. Create Staff User (as Coop Admin)

```bash
curl -X POST http://localhost:8080/api/v1/users/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <COOP_ADMIN_TOKEN>" \
  -d '{
    "username": "fieldofficer1",
    "password": "Field@123",
    "email": "emmanuel@kigalicoffee.rw",
    "phone": "+250788300400",
    "role": "FIELD_OFFICER"
  }'
```

### 7. Register a Member (as Coop Admin)

```bash
curl -X POST http://localhost:8080/api/v1/users/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <COOP_ADMIN_TOKEN>" \
  -d '{
    "username": "member001",
    "password": "Member@123",
    "email": "member@kigalicoffee.rw",
    "phone": "+250788400500",
    "role": "MEMBER"
  }'
```

Response: Save the `id` from the response to create a profile.

### 7b. Create Profile for User (as Admin)

```bash
curl -X POST http://localhost:8080/api/v1/users/3/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <COOP_ADMIN_TOKEN>" \
  -d '{
    "fullName": "Jean Pierre Habimana",
    "nationalId": "1199880012345678",
    "address": "KG 123 St, Kimironko, Kigali",
    "dateOfBirth": "1988-05-15",
    "gender": "Male",
    "profilePictureUrl": "https://example.com/photos/member001.jpg"
  }'
```

### 8. Create a Catalog Item

```bash
curl -X POST http://localhost:8080/api/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <COOP_ADMIN_TOKEN>" \
  -d '{
    "name": "Coffee Grade A",
    "unitOfMeasure": "KG",
    "defaultUnitPrice": 5000.00
  }'
```

Response: Save the `id` from the response for activity recording.

### 9. Record an Activity (Member Transaction)

```bash
curl -X POST http://localhost:8080/api/v1/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <FIELD_OFFICER_TOKEN>" \
  -d '{
    "memberId": 3,
    "itemId": 1,
    "metricValue": 150.5,
    "notes": "High quality coffee delivery from Kimironko farm"
  }'
```

### 10. Generate Payment for Activity

```bash
curl -X POST http://localhost:8080/api/v1/payments/generate/1 \
  -H "Authorization: Bearer <ACCOUNTANT_TOKEN>"
```

### 11. Mark Payment as Paid

```bash
curl -X PATCH "http://localhost:8080/api/v1/payments/1/pay?reference=MTN-MM-2024-001" \
  -H "Authorization: Bearer <ACCOUNTANT_TOKEN>"
```

### 12. Get My Activities (Member View)

```bash
curl -X GET http://localhost:8080/api/v1/activities/me \
  -H "Authorization: Bearer <MEMBER_TOKEN>"
```

### 13. List All Cooperative Activities (Staff View)

```bash
curl -X GET http://localhost:8080/api/v1/activities/coop \
  -H "Authorization: Bearer <COOP_ADMIN_TOKEN>"
```

### 14. Get My Profile

```bash
curl -X GET http://localhost:8080/api/v1/profile/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 15. Update My Profile

```bash
curl -X PUT http://localhost:8080/api/v1/profile/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "fullName": "Jean Pierre Habimana",
    "nationalId": "1199880012345678",
    "address": "KG 123 St, Kimironko, Kigali",
    "dateOfBirth": "1988-05-15",
    "gender": "Male",
    "profilePictureUrl": "https://example.com/photos/user123.jpg"
  }'
```

### 16. Get My Notifications

```bash
curl -X GET http://localhost:8080/api/v1/notifications/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 17. Get Unread Notification Count

```bash
curl -X GET http://localhost:8080/api/v1/notifications/me/unread-count \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 18. Mark Notification as Read

```bash
curl -X PATCH http://localhost:8080/api/v1/notifications/1/read \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## User Management Updates (March 2026)

### New: Update User Endpoint

- **Endpoint:** `PUT /api/v1/users/{id}`
- **Auth:** `SUPER_ADMIN`, `COOP_ADMIN`
- **Description:** Update an existing user's details (username, email, phone, role).
- **Request Body Example:**

```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "phone": "+250788123456",
  "role": "FIELD_OFFICER"
}
```
- **Response:** Returns the updated `UserResponse`.

### Notes
- Only fields present in the User entity can be updated (username, email, phone, role).
- Name fields are managed via the UserProfile endpoints.
- Endpoint is secured for admin roles only.

### Example cURL

```bash
curl -X PUT http://localhost:8080/api/v1/users/3 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "username": "updateduser",
    "email": "updated@email.com",
    "phone": "+250788000999",
    "role": "FIELD_OFFICER"
  }'
```

---

## Role Hierarchy

| Role              | Description                                          |
|-------------------|------------------------------------------------------|
| SUPER_ADMIN       | System-level administrator – manages cooperatives    |
| COOP_ADMIN        | Cooperative administrator – manages staff & settings |
| ACCOUNTANT        | Finance officer – manages payments and budgets       |
| FIELD_OFFICER     | Collection center officer – records harvests         |
| QUALITY_INSPECTOR | Quality inspector – grades and approves harvests     |
| MEMBER            | General cooperative member                           |

---

## Useful Commands

### Rebuild After Code Changes

```bash
./mvnw spring-boot:build-image -DskipTests \
  "-Dspring-boot.build-image.imageName=smarcoop:latest"

docker compose up -d --force-recreate app
```

### Full Clean Restart (wipes database)

```bash
docker compose down -v
docker compose up -d
```

### Stop Without Removing Data

```bash
docker compose stop
```

### View Live Logs

```bash
docker compose logs -f app
```

## Hibernate DDL Mode

The current configuration uses `ddl-auto: update`, which keeps existing data and applies schema changes when possible.

If you need a full schema reset during local development, temporarily switch to `create` mode:

1. In `application.yaml`, change `ddl-auto: update` → `ddl-auto: create`
2. In `docker-compose.yml`, change `SPRING_JPA_HIBERNATE_DDL_AUTO: update` → `SPRING_JPA_HIBERNATE_DDL_AUTO: create`
3. Rebuild the image and restart

| Mode          | Behavior                                        |
|---------------|-------------------------------------------------|
| `create`      | Drops and recreates tables on every startup     |
| `update`      | Alters tables to match entities (keeps data)    |
| `validate`    | Validates schema only, makes no changes         |
| `none`        | Does nothing — use with Flyway/Liquibase        |
