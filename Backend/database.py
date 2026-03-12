from sqlmodel import create_engine, SQLModel

# SQLite file will be stored in the backend directory
DATABASE_URL = "sqlite:///./items.db"
engine = create_engine(DATABASE_URL, echo=True)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
