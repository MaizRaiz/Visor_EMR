# Visor_EMR_v6

Visor de Cobertura Municipal del Componente **El Maíz es la Raíz**.

## Cambios incluidos

- Solo se cargan municipios con `COB_BIN = 1` y `COB_BIN = 2`.
- `COB_BIN = 1`: Cobertura “El Maíz es la Raíz”, Pantone 7420/7421 con transparencia.
- `COB_BIN = 2`: Comaleras Bienestar, Pantone 1255 C (`#cfb579`) con transparencia.
- La leyenda no muestra códigos técnicos.
- La ventana emergente incluye el logo oficial y muestra municipio, estado y coordinación.
- Se integra el directorio de Coordinaciones Estatales en `data/coordinaciones.json`.
- Al seleccionar un municipio se muestra el contacto de la coordinación: responsable, teléfono, correo, dirección y enlace de Google Maps.

## Estadísticas de la capa

- Municipios visibles: 684
- El Maíz es la Raíz: 636
- Comaleras Bienestar: 48

## Ejecución local

Abrir la carpeta en Visual Studio Code y ejecutar `index.html` con **Live Server**.

## Publicación en GitHub Pages

Subir el contenido de esta carpeta a un repositorio de GitHub y activar Pages desde `Settings > Pages`.


## Versión 7
- Se actualizó el directorio de Coordinaciones Estatales.
- Quintana Roo ya muestra su oficina correspondiente.
- Los municipios del Estado de México se atienden mediante Oficinas Centrales en Ciudad de México.
