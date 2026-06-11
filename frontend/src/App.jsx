import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:8000";

function formatInstructions(instructions) {
  if (!instructions) {
    return [];
  }

  if (/\d+\.\s/.test(instructions)) {
    return instructions
      .split(/(?=\d+\.\s)/g)
      .map((step) => step.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
  }

  return instructions
    .split(/(?<=[.!?])\s+/g)
    .map((step) => step.trim())
    .filter(Boolean);
}

function App() {
  const [ingredientsText, setIngredientsText] = useState("tomato, cheese, bread");
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

  async function refreshData() {
    const recipesResponse = await fetch(`${API_BASE_URL}/api/recipes`);
    const statsResponse = await fetch(`${API_BASE_URL}/api/stats`);

    setSavedRecipes(await recipesResponse.json());
    setStats(await statsResponse.json());
  }

  useEffect(() => {
    refreshData();
  }, []);

  async function generateRecipes(event) {
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
        body: JSON.stringify({ ingredients }),
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

  async function saveRecipe(recipe) {
    await fetch(`${API_BASE_URL}/api/recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: recipe.title,
        ingredients,
        dietary_preferences: "",
        instructions: recipe.instructions,
        meal_type: recipe.meal_type,
        source: generatedSource || "manual",
      }),
    });

    setMessage("Recipe saved successfully.");
    refreshData();
  }

  async function deleteRecipe(recipeId) {
    await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
      method: "DELETE",
    });

    setMessage("Recipe deleted successfully.");
    refreshData();
  }

  async function saveFeedback(recipeId, rating, feedback) {
    await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/feedback`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rating: rating ? Number(rating) : null,
        feedback,
      }),
    });

    setMessage("Feedback saved successfully.");
    refreshData();
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-icon">👨‍🍳</div>

        <h1>
          Recipe Generator
          <br />
          &amp; Meal Planner
        </h1>

        <div className="hero-divider"></div>

        <div className="hero-features">
          <span>🌿 Enter Ingredients</span>
          <span>✨ Generate Recipes</span>
          <span>🔖 Save Favorites</span>
          <span>☆ Rate & Review</span>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Generate Recipes</h2>

          <form onSubmit={generateRecipes} className="form">
            <label>
              Ingredients
              <textarea
                value={ingredientsText}
                onChange={(event) => setIngredientsText(event.target.value)}
                placeholder="Example: tomato, cheese, bread"
                rows="4"
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
                <strong>{stats.average_rating ?? "N/A"}</strong>
                <span>Avg rating</span>
              </div>
            </div>
          ) : (
            <p className="empty">Loading stats...</p>
          )}
        </section>
      </main>

      <section className="section">
        <div className="section-title">
          <h2>Generated Recipes</h2>
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

                <ol className="recipe-steps">
                  {formatInstructions(recipe.instructions).map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ol>

                <button onClick={() => saveRecipe(recipe)}>Save Recipe</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Saved Recipes</h2>

        {savedRecipes.length === 0 ? (
          <p className="empty">No saved recipes yet.</p>
        ) : (
          <div className="cards">
            {savedRecipes.map((recipe) => (
              <SavedRecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={deleteRecipe}
                onFeedback={saveFeedback}
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
    <article className="card">
      <div className="card-top">
        <span className="badge">{recipe.meal_type}</span>
        <span className="source">{recipe.source}</span>
      </div>

      <h3>{recipe.title}</h3>

      <p className="ingredients">
        <strong>Ingredients:</strong> {recipe.ingredients.join(", ")}
      </p>

      <ol className="recipe-steps">
        {formatInstructions(recipe.instructions).map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>

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
