from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from Database.database import get_db
from Database.models.users import User
from Utils.current_user import get_current_user
from Utils.security import hash_senha, verificar_senha

router = APIRouter(
    tags=["users"]
)


@router.put("/users/me")
async def update_user(
    atual_password: str = Form(...),
    username: Optional[str] = Form(None),
    new_password: Optional[str] = Form(None),
    confirm_new_password: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    

    # validação simples
    if not username and not new_password:
        raise HTTPException(400, "Informe ao menos um campo para atualizar")
    
    # Se quiser fazer alguma alteraçao -> precisa validar senha atual
    if not atual_password:
        raise HTTPException(400, "Informe a senha atual")

    if not verificar_senha(atual_password, current_user.password):
        raise HTTPException(401, "Senha atual incorreta")


    # Atualizar username
    if username:
        # verificar se já existe
        result = await db.execute(select(User).where(User.username == username))
        user_existente = result.scalar_one_or_none()

        if user_existente and user_existente.id != current_user.id:
            raise HTTPException(400, "Username já está em uso.")

        current_user.username = username

    # Atualizar senha (com hash)
    if new_password:
        if not confirm_new_password:
            raise HTTPException(400, "Confirme a nova senha")

        if new_password != confirm_new_password:
            raise HTTPException(400, "Confirmação da senha está diferente.")
        
        current_user.password = hash_senha(new_password)

    await db.commit()
    await db.refresh(current_user)

    return {
        "mensagem": "Usuário atualizado com sucesso",
        "user": {
            "id": current_user.id,
            "username": current_user.username
        }
    }