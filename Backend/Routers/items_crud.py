from datetime import date
from typing import List

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Session, select

from models import Item, ItemCreate, ItemUpdate
from database import engine

router = APIRouter(prefix="/items", tags=["items_crud"])


def get_session():
    with Session(engine) as session:
        yield session


@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
def add_item(item: ItemCreate):
    """Adiciona um item ao banco de dados"""
    print("FUNCIONOU - ADD ITEM")

    with Session(engine) as session:
        db_item = Item.from_orm(item)
        session.add(db_item)
        session.commit()
        session.refresh(db_item)

        print("FUNCIONOU - ITEM CRIADO")

        return db_item


@router.get("/", response_model=List[Item])
def list_itens(retirado: bool = False):
    """Lista itens que não foram removidos (soft delete)"""
    print("FUNCIONOU - LIST ITEMS")

    with Session(engine) as session:
        statement = select(Item).where(Item.retirado == retirado)
        results = session.exec(statement).all()

        print("FUNCIONOU - ITENS LISTADOS" + f"{results})")

        return results


@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int):
    print("FUNCIONOU - GET ITEM")

    with Session(engine) as session:
        item = session.get(Item, item_id)

        if not item or item.retirado:
            raise HTTPException(status_code=404, detail="Item not found")

        print("FUNCIONOU - ITEM ENCONTRADO")

        return item


@router.put("/{item_id}", response_model=Item)
def atualizar_item(item_id: int, item: ItemUpdate):
    """Atualiza informações de um item pelo ID"""
    print("FUNCIONOU - UPDATE ITEM")

    with Session(engine) as session:
        db_item = session.get(Item, item_id)

        if not db_item or db_item.retirado:
            raise HTTPException(status_code=404, detail="Item not found")

        item_data = item.dict(exclude_unset=True)

        for key, value in item_data.items():
            setattr(db_item, key, value)

        session.add(db_item)
        session.commit()
        session.refresh(db_item)

        print("FUNCIONOU - ITEM ATUALIZADO")

        return db_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_item(item_id: int):
    """
    Soft delete:
    apenas marca retirado = True
    """
    print("FUNCIONOU - DELETE ITEM")

    with Session(engine) as session:
        item = session.get(Item, item_id)

        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        item.retirado = True
        item.data_retirada = date.today()

        session.add(item)
        session.commit()

        print("FUNCIONOU - SOFT DELETE REALIZADO")

        return None