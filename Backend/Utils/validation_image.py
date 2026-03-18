from typing import List, Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image, UnidentifiedImageError


def validation_images(imagens: List[UploadFile]) -> List[Tuple[UploadFile, str]]:
    """
    Valida uma lista de imagens e retorna uma lista de tuplas (imagem validas, extensão).
    """
    imagens_validas = []

    for imagem in imagens:
        if not imagem.filename:
            continue  # pula arquivos sem nome

        # Validar MIME
        if not imagem.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f'Arquivo "{imagem.filename}" inválido')

        # Validar extensão
        extensao = imagem.filename.split(".")[-1].lower()
        if extensao not in ["jpg", "jpeg", "png", "webp"]:
            raise HTTPException(status_code=400, detail=f'Formato do arquivo "{imagem.filename}" inválido')

        # Validar conteúdo real da imagem (PIL)
        try:
            Image.open(imagem.file)
            imagem.file.seek(0)  # resetar ponteiro do arquivo
        except UnidentifiedImageError:
            raise HTTPException(status_code=400, detail=f'Arquivo "{imagem.filename}" não é uma imagem válida')

        imagens_validas.append((imagem, extensao))

    return imagens_validas