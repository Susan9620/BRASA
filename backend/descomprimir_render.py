"""Descomprime la BD de solo lectura cuando Render inicia/reconstruye la app."""
from __future__ import annotations
import gzip
from contextlib import closing
import shutil
import sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
ARCHIVO = HERE / 'brasa_render.db.gz'
BD = HERE / 'brasa_render.db'

def main():
    if BD.is_file():
        with closing(sqlite3.connect(f'file:{BD.as_posix()}?mode=ro', uri=True)) as conn:
            if conn.execute('PRAGMA quick_check').fetchone()[0] == 'ok':
                print('Base lista para Render.', flush=True)
                return
    if not ARCHIVO.is_file():
        raise SystemExit('Falta brasa_render.db.gz. Ejecuta exportar_render.py en tu PC y sube el .gz a GitHub.')
    temp = HERE / 'brasa_render.db.incompleto'
    with gzip.open(ARCHIVO, 'rb') as src, temp.open('wb') as dst:
        shutil.copyfileobj(src, dst, length=1024 * 1024)
    with closing(sqlite3.connect(f'file:{temp.as_posix()}?mode=ro', uri=True)) as conn:
        if conn.execute('PRAGMA quick_check').fetchone()[0] != 'ok':
            temp.unlink(missing_ok=True)
            raise SystemExit('Fallo integridad BD descomprimida')
    temp.replace(BD)
    print('Base comprimida extraida e integra.', flush=True)

if __name__ == '__main__':
    main()
