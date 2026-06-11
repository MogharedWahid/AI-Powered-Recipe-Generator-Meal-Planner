from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class RecipeGenerateRequest(BaseModel):
    ingredients: List[str] = Field(..., min_length=1)
    dietary_preferences: Optional[str] = ""
    meal_plan_days: Optional[int] = Field(default=1, ge=1, le=7)


class GeneratedRecipe(BaseModel):
    title: str
    instructions: str
    meal_type: str = "general"


class RecipeGenerateResponse(BaseModel):
    recipes: List[GeneratedRecipe]
    source: str


class RecipeCreate(BaseModel):
    title: str
    ingredients: List[str]
    dietary_preferences: Optional[str] = ""
    instructions: str
    meal_type: Optional[str] = "general"
    source: Optional[str] = "manual"


class RecipeUpdateFeedback(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    feedback: Optional[str] = None


class RecipeOut(BaseModel):
    id: int
    title: str
    ingredients: List[str]
    dietary_preferences: str
    instructions: str
    meal_type: str
    source: str
    rating: Optional[int]
    feedback: Optional[str]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class StatsOut(BaseModel):
    total_saved_recipes: int
    average_rating: Optional[float]
