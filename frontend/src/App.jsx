import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:8000";

function App() {
  const [ingredientsText, setIngredientsText] = useState("tomato, cheese, bread");
  const [dietaryPreferences, setDietaryPreferences] = useState("vegetarian");
  const [mealPlanDays, setMealPlanDays] = useState(1);

  const [generatedRecipes, setGeneratedRecipes] = useState([]);
  const [generatedSource, setGeneratedSource] = useState("");

  const [savedRecipes, setSavedRecipes] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const ingredients = ingredientsText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  async function fetchSavedRecipes() {
    const response = await fetch(`${API_BASE_URL}/api/recipes`);
    const data = await response.json();
    setSavedRecipes(data);
  }

  async function fetchStats() {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    const data = await response.json();
    setStats(data);
  }

  async function refreshData() {
    await fetchSavedRecipes();
    await fetchStats();
  }

  useEffect(() => {
    refreshData();
  }, []);

  async function handleGenerateRecipes(event) {
    event.preventDefault();
    setMessage("");

    if (ingredients.length === 0) {
      setMessage("Please enter at least one ingredient.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/recipes/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients,
          dietary_preferences: dietaryPreferences,
          meal_plan_days: Number(mealPlanDays),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate recipes.");
      }

      const data = await response.json();
      setGeneratedRecipes(data.recipes);
      setGeneratedSource(data.source);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveRecipe(recipe) {
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: recipe.title,
          ingredients,
          dietary_preferences: dietaryPreferences,
          instructions: recipe.instructions,
          meal_type: recipe.meal_type,
          source: generatedSource || "manual",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save recipe.");
      }

      await refreshData();
      setMessage("Recipe saved successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDeleteRecipe(recipeId) {
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete recipe.");
      }

      await refreshData();
      setMessage("Recipe deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleFeedback(recipeId, rating, feedback) {
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/feedback`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating ? Number(rating) : null,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update feedback.");
      }

      await refreshData();
      setMessage("Feedback updated successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">AI-Powered Recipe Generator</p>
          <h1>Recipe Generator & Meal Planner</h1>
          <p className="subtitle">
            Enter ingredients or dietary preferences, generate practical recipe ideas,
            then save and rate your favorite meals.
          </p>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Generate recipes</h2>

          <form onSubmit={handleGenerateRecipes} className="form">
            <label>
              Ingredients
              <textarea
                value={ingredientsText}
                onChange={(event) => setIngredientsText(event.target.value)}
                placeholder="Example: tomato, cheese, bread"
                rows="4"
              />
            </label>

            <label>
              Dietary preferences
              <input
                value={dietaryPreferences}
                onChange={(event) => setDietaryPreferences(event.target.value)}
                placeholder="Example: vegetarian, high protein, gluten free"
              />
            </label>

            <label>
              Meal plan days
              <input
                type="number"
                min="1"
                max="7"
                value={mealPlanDays}
                onChange={(event) => setMealPlanDays(event.target.value)}
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate Recipes"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </section>

        <section className="panel">
          <h2>Stats</h2>

          {stats ? (
            <div className="stats-grid">
              <div>
                <strong>{stats.total_saved_recipes}</strong>
                <span>Total saved</span>
              </div>
              <div>
                <strong>{stats.ai_generated_recipes}</strong>
                <span>Generated</span>
              </div>
              <div>
                <strong>{stats.manually_saved_recipes}</strong>
                <span>Manual</span>
              </div>
              <div>
                <strong>{stats.average_rating ?? "N/A"}</strong>
                <span>Avg rating</span>
              </div>
            </div>
          ) : (
            <p>Loading stats...</p>
          )}
        </section>
      </main>

      <section className="section">
        <div className="section-title">
          <h2>Generated recipes</h2>
          {generatedSource && <span className="badge">Source: {generatedSource}</span>}
        </div>

        {generatedRecipes.length === 0 ? (
          <p className="empty">No generated recipes yet.</p>
        ) : (
          <div className="cards">
            {generatedRecipes.map((recipe, index) => (
              <article className="card" key={`${recipe.title}-${index}`}>
                <span className="badge">{recipe.meal_type}</span>
                <h3>{recipe.title}</h3>
                <p>{recipe.instructions}</p>
                <button onClick={() => handleSaveRecipe(recipe)}>Save Recipe</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Saved recipes</h2>

        {savedRecipes.length === 0 ? (
          <p className="empty">No saved recipes yet.</p>
        ) : (
          <div className="cards">
            {savedRecipes.map((recipe) => (
              <SavedRecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={handleDeleteRecipe}
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SavedRecipeCard({ recipe, onDelete, onFeedback }) {
  const [rating, setRating] = useState(recipe.rating || "");
  const [feedback, setFeedback] = useState(recipe.feedback || "");

  return (
    <article className="card saved-card">
      <div className="card-top">
        <span className="badge">{recipe.meal_type}</span>
        <span className="source">{recipe.source}</span>
      </div>

      <h3>{recipe.title}</h3>

      <p className="ingredients">
        <strong>Ingredients:</strong> {recipe.ingredients.join(", ")}
      </p>

      <p>{recipe.instructions}</p>

      <div className="feedback-box">
        <label>
          Rating
          <select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="">No rating</option>
            <option value="1">1 - Poor</option>
            <option value="2">2 - Fair</option>
            <option value="3">3 - Good</option>
            <option value="4">4 - Very good</option>
            <option value="5">5 - Excellent</option>
          </select>
        </label>

        <label>
          Feedback
          <input
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Write feedback"
          />
        </label>
      </div>

      <div className="actions">
        <button onClick={() => onFeedback(recipe.id, rating, feedback)}>
          Save Feedback
        </button>

        <button className="danger" onClick={() => onDelete(recipe.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export default App;
