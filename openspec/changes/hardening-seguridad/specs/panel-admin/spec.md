# Panel admin — Especificación (delta)

## Propósito

El panel admin no ejecuta contenido que provenga de datos ingresados por clientes.

## ADDED Requirements

### Requirement: HTML generado escapado

Todo HTML construido como texto en el frontend (impresión de pedidos en `ReportesPedidos`) MUST escapar cada valor interpolado con `escapeHtml()` (`& < > " '`). El frontend MUST NOT usar `dangerouslySetInnerHTML` ni `document.write` con datos sin escapar.

#### Scenario: ADMUI.1 — Nombre de cliente malicioso

- GIVEN un cliente registrado con nombre `<img src=x onerror=alert(1)>`
- AND un pedido suyo
- WHEN un administrador imprime ese pedido desde Reportes
- THEN la ventana de impresión muestra el texto literal
- AND no se ejecuta ningún script

#### Scenario: ADMUI.2 — Dirección maliciosa

- GIVEN un pedido cuya `direccionEnvio` contiene `"><script>…</script>`
- WHEN se imprime
- THEN el contenido aparece escapado
