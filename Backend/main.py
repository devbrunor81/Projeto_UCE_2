from fastapi import FastAPI
from Routers import items_crud
from Database.database import engine, Base
from Database.models import items, users
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

app = FastAPI(lifespan=lifespan)

app.include_router(items_crud.router)
