# AI-Powered Recipe Generator & Meal Planner

A full-stack recipe generator and meal planner application.

Users can enter ingredients and dietary preferences, generate recipe ideas using Gemini, save recipes, rate them, write feedback, and view basic statistics.

The project is built as a working demonstrable solution for an AI team task.

---

## Tech Stack

- Frontend: React + Vite
- Backend: FastAPI
- Database: PostgreSQL
- AI Integration: Gemini API
- Containerization: Docker Compose

---

## Main Features

- Generate recipes from ingredients
- Support dietary preferences
- Save generated recipes
- View saved recipes
- Delete saved recipes
- Add rating and feedback
- View statistics
- Fallback recipe generation if Gemini API key is not available

---

## Project Structure

    ai-recipe-meal-planner/
    ├── backend/
    │   ├── app/
    │   │   ├── database.py
    │   │   ├── gemini_service.py
    │   │   ├── main.py
    │   │   ├── models.py
    │   │   └── schemas.py
    │   ├── tests/
    │   ├── Dockerfile
    │   └── requirements.txt
    ├── frontend/
    │   ├── src/
    │   │   ├── App.jsx
    │   │   └── App.css
    │   ├── Dockerfile
    │   └── package.json
    ├── docker-compose.yml
    ├── .env.example
    ├── .gitignore
    └── README.md

---

## How to Run the Project

### 1. Open the project folder

    cd ai-recipe-meal-planner

### 2. Create the environment file

    cp .env.example .env

Open `.env` and add your Gemini API key if available:

    GEMINI_API_KEY=your_gemini_api_key_here
    GEMINI_MODEL=gemini-2.5-flash

If you do not have a Gemini API key, leave it empty:

    GEMINI_API_KEY=
    GEMINI_MODEL=gemini-2.5-flash

The app will still work using fallback recipe generation.

### 3. Start the project

    docker compose up --build

This command starts:

- React frontend
- FastAPI backend
- PostgreSQL database

### 4. Open the app

Frontend:

    http://localhost:5173

Backend API documentation:

    http://localhost:8000/docs

Backend health check:

    http://localhost:8000/health

---

## API Endpoints

### Health Check

    GET /health

Example response:

    {
      "status": "ok"
    }

### Generate Recipes

    POST /api/recipes/generate

Example request:

    {
      "ingredients": ["tomato", "cheese", "bread"],
      "dietary_preferences": "vegetarian",
      "meal_plan_days": 1
    }

Example response:

    {
      "recipes": [
        {
          "title": "Simple Tomato Bowl",
          "instructions": "Use tomato, cheese, bread. Chop the ingredients, cook them together with basic seasoning, and serve warm.",
          "meal_type": "lunch"
        }
      ],
      "source": "fallback"
    }

The `source` value can be:

- `gemini`
- `fallback`

### Save Recipe

    POST /api/recipes

Example request:

    {
      "title": "Simple Tomato Bowl",
      "ingredients": ["tomato", "cheese", "bread"],
      "dietary_preferences": "vegetarian",
      "instructions": "Use tomato, cheese, bread. Chop the ingredients, cook them together with basic seasoning, and serve warm.",
      "meal_type": "lunch",
      "source": "fallback"
    }

### View Saved Recipes

    GET /api/recipes

Optional pagination:

    GET /api/recipes?page=1&page_size=10

### Delete Recipe

    DELETE /api/recipes/{id}

Example:

    DELETE /api/recipes/1

### Add Rating and Feedback

    PATCH /api/recipes/{id}/feedback

Example request:

    {
      "rating": 5,
      "feedback": "Easy and practical recipe."
    }

### View Statistics

    GET /api/stats

Example response:

    {
      "total_saved_recipes": 1,
      "ai_generated_recipes": 1,
      "manually_saved_recipes": 0,
      "average_rating": 5.0
    }

---

## Database

The app uses PostgreSQL.

Main table: `recipes`

Fields:

- id
- title
- ingredients
- dietary_preferences
- instructions
- meal_type
- source
- rating
- feedback
- created_at

Saved recipes are stored in PostgreSQL and persist using a Docker volume:

    postgres_data

This means saved recipes remain available even after stopping and restarting the containers.

---

## Gemini Integration

Gemini integration is handled in:

    backend/app/gemini_service.py

The frontend does not call Gemini directly.

The flow is:

    React Frontend
        ↓
    FastAPI Backend
        ↓
    Gemini API
        ↓
    FastAPI Backend
        ↓
    React Frontend

The Gemini API key is stored in the backend environment variables, not in the frontend.

If Gemini is not configured or an error happens, the backend returns fallback recipes so the project remains usable for demonstration.

---

## Run Tests

Make sure the containers are built, then run:

    docker compose run --rm backend pytest

Expected result:

    1 passed

---

## Stop the Project

To stop the containers:

    docker compose down

To stop the containers and delete database data:

    docker compose down -v

---

## Known Limitations

- No user login system
- Recipes are saved globally, not per user
- Gemini response parsing depends on valid JSON output
- Basic UI design for demonstration purposes
- Basic test coverage only
- No CI/CD pipeline
- No advanced nutrition calculation

---

## Future Improvements

- Add user authentication
- Add weekly calendar meal planning
- Add shopping list generation
- Add nutrition information
- Add better Gemini JSON schema validation
- Add more tests
- Add CI/CD pipeline
