from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from Database.database import get_db
from Database.models.users import User
from Utils.security import verificar_senha, criar_token

router = APIRouter(tags=["autenticacao"])

class LoginData(BaseModel):
    email: str 
    senha: str

@router.post("/login")
async def login(dados: LoginData, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.username == dados.email)
    result = await db.execute(query)
    usuario_db = result.scalar_one_or_none()

    if not usuario_db or not verificar_senha(dados.senha, usuario_db.password):
        raise HTTPException(
            status_code=401,
            detail="Usuário ou senha incorretos"
        )

    token = criar_token({"sub": str(usuario_db.id)})

    return {
        "access_token": token,
        "token_type": "bearer"
    }