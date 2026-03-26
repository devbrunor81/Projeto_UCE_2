from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Routers import items_crud, auth
from Database.database import engine, Base
from Database.models import items, users
from Utils.soft_delete import scheduler, start_scheduler
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine, expire_on_commit=False) as session:
        
        result = await session.execute(select(users.User).filter_by(username="admin"))
        user_exists = result.scalars().first()
        
        if not user_exists:
            novo_usuario = users.User(username="admin", password="123123") #todo: implementar hash
            session.add(novo_usuario)
            await session.commit()
    # Iniciar scheduler de soft_delete
    start_scheduler()

    yield

    # Garantir que vai encerra o scheduler quando finalizar a aplicacao
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # É importante não ter a barra (/) no final do endereço!
    allow_origins=[
        "http://localhost:8080", 
        "http://127.0.0.1:8080" # Coloquei as duas formas por garantia
    ],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

app.include_router(items_crud.router)
app.include_router(auth.router)