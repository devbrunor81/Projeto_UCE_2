from datetime import date
from typing import Optional

from sqlmodel import Field, SQLModel


class ItemBase(SQLModel):
    nome: str
    descricao: Optional[str] = None
    data_encontro: date
    retirado: bool = False


class Item(ItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(SQLModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    data_encontro: Optional[date] = None
    retirado: Optional[bool] = None
