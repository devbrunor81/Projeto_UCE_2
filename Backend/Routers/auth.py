from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from Database.database import get_db
from Database.models.users import User 

router = APIRouter(tags=["autenticacao"])

class LoginData(BaseModel):
    email: str 
    senha: str

@router.post("/login")
async def login(dados: LoginData, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.username == dados.email)
    result = await db.execute(query)
    usuario_db = result.scalar_one_or_none()

    # Por enquanto estamos comparando texto puro, sem hash
    if not usuario_db or usuario_db.password != dados.senha:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Usuário ou senha incorretos"
        )

    return {
        "mensagem": "Login realizado com sucesso",
        "access_token": "token_falso_so_para_o_frontend_deixar_entrar", 
        "token_type": "bearer"
    }