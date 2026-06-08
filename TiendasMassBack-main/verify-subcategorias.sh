#!/bin/bash

# Script de verificación de la implementación de subcategorías

echo "=========================================="
echo "Verificación de Implementación Subcategorías"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

errors=0

# Función para verificar archivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Archivo existe: $1"
    else
        echo -e "${RED}✗${NC} Archivo NO existe: $1"
        ((errors++))
    fi
}

# Función para verificar contenido en archivo
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Contenido encontrado en: $1"
    else
        echo -e "${RED}✗${NC} Contenido NO encontrado en: $1"
        ((errors++))
    fi
}

echo "Verificando archivos creados..."
echo "--------------------------------"
check_file "src/entities/Subcategoria.entity.ts"
check_file "src/controllers/subcategoria.controller.ts"
check_file "src/routes/subcategoria.routes.ts"
check_file "src/services/subcategoria.service.ts"
check_file "src/scripts/create-subcategorias.sql"
check_file "postman_tests/subcategorias_tests.json"
check_file "SUBCATEGORIAS.md"

echo ""
echo "Verificando archivos modificados..."
echo "------------------------------------"
check_content "src/entities/Categoria.entity.ts" "Subcategoria"
check_content "src/entities/Producto.entity.ts" "subcategoria"
check_content "src/entities/Estado.entity.ts" "Subcategoria"
check_content "src/controllers/productos.controller.ts" "subcategoria_id"
check_content "src/app.ts" "subcategoriaRoutes"

echo ""
echo "=========================================="
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✓ Verificación completada exitosamente${NC}"
    echo "Todos los archivos están en su lugar"
else
    echo -e "${RED}✗ Se encontraron $errors errores${NC}"
    echo "Por favor, verifique la implementación"
fi
echo "=========================================="
