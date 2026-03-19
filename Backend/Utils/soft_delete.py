from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta, timezone
import os
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from zoneinfo import ZoneInfo

from Database.database import SessionLocal
from Database.models.items import Item

IMAGES_DIR = "./Images"


async def soft_delete():
    async with SessionLocal() as db:
        try:
            tres_meses_atras = datetime.now(timezone.utc) - timedelta(days=90)

            query = select(Item).options(selectinload(Item.imagens)).where(
                Item.ativo == True,
                Item.devolvido == True,
                Item.data_devolucao != None,
                Item.data_devolucao <= tres_meses_atras
            )

            result = await db.execute(query)
            itens_antigos = result.scalars().all()

            total_deletadas = 0

            for item in itens_antigos:
                for imagem in item.imagens:
                    caminho = os.path.join(IMAGES_DIR, imagem.path)

                    if os.path.exists(caminho):
                        os.remove(caminho)

                    await db.delete(imagem)
                    total_deletadas += 1

                print(f"\nItem {item.id} sofrendo soft_delete\n")
                item.ativo = False  # desativa o item para nao aparecer mais na pagina

            await db.commit()

            print(f"[{datetime.now(timezone.utc)}] {total_deletadas} imagens deletadas")

        except Exception as e:
            print(f"Erro no cleanup: {e}")
            await db.rollback()


scheduler = AsyncIOScheduler(timezone=ZoneInfo("America/Sao_Paulo"))

scheduler.add_job(
    soft_delete,
    trigger="cron", hour=16, minute=0
)


def start_scheduler():
    if not scheduler.running:  # evita duplicação
        scheduler.start()