from fastapi import FastAPI
from Routers import items_crud

app = FastAPI()

app.include_router(items_crud.router)