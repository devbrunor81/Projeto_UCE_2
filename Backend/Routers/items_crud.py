from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from Database.database import get_db
from Database.models.items import Item, ImagemItem
from typing import List, Optional, Annotated
from pydantic import WithJsonSchema
from datetime import date
import shutil
import os
import uuid

router = APIRouter(tags=["items_crud"])


#Criando diretorio das imagens
IMAGES_DIR = "./Images"
os.makedirs(IMAGES_DIR, exist_ok=True)


router = APIRouter()


FileSchema = Annotated[UploadFile, WithJsonSchema({"type": "string", "format": "binary"})]

#CREATE
@router.post("/items")
async def add_item(
    nome: str = Form(...),
    categoria: str = Form(...),
    data_encontro: date = Form(...),
    local_encontro: str = Form(...),
    descricao: Optional[str] = Form(None),
    imagens: List[FileSchema] = File(...),
    db: AsyncSession = Depends(get_db)
):

    #Salvando informações do item:
    novo_item = Item(
        nome=nome,
        categoria=categoria,
        data_encontro=data_encontro,
        local_encontro=local_encontro,
        descricao=descricao
    )

    db.add(novo_item)
    await db.commit()
    await db.refresh(novo_item)


    #Salvando as imagens do item:
    imagens_db = []
    for imagem in imagens:

        extensao = imagem.filename.split(".")[-1]
        nome_arquivo = f"{uuid.uuid4()}.{extensao}"

        caminho = os.path.join(IMAGES_DIR, nome_arquivo)

        with open(caminho, "wb") as buffer:
            shutil.copyfileobj(imagem.file, buffer)

        imagem_db = ImagemItem(
            path=f"{nome_arquivo}",
            item_id=novo_item.id
        )

        db.add(imagem_db)
        imagens_db.append(imagem_db)

    await db.commit()

    return {
        "item_id": novo_item.id,
        "imagens": [img.path for img in imagens_db]
    }




#READ
@router.get("/items")
async def list_itens():
    """
    Retorna a lista de itens do banco
    """
    return [{"Exemplo1"}, {"Exemplo2"}]



# UPDATE
@router.put("/items/{item_id}")
def atualizar_item(item_id: int):
    """
    Atualiza informações de um item pelo ID
    """
    return {"mensagem": f"Item {item_id} atualizado com sucesso!"}


#DELETE
@router.delete("/items/{item_id}")
async def deletar_item(item_id: int):
    """
    Deleta um item pelo ID
    """
    return {"mensagem": f"Item {item_id} deletado com sucesso!"}

