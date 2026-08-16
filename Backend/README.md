# OneClick Backend

Django + Django REST Framework backend for OneClick (Smart Local Service Marketplace).

## Setup

1. Create virtual environment
   python -m venv venv
   venv\Scripts\activate   (Windows)  /  source venv/bin/activate (Mac/Linux)

2. Install dependencies
   pip install -r requirements.txt

3. Create PostgreSQL database named oneclick_db and update .env with your DB password

4. Run migrations
   python manage.py makemigrations
   python manage.py migrate

5. Create superuser
   python manage.py createsuperuser

6. Run server
   python manage.py runserver

API base URL: http://127.0.0.1:8000/api/
Admin panel: http://127.0.0.1:8000/admin/

## Apps
accounts, customers, providers, categories, services, requests, quotations, bookings, payments, tracking, reviews, notifications
