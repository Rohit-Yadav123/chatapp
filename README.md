# Real-Time Chat Application

## This is a real-time chat application built with Django, Django Channels, and PostgreSQL.

## Features
1. Real-time messaging with WebSocket support.
2. User authentication and management.
3. PostgreSQL for data storage.
4. Scalable architecture for modern messaging applications.

## Prerequisites
Before running this application, ensure you have the following installed:

1. Python 3.8 or later
2. PostgreSQL 13 or later
3. Virtual Environment (optional but recommended)

## Create a virtual environment:

python3 -m venv venv

## Activate the virtual environment:

### Linux/Mac:

source venv/bin/activate

### Windows:

venv\Scripts\activate

## Install Dependencies

Install the required packages from requirements.txt:

pip install -r requirements.txt



### Create the database in PostgreSQL if it doesn’t already exist:

CREATE DATABASE <database_name>;

### Create a new user with a password

CREATE USER your_username WITH PASSWORD 'your_password';

### Grant all privileges on a specific database to the user

GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_username;

### Update all the configurations in the config.yml file before running the project.

## Run Migrations

Apply the database migrations:

python manage.py migrate

## Run the Development Server

Start the Django development server:

python manage.py runserver


Happy Learning!
