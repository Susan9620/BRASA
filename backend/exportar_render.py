"""BRASA v0.19: exporta resumen mundial compacto para Render, sin CSV ni detecciones espaciales.

Usar DESDE backend, con la API detenida o BD original sin escrituras:
  python exportar_render.py --origen brasa_mundial.db --salida brasa_render.db.gz

No sobreescribe la BD original ni sus datos. El destino .gz se crea sin tablas espaciales
masivas; las estadisticas siguen siendo presencia celda-dia-sensor (aproximada).
"""
from __future__ import annotations

import argparse
import gzip
import shutil
import sqlite3
import sys
from pathlib import Path

TABLAS = ('metadata', 'archivos_procesados', 'paises_ref', 'celda_pais', 'resumen_semanal')


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument('--origen', type=Path, default=Path('brasa_mundial.db'))
    p.add_argument('--salida', type=Path, default=Path('brasa_render.db.gz'))
    args = p.parse_args()
    origen = args.origen.resolve()
    salida = args.salida.resolve()
    temporal = salida.with_suffix('.tmp.db')
    if not origen.is_file():
        p.error(f'No existe la base: {origen}')
    if salida.exists() or temporal.exists():
        p.error(f'La salida ya existe; no se reemplaza: {salida} o {temporal}')
    con = sqlite3.connect(temporal, timeout=120)
    try:
        con.execute('PRAGMA journal_mode=DELETE')
        con.execute('PRAGMA synchronous=FULL')
        con.execute('PRAGMA temp_store=FILE')
        con.execute('ATTACH DATABASE ? AS fuente', (str(origen),))
        for tabla in TABLAS:
            row = con.execute("SELECT sql FROM fuente.sqlite_master WHERE type='table' AND name=?", (tabla,)).fetchone()
            if not row:
                raise RuntimeError(f'Falta tabla {tabla} en origen; primero ejecuta preparar_consultas_mundiales.py')
            con.execute(row[0])
            con.execute(f'INSERT INTO "{tabla}" SELECT * FROM fuente."{tabla}"')
            con.commit()
            total = con.execute(f'SELECT COUNT(*) FROM "{tabla}"').fetchone()[0]
            print(f'{tabla}: {total:,} filas exportadas', flush=True)
        n = con.execute("SELECT COUNT(*) FROM archivos_procesados WHERE terminado=1").fetchone()[0]
        if n != 34:
            raise RuntimeError(f'Se esperaban 34 CSV completos; hay {n}')
        original = con.execute('SELECT SUM(n) FROM resumen_semanal WHERE country_code=?', ('*',)).fetchone()[0]
        if not original:
            raise RuntimeError('No hay resumen semanal global')
        con.execute('DETACH DATABASE fuente')
        con.execute('VACUUM')
        ok = con.execute('PRAGMA quick_check').fetchone()[0]
        if ok != 'ok':
            raise RuntimeError(f'Integridad incorrecta: {ok}')
        print(f'Conteo de resumen global: {original:,}; integridad {ok}', flush=True)
    except Exception:
        con.close()
        temporal.unlink(missing_ok=True)
        raise
    con.close()
    with open(temporal, 'rb') as src, gzip.open(salida, 'wb', compresslevel=9) as dst:
        shutil.copyfileobj(src, dst, length=1024 * 1024)
    total_mb = salida.stat().st_size / 1024**2
    print(f'OK: {salida.name}: {total_mb:.2f} MiB (comprimido)', flush=True)
    temporal.unlink(missing_ok=True)
    if total_mb >= 100:
        print('ADVERTENCIA: archivo de 100 MiB o mas; NO lo subas a GitHub como archivo normal.', file=sys.stderr)
    print('Metrica: presencia de celda-día-sensor; sin geometrías de eventos del mapa.', flush=True)


if __name__ == '__main__':
    main()
