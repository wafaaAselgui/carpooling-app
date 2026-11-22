# Morocco Carpool (Covoiturage Maroc) 

A modern, mobile-first intercity carpooling platform tailored specifically for Moroccan travelers, drivers, and daily commuters. The application connects verified drivers offering seats across national highway corridors with passengers seeking comfortable, cost-effective travel.

---

## Key Features

### Highway Corridor & Route Discovery
- **Moroccan City Matrix:** Instant categorized city selection across all 12 regions of Morocco (Casablanca-Settat, Rabat-Salé-Kénitra, Marrakech-Safi, Tanger-Tétouan-Al Hoceïma, Fès-Meknès, Souss-Massa, Oriental, and southern provinces).
- **OSRM Integration:** Real-time road route geometry generation and direct road distance calculations using the Open Source Routing Machine.
- **Corridor Compatibility Engine:** Intelligently matches passenger requests with trips passing along their highway corridor (within 45 km radius).
- **Custom Vector Markers:** Crisp SVG-based departure and destination pins matching the platform's signature Dragon Fruit color palette.

###  Mobile-First User Experience
- **List vs. Map Segment Switcher:** Fluid mobile toggling between scheduled ride cards and interactive maps to eliminate scroll trapping on small viewports.
- **Thumb-Friendly Touch Targets:** All inputs, dropdowns, and interactive buttons comply with the 44px touch-target accessibility standard.
- **Adaptive Responsive Tables:** Automatic conversion of dense desktop tables into touch-friendly cards on mobile devices (`DriverTrips.jsx`).

###  Safety, Verification & Platform Trust
- **Driver Credential Verification:** Verification system requiring administrative review of Moroccan National Identity Cards (CIN).
- **Vehicle Document Verification:** Inspection workflow for vehicle registration cards (*Carte Grise*) and active insurance policies, distinguished by the custom "Vehicle Verified" badge.
- **Two-Way Ratings & Reviews:** Drivers and passengers can exchange ratings and written feedback once journeys are marked completed.
- **Platform Moderation & In-App Reports:** Integrated reporting modal allowing users to report suspicious trips, profiles, or abusive reviews directly to site administrators.

---

##  Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, React-Bootstrap, React Router v6 |
| **Mapping & GIS** | Leaflet, React-Leaflet, OpenStreetMap, OSRM API, Nominatim |
| **Backend API** | Laravel 11, PHP 8.2+, Laravel Sanctum |
| **Database** | MySQL / MariaDB with Eloquent ORM |
| **Styling & Icons** | Custom Dragon Fruit Design Tokens, Bootstrap 5, SVG Icons |

---

## 📂 Project Architecture

```text
morocco-carpool/
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/     # Auth, Trip, Booking, Vehicle, Review controllers
│   │   ├── Models/               # User, Trip, Vehicle, Booking, Review, Report
│   │   └── Policies/             # Authorization policies
│   ├── database/
│   │   ├── factories/            # TripFactory, VehicleFactory, UserFactory
│   │   ├── migrations/           # Database schema migrations
│   │   └── seeders/              # DatabaseSeeder (pre-populated Moroccan mock data)
│   └── routes/
│       └── api.php               # RESTful API route definitions
└── frontend/
    ├── src/
    │   ├── components/           # TripCard, TripRouteMap, TripLocationPickerMap, ReportModal
    │   ├── context/              # AuthContext (authentication & session management)
    │   ├── data/                 # moroccoPlaces.js (regional cities & coordinate lookup)
    │   ├── pages/                # Trips, CreateTrip, DriverTrips, TripDetails, Profile, Admin
    │   ├── services/             # Axios API service clients
    │   └── utils/                # geoUtils.js, mapIcons.js
    └── package.json
```

---

##  Getting Started

### Prerequisites
- **PHP** $\ge$ 8.2 with OpenSSL, PDO, Mbstring, and Tokenizer extensions
- **Composer** $\ge$ 2.0
- **Node.js** $\ge$ 18.0 and **npm**
- **MySQL** $\ge$ 8.0 (or MariaDB)

---

### Backend Setup (Laravel API)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Composer dependencies:
   ```bash
   composer install
   ```

3. Prepare environment configuration:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. Configure your database connection in `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=carpooling
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password
   ```

5. Run migrations and populate initial seed data:
   ```bash
   php artisan migrate:fresh --seed
   ```

6. Generate the public storage link for avatars and vehicle documents:
   ```bash
   php artisan storage:link
   ```

7. Start the local API server:
   ```bash
   php artisan serve
   ```
   *The backend will be live at `http://127.0.0.1:8000`.*

---

### Frontend Setup (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Configure your local frontend environment variables in `.env`:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will be running at `http://localhost:5173`.*

---

##  Default Test Accounts

Running `php artisan migrate:fresh --seed` creates the following accounts for immediate testing:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@carpool.ma` | `admin123` | Full administrative console access & moderation |
| **Verified Driver** | `driver@carpool.ma` | `password123` | Verified Dacia Duster with active scheduled trips |


