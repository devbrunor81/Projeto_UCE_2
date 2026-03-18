from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from PIL import Image, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from Database.database import get_db
from Database.models.items import Item, ImagemItem
from typing import List, Optional, Annotated, Literal
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

        # Criar item
        novo_item = Item(
            nome=nome,
            categoria=categoria.lower(),
            data_encontro=data_encontro,
            local_encontro=local_encontro,
            descricao=descricao
        )

        db.add(novo_item)

        # Gera um ID para o item no banco sem fazer o commit definitivo
        await db.flush()

        imagens_db = []

        # Validando e salvando as imagens
        for imagem in imagens:
            if not imagem.filename:
                continue

            # Validar MIME
            if not imagem.content_type.startswith("image/"):
                raise HTTPException(400, "Arquivo inválido")

            # Validar extensão
            extensao = imagem.filename.split(".")[-1].lower()

            if extensao not in ["jpg", "jpeg", "png", "webp"]:
                raise HTTPException(400, "Formato de arquivo inválido")

            # Validar conteúdo real da imagem (PIL)
            try:
                Image.open(imagem.file)
                imagem.file.seek(0)
            except UnidentifiedImageError:
                raise HTTPException(400, "Arquivo não é uma imagem válida")


            # Gerando arquivo para ser salvo
            nome_arquivo = f"{uuid.uuid4()}.{extensao}"

            caminho = os.path.join(IMAGES_DIR, nome_arquivo)

            # Salvando arquivo na pasta
            with open(caminho, "wb") as buffer:
                shutil.copyfileobj(imagem.file, buffer)

            # Salvando arquivo no banco de dados
            imagem_db = ImagemItem(
                path=nome_arquivo,
                item_id=novo_item.id
            )

            db.add(imagem_db)
            imagens_db.append(imagem_db)

        # Commit único para as tabelas de items e images_items
        await db.commit()

        return {
            "item_id": novo_item.id,
            "imagens": [img.path for img in imagens_db]
        }




#READ
@router.get("/items")
async def list_itens(
    status: Literal["todos", "perdidos", "devolvidos"] = "todos",
    categoria:  Literal["todas", "acessorio", "eletronico", "documento", "roupas_calcados", "outros"] = "todas",
    db: AsyncSession = Depends(get_db)
):
    
    # Para buscar item + imagens (ordenados pelos mais recentes)
    query = (select(Item).options(selectinload(Item.imagens)).order_by(desc(Item.data_encontro), desc(Item.id)))

    # Filtro por status do item (Todos, Perdidos, Devolvidos)
    if status == "perdidos":
        query = query.where(Item.devolvido == False)
    elif status == "devolvidos":
        query = query.where(Item.devolvido == True)

    # Filtro por categoria do item (Todas, Acessório, Eletrônico, Documento, Vestuário, Outros)
    categorias_principais = ["acessorio", "eletronico", "documento", "roupas_calcados"]

    if categoria.lower() != "todas":
        if categoria == "outros":
            query = query.where(~Item.categoria.in_(categorias_principais))
        else:
            query = query.where(Item.categoria == categoria)

    # Executando a busca
    result = await db.execute(query)
    itens = result.scalars().all()

    return [
        {
            "id": item.id,
            "nome": item.nome,
            "categoria": item.categoria,
            "data_encontro" : item.data_encontro,
            "local_encontro" : item.local_encontro,
            "descricao" : item.descricao,
            "devolvido": item.devolvido,
            "nome_resgatante" : item.nome_resgatante,
            "telefone_resgatante" : item.telefone_resgatante,
            "tipo_resgatante" : item.tipo_resgatante,
            "imagens": [img.path for img in item.imagens]

        } for item in itens
    ]



# UPDATE
@router.put("/items/{item_id}")
async def update_item(
    item_id: int,
    nome: Optional[str] = Form(None),
    categoria: Optional[str] = Form(None),
    data_encontro: Optional[date] = Form(None),
    local_encontro: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
    devolvido: Optional[bool] = Form(None),
    nome_resgatante: Optional[str] = Form(None),
    telefone_resgatante: Optional[str] = Form(None),
    tipo_resgatante: Optional[str] = Form(None),
    imagens: Optional[List[FileSchema]] = File(None),
    db: AsyncSession = Depends(get_db)
):
    
    # Buscar item + imagens
    query = select(Item).options(selectinload(Item.imagens)).where(Item.id == item_id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    # Atualizar apenas campos enviados na requisição
    if nome is not None:
        item.nome = nome
    if categoria is not None:
        item.categoria = categoria.lower()
    if data_encontro is not None:
        item.data_encontro = data_encontro
    if local_encontro is not None:
        item.local_encontro = local_encontro
    if descricao is not None:
        item.descricao = descricao
    if devolvido is not None:
        item.devolvido = devolvido
    if nome_resgatante is not None:
        item.nome_resgatante = nome_resgatante
    if telefone_resgatante is not None:
        item.telefone_resgatante = telefone_resgatante
    if tipo_resgatante is not None:
        item.tipo_resgatante = tipo_resgatante


    # SUBSTITUINDO AS IMAGENS
    if imagens is not None:

        novas_imagens = []

        # 1. Salvar imagens novas (pasta de imagens + referências no banco)
        for imagem in imagens:
            if not imagem.filename:
                continue

            # Validar MIME
            if not imagem.content_type.startswith("image/"):
                raise HTTPException(400, "Arquivo inválido")

            # Validar extensão
            extensao = imagem.filename.split(".")[-1].lower()

            if extensao not in ["jpg", "jpeg", "png", "webp"]:
                raise HTTPException(400, "Formato de arquivo inválido")

            # Validar conteúdo real da imagem (PIL)
            try:
                Image.open(imagem.file)
                imagem.file.seek(0)
            except UnidentifiedImageError:
                raise HTTPException(400, "Arquivo não é uma imagem válida")


            # Gerando arquivo para ser salvo
            nome_arquivo = f"{uuid.uuid4()}.{extensao}"

            caminho = os.path.join(IMAGES_DIR, nome_arquivo)

            # Salvando arquivo na pasta
            with open(caminho, "wb") as buffer:
                shutil.copyfileobj(imagem.file, buffer)

            # Salvando arquivo no banco de dados
            nova_imagem = ImagemItem(
                path=nome_arquivo,
                item_id=item.id
            )

            db.add(nova_imagem)
            novas_imagens.append(nova_imagem)

        # 2. Remover imagens antigas (pasta de imagens + referências no banco)
        for img in item.imagens:
            caminho = os.path.join(IMAGES_DIR, img.path)

            if os.path.exists(caminho):
                os.remove(caminho)

            await db.delete(img)

    # Salvando alterações
    await db.commit()
    await db.refresh(item)

    return {
        "mensagem": "Item atualizado com sucesso",
        "item_id": item.id
    }


#DELETE
@router.delete("/items/{item_id}")
async def delete_item(
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    query = select(Item).options(selectinload(Item.imagens)).where(Item.id == item_id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    # Deletando imagens do item
    for imagem in item.imagens:
        caminho = os.path.join(IMAGES_DIR, imagem.path)
        if os.path.exists(caminho):
            os.remove(caminho)

    # Deletando o item do banco
    await db.delete(item)
    await db.commit()

    return {
        "mensagem": "Item deletado com sucesso",
        "item_id": item.id
    }

