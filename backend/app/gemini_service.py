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
            title=f"Warm {ingredients[0].title()} Toast",
            meal_type="dinner",
            instructions=(
                f"1. Prepare the ingredients: {ingredients_text}. "
                "2. Toast the bread until lightly crispy. "
                f"3. Add {ingredients[0]} and the remaining ingredients on top. "
                "4. Heat in a pan or oven for a few minutes until warm. "
                "5. Serve immediately with simple seasoning."
            ),
        )
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
You are an AI-powered recipe generator.

Generate 3 practical recipes using the user's ingredients.

Input ingredients:
{ingredients}

Dietary preferences:
{dietary_preferences or "none"}

Meal plan days:
{meal_plan_days}

Important recipe style:
- Prefer common, familiar, real-world recipes.
- Use recipe names that people would normally recognize.
- Do not invent strange, unusual, or overly creative recipe names.
- If the ingredients match a known dish, use the known dish name.
- Keep the recipes simple and practical for home cooking.
- Avoid fancy restaurant-style recipes unless clearly appropriate.

Rules:
- Use the provided ingredients as much as possible.
- Keep instructions clear and easy to follow.
- Respect dietary preferences.
- Return valid JSON only.
- Do not include markdown.
- Do not include explanations outside JSON.

Required JSON format:
{{
  "recipes": [
    {{
      "title": "Common recipe title",
      "meal_type": "breakfast/lunch/dinner/snack",
      "instructions": "1. First step. 2. Second step. 3. Third step."
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

    except Exception as exc:
        print(f"Gemini generation failed: {type(exc).__name__}: {exc}", flush=True)
        return _fallback_recipes(ingredients, dietary_preferences, meal_plan_days), "fallback"
