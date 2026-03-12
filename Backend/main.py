from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from Routers import items_crud
from database import init_db

app = FastAPI()

# enable CORS so front-end can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create database tables on startup
@app.on_event("startup")
async def on_startup():
    init_db()

app.include_router(items_crud.router)