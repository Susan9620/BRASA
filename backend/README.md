# BRASA Backend — Instrucciones de setup

## Prerequisitos
- Python 3.10+
- pip

## 1. Descargar los CSVs del Drive

Descarga TODOS los archivos `.csv` desde:
https://drive.google.com/drive/folders/1nxu_DnWNZgwagEkdaDt5ATcBuyjKEoWq

Colócalos en:
```
data/
└── raw/
    ├── fire_archive_M-C61_Ecuador_2001_2010.csv
    ├── fire_archive_M-C61_Ecuador_2011_2015.csv
    └── ...  (todos los que haya)
```

## 2. Instalar dependencias Python

```bash
cd backend
pip install -r requirements.txt
```

## 3. Crear la base de datos (una sola vez)

```bash
python ingest.py
```

Verás algo como:
```
📂 Encontrados 3 archivos CSV en data/raw/
  Leyendo fire_archive_M-C61_Ecuador_2001_2010.csv ...
  Leyendo fire_archive_VIIRS_Ecuador_2012_2024.csv ...
✅ Total de registros únicos: 85,432
   Rango de años: 2001 – 2024
   Sensores: ['MODIS', 'VIIRS']
✅ Base de datos creada exitosamente.
🚀 Ahora ejecuta: uvicorn main:app --reload
```

## 4. Lanzar el servidor API

```bash
uvicorn main:app --reload --port 8000
```

El servidor queda en: http://localhost:8000
Documentación interactiva: http://localhost:8000/docs

## 5. Conectar el frontend

Editar `.env` en la raíz del proyecto:
```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000
```

Luego reiniciar Vite:
```bash
npm run dev
```

¡Listo! La app usa datos reales de NASA FIRMS.

---

## Verificación rápida

```bash
# Probar que el backend responde
curl http://localhost:8000/health

# Probar endpoint de regiones
curl http://localhost:8000/api/regions

# Probar hotspots semana 36 de 2024
curl -X POST http://localhost:8000/api/hotspots \
  -H "Content-Type: application/json" \
  -d '{"year_from":2001,"year_to":2024,"sensor":"harmonized","confidence":"all","daynight":"all","year":2024,"week":36}'
```
