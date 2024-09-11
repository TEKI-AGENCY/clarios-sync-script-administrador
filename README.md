# SYNC TOOL PARA ADMINISTRADOR LANDINGS CLARIOS

## Acerca de

El presente repositorio alberga la base de código para actualizar de forma externa al sistema las baterías y relación de las mismas con el catálogo de aplicaciones de vehículos. **El presente script solo debe correrse para actualizar la base de datos de producción en los elementos descritos.**

### Consideraciones generales

- Esta herramienta se debe utilizar solo para actualizar la BD de producción del administrador de los landings de Clarios (MAC, VARTA y TUDOR).
- Siga los pasos de actualización sin omitir ninguno para asegurar una actualización exitosa.
- Antes de comenzar algún procedimiento siempre extraiga un backup de las bases de datos del administrador de los landings de Clarios (MAC, VARTA y TUDOR).
- Antes de ejecutar los cambios en producción, recree en su ambiente local el sitio de MAC y el administrador para validar los ajustes. _No se debe correr el script en producción sin hacer una validación previa en local_

## Requerimientos

- Node v20 LTS
- TypeScript v5
- Prisma v5
- Docker v27

## Instalación del proyecto

Para instalar el proyecto siga los siguientes pasos:

### Instalación de dependencias

```
pnpm install
```

### Ejecución del proyecto

- Copiar `.env.test` a `.env`
- Reemplazar las variables de entorno. Siga las instrucciones en el archivo `.env.test`.
- Levantar contenedor para pruebas locales.

```
docker compose up -d
```

- Ejecutar el proyecto en entorno de desarrollo.

```
pnpm dev
```

- Ejecutar el proyecto en entorno de producción.

```
pnpm build
pnpm start
```

## Proceso de actualización

### Proyecto Sitio Web (WordPress)

1. Obtenga una copia del sitio en su ambiente local junto con la BD.
2. Verifique que las consultas de baterías se hacen a su administrador de baterías (Proyecto Laravel) levantado también en un ambiente local.

_No olvide primero realizar pruebas en local antes de afectar la BD de producción_

### Proyecto Admin (Laravel)

1. Para la actualización del proyecto del administrador de Clarios (Laravel) no es necesario interactuar con él, solo se debe afectar la BD para actualizar las referencias de las baterías y generar su relación con el nuevo catálogo de aplicaciones que suministra el cliente.
2. Obtenga una copia de la BD de producción del administrador.
3. Levante un contenedor para albergar la copia de la BD, esto para efectos de pruebas antes de lanzar el script a producción. El proyecto tiene una definición del servicio que puede levantar fácilmente usando el comando `docker compose up -d`.
4. Importe los datos de la BD de producción a la BD de pruebas.
5. Verifique que la cadena de conexión en el fichero `.env` esté apuntando a la base de datos de pruebas.
6. Tome el archivo excel compartido por el cliente con las especificaciones de vehículos y elimine los rows necesarios para tener el header de un solo row.
7. Elimine las columnas redundantes, solo debe tener las siguientes columnas en el archivo: CATEGORIA,MARCA,MODELO,LINEA,PERIODO,COMBUSTIBLE,TECNOLOGIA,CILINDRAJE,POLARIDAD. **Todas en mayúscula sostenida**

Para las referencias de baterías, solo debe depurar las columnas que contengan dichas referencias. Las columnas deben de ser nombradas con el nombre de la marca según el caso y un consecutivo de acuerdo a su orden en el archivo de la siguiente forma: `MAC-1, MAC-2, MAC-n`.

Los formatos válidos son `MAC-<número>`, `VARTA-<número>`, `TUDOR-<número>`.

8. Exporte el archivo a formato `.csv` bajo el nombre `admin-vehicles.csv` y ubique el archivo dentro de la herramienta de sincronización `dist/sync/admin-vehicles.csv`.
9. Corra el script `pnpm start` y verifique el resultado.

### Correr script de actualización en producción

1. Para correr el script de actualización en producción debe generar un túnel al servidor remoto:

```
ssh -i /ruta/a/llave_privada -L [local_port]:[remote_host]:[remote_port] [ssh_user]@[ssh_host]
```

**Parámetros**

- **-i /ruta/a/llave_privada:** Especifica la ruta a tu archivo de llave privada SSH.
- **local_port:** El puerto local de tu máquina donde se redirigirá el tráfico.
- **remote_host:** El host remoto que ofrece el servicio (puede ser localhost si el servicio está en la misma máquina que el servidor SSH).
- **remote_port:** El puerto del servicio en el host remoto.
- **ssh_user:** El nombre de usuario que usas para conectarte al servidor SSH.
- **ssh_host:** El servidor al que te conectas por SSH.

2. Una vez establecido el túnel con el servidor remoto, cambie los datos de la cadena de conexión.
3. Ejecute el script con el comando `pnpm start` y verifique el mensaje de éxito de la sincronización.
4. Una vez actualizado el catálogo en el administrador se da por concluido el procedimiento.
