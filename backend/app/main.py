import json
from typing import List

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.gemini_service import generate_recipes_with_gemini
from app.models import Recipe
from app.schemas import (
    RecipeCreate,
    RecipeGenerateRequest,
    RecipeGenerateResponse,
    RecipeOut,
    RecipeUpdateFeedback,
    StatsOut,
)


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Recipe Generator & Meal Planner API",
    description="FastAPI backend for generating, saving, rating, and managing AI recipes.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def recipe_to_out(recipe: Recipe) -> RecipeOut:
    return RecipeOut(
        id=recipe.id,
        title=recipe.title,
        ingredients=json.loads(recipe.ingredients),
        dietary_preferences=recipe.dietary_preferences or "",
        instructions=recipe.instructions,
        meal_type=recipe.meal_type,
        source=recipe.source,
        rating=recipe.rating,
        feedback=recipe.feedback,
        created_at=recipe.created_at,
    )


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/recipes/generate", response_model=RecipeGenerateResponse)
def generate_recipes(payload: RecipeGenerateRequest):
    recipes, source = generate_recipes_with_gemini(
        ingredients=payload.ingredients,
        dietary_preferences=payload.dietary_preferences or "",
        meal_plan_days=payload.meal_plan_days or 1,
    )

    return RecipeGenerateResponse(
        recipes=recipes,
        source=source,
    )


@app.post("/api/recipes", response_model=RecipeOut)
def save_recipe(payload: RecipeCreate, db: Session = Depends(get_db)):
    recipe = Recipe(
        title=payload.title,
        ingredients=json.dumps(payload.ingredients),
        dietary_preferences=payload.dietary_preferences or "",
        instructions=payload.instructions,
        meal_type=payload.meal_type or "general",
        source=payload.source or "manual",
    )

    db.add(recipe)
    db.commit()
    db.refresh(recipe)

    return recipe_to_out(recipe)


@app.get("/api/recipes", response_model=List[RecipeOut])
def list_recipes(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    offset = (page - 1) * page_size

    recipes = (
        db.query(Recipe)
        .order_by(Recipe.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return [recipe_to_out(recipe) for recipe in recipes]


@app.delete("/api/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()

    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    db.delete(recipe)
    db.commit()

    return {"message": "Recipe deleted successfully"}


@app.patch("/api/recipes/{recipe_id}/feedback", response_model=RecipeOut)
def update_recipe_feedback(
    recipe_id: int,
    payload: RecipeUpdateFeedback,
    db: Session = Depends(get_db),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()

    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe.rating = payload.rating
    recipe.feedback = payload.feedback

    db.commit()
    db.refresh(recipe)

    return recipe_to_out(recipe)


@app.get("/api/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    total_saved_recipes = db.query(Recipe).count()
    average_rating = db.query(func.avg(Recipe.rating)).scalar()

    return StatsOut(
        total_saved_recipes=total_saved_recipes,
        average_rating=round(float(average_rating), 2) if average_rating else None,
    )
