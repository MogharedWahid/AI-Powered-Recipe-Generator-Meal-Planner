from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    ingredients: Mapped[str] = mapped_column(Text, nullable=False)
    dietary_preferences: Mapped[str] = mapped_column(Text, default="")
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    meal_type: Mapped[str] = mapped_column(String(100), default="general")
    source: Mapped[str] = mapped_column(String(50), default="manual")
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
