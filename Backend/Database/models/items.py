from sqlalchemy import Column, Integer, String, Date, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String, nullable=False)

    categoria = Column(String, nullable=False)

    data_encontro = Column(Date, nullable=False)

    local_encontro = Column(String, nullable=False)

    descricao = Column(Text, nullable=True)

    devolvido = Column(Boolean, default=False)

    data_devolucao = Column(Date, nullable=True)

    nome_resgatante = Column(String, nullable=True)

    telefone_resgatante = Column(String, nullable=True)

    tipo_resgatante = Column(String, nullable=True)

    ativo = Column(Boolean, default=True)

    imagens = relationship("ImagemItem", back_populates="item", cascade="all, delete-orphan")


class ImagemItem(Base):
    __tablename__ = "images_items"

    id = Column(Integer, primary_key=True)

    path = Column(String, nullable=False)

    item_id = Column(Integer, ForeignKey("items.id"))

    item = relationship("Item", back_populates="imagens")