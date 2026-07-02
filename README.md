# 📦 Shop Inventory & AI Forecasting System

## 📌 Overview
This is a full-stack **Shop Inventory Management and AI Forecasting System** designed to help businesses manage products, sales, purchases, stock, and suppliers while providing intelligent demand forecasting and decision support using a Python AI engine.

The system combines traditional inventory management with AI-powered analytics to improve stock decisions, reduce waste, and optimize profit.

---

## 🚀 Key Features

### 📊 Inventory Management
- Product management
- Category management
- Supplier management
- Stock tracking and stock adjustments

### 💰 Business Operations
- Sales management
- Purchase management
- Profit calculation dashboard
- Activity log for tracking system actions

### 📈 Analytics & Insights
- Sales analytics dashboard
- Inventory performance metrics
- Profit and loss insights

### 🤖 AI Forecasting System
A multi-layer AI engine built in Python with 5 core layers:

- **Forecasting Engine**
  - Uses Prophet model for demand prediction
- **Decision Engine**
  - Suggests optimal stock actions
- **Risk Engine**
  - Evaluates inventory and business risks using mathematical models
- **Alert Engine**
  - Detects low stock and demand anomalies
- **Explanation Engine**
  - Explains AI decisions in human-readable form



---

## 🧠 AI Architecture
The AI system is designed as a layered pipeline:

1. Data preprocessing
2. Forecasting (Prophet model)
3. Decision-making logic (business rules + mathematical formulation)
4. Explanation generation
5. Alert detection system
6. Risk analysis engine

---

## 🧱 Tech Stack

### Backend
- Laravel (REST API & business logic)

### Frontend
- React.js with Inertia.js

### AI Engine
- Python
- Prophet (time series forecasting)
- NumPy / Pandas
- Custom business logic layers

### Database
- MySQL

---

## 🗄️ Core Modules

- Products
- Categories
- Users & Roles
- Suppliers
- Purchases
- Sales
- Stock Adjustments
- Activity Logs
- AI Forecasting Analytics Dashboard
- Profit Page
- Dashboard

---

## ⚙️ System Architecture

Frontend (React + Inertia)
        ↓
Laravel Backend (API + Business Logic)
        ↓
MySQL Database
        ↓
Python AI Engine (Forecasting + Decision System)

---

### API Communication

Laravel communicates with Python AI engine via REST API:

Input: sales + inventory data
Output: forecast, decision, alerts, risk analysis

---


### 📸 Screenshots

(Add your dashboard screenshots here)

---

### 🎯 Project Goals
Improve inventory efficiency
Reduce stock wastage
Increase profit prediction accuracy
Provide AI-driven business decisions

---


### ## 📄 License

This project is for educational and portfolio purposes.

###  👨‍💻 Author

sebrina musbah
---


## 📦 Installation

### 1. Clone repository
```bash
git clone https://github.com/yourusername/shop-inventory-forecasting.git
cd shop-inventory-forecasting
---


2. Install Laravel dependencies
```bash
composer install

3. Install frontend dependencies
npm install
npm run dev

4. Environment setup
cp .env.example .env
php artisan key:generate

5. Database setup
php artisan migrate
php artisan db:seed

6. Run backend server
php artisan serve

🤖 AI Engine Setup

The AI engine runs separately using Python.

cd python-ai
pip install -r requirements.txt
python app.py
---



