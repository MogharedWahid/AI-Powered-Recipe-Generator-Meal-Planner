import json
import os
import re
from typing import List

from app.schemas import GeneratedRecipe


def _fallback_recipes(
    ingredients: List[str],
    dietary_preferences: str = "",
    meal_plan_days: int = 1,
) -> List[GeneratedRecipe]:
    ingredients_text = ", ".join(ingredients)

    return [
        GeneratedRecipe(
            title=f"Simple {ingredients[0].title()} Bowl",
            meal_type="lunch",
            instructions=(
                f"Use {ingredients_text}. Chop the ingredients, cook them together "
                "with basic seasoning, and serve warm. Adjust salt, pepper, and herbs "
                "based on taste."
            ),
        ),
        GeneratedRecipe(
            title=f"Quick {ingredients[0].title()} Sandwich",
            meal_type="snack",
            instructions=(
                f"Prepare a quick sandwich using {ingredients_text}. Toast the bread "
                "if available, add the main ingredients, and serve immediately."
            ),
        ),
        GeneratedRecipe(
            title=f"{meal_plan_days}-Day Practical Meal Idea",
            meal_type="meal plan",
            instructions=(
                f"Create a simple {meal_plan_days}-day plan using {ingredients_text}. "
                f"Dietary preference: {dietary_preferences or 'none'}. Rotate the same "
                "ingredients across breakfast, lunch, and dinner to reduce waste."
            ),
        ),
    ]


def _extract_json(text: str) -> dict:
    """
    Gemini may sometimes wrap JSON in markdown fences.
    This function extracts the JSON object safely.
    """
    text = text.strip()

    if text.startswith("```"):
        text = re.sub(r"^```json", "", text, flags=re.IGNORECASE).strip()
        text = re.sub(r"^```", "", text).strip()
        text = re.sub(r"```$", "", text).strip()

    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in Gemini response")

    return json.loads(match.group(0))


def generate_recipes_with_gemini(
    ingredients: List[str],
    dietary_preferences: str = "",
    meal_plan_days: int = 1,
) -> tuple[List[GeneratedRecipe], str]:
    """
    Returns:
        (recipes, source)

    source can be:
        - gemini
        - fallback
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    if not api_key:
        return _fallback_recipes(ingredients, dietary_preferences, meal_plan_days), "fallback"

    try:
        from google import genai

        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an AI-powered recipe generator and meal planner.

Generate 3 practical recipes or meal plan ideas.

Input ingredients:
{ingredients}

Dietary preferences:
{dietary_preferences or "none"}

Meal plan days:
{meal_plan_days}

Rules:
- Use the provided ingredients as much as possible.
- Keep instructions practical and easy to follow.
- Respect dietary preferences.
- Return valid JSON only.
- Do not include markdown.
- Do not include explanations outside JSON.

Required JSON format:
{{
  "recipes": [
    {{
      "title": "Recipe title",
      "meal_type": "breakfast/lunch/dinner/snack/meal plan",
      "instructions": "Step-by-step cooking instructions"
    }}
  ]
}}
"""

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )

        data = _extract_json(response.text)

        recipes = [
            GeneratedRecipe(
                title=item.get("title", "Untitled Recipe"),
                meal_type=item.get("meal_type", "general"),
                instructions=item.get("instructions", ""),
            )
            for item in data.get("recipes", [])
        ]

        if not recipes:
            raise ValueError("Gemini returned no recipes")

        return recipes, "gemini"

    except Exception:
        return _fallback_recipes(ingredients, dietary_preferences, meal_plan_days), "fallback"
