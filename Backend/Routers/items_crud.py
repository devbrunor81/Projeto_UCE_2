from fastapi import APIRouter

router = APIRouter(tags=["items_crud"])


#CREATE
@router.post("/items")
async def add_item():
    """
    Adiciona um item ao banco de dados"
    """
    return {"mensagem": "Item adicionado"}


#READ
@router.get("/items")
async def list_itens():
    """
    Retorna a lista de itens do banco com "retirado == false"
    """
    return [{"nome": "Item_1", "descricao": "descricao do item_1", "data_encontro": "10/03/2026"}, {"nome": "Item_2", "descricao": "descricao do item_2", "data_encontro": "08/03/2026"}]



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

