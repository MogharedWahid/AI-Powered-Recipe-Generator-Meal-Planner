from app.gemini_service import generate_recipes_with_gemini


def test_generate_recipes_fallback_without_api_key(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")

    recipes, source = generate_recipes_with_gemini(
        ingredients=["tomato", "cheese", "bread"],
        dietary_preferences="vegetarian",
        meal_plan_days=1,
    )

    assert source == "fallback"
    assert len(recipes) > 0
    assert recipes[0].title
    assert recipes[0].instructions
