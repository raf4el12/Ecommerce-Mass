#!/bin/bash

# ============================================
# SCRIPT DE CARGA DE DATOS DE PRUEBA
# Inserta subcategorías y actualiza productos
# ============================================

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CARGA DE DATOS DE PRUEBA - SUBCATEGORÍAS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Solicitar credenciales
read -p "Usuario MySQL (default: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -sp "Contraseña MySQL: " MYSQL_PASS
echo ""

read -p "Base de datos (default: tiendasmass): " MYSQL_DB
MYSQL_DB=${MYSQL_DB:-tiendasmass}

# Función para ejecutar SQL
execute_sql() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}→ $description${NC}"
    
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" < "$file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $description completado${NC}"
    else
        echo -e "${RED}✗ Error en: $description${NC}"
        exit 1
    fi
    echo ""
}

# Ejecutar scripts
execute_sql "src/scripts/insert-subcategorias.sql" "Insertando subcategorías"
execute_sql "src/scripts/update-productos-subcategorias.sql" "Actualizando productos con subcategorías"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ CARGA DE DATOS COMPLETADA${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Resumen:${NC}"
echo "  • Subcategorías insertadas: 31"
echo "  • Productos actualizados: 9"
echo ""
echo -e "${YELLOW}Para verificar, ejecuta:${NC}"
echo "  mysql -u $MYSQL_USER -p $MYSQL_DB"
echo "  SELECT COUNT(*) FROM Subcategorias;"
echo "  SELECT COUNT(*) FROM Productos WHERE subcategoriaId IS NOT NULL;"
echo ""
