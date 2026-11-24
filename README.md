# 🫧 Un pedacito de océano para ti

Una página delicada, interactiva y **responsiva** con un caballito de mar tridimensional, corales, peces, burbujas, luz submarina y una carta escondida en una conchita.

Está dedicada a una persona especial **sin mencionar su nombre**. La frase y la carta se pueden editar fácilmente en `index.html`.

## Qué incluye

- Océano 3D con **Three.js**, creado por código (no utiliza modelos ni texturas de pago).
- Caballito de mar modelado con geometrías 3D, cola en espiral y aletas móviles.
- Coral, algas, medusas, peces, estrellas marinas, arena y burbujas.
- Cámara que se mueve al arrastrar con ratón o dedo.
- Botón para crear burbujas y una conchita que abre un mensaje tierno.
- Diseño adaptado para computadora y celular.
- Respeto a la preferencia del dispositivo de reducir animaciones.
- **Ilustración de respaldo** si falla la conexión a Three.js o WebGL.

## Publicar en GitHub Pages

1. Crea un repositorio público, por ejemplo `un-rincon-del-oceano`.
2. Sube a la raíz del repositorio los archivos `index.html`, `styles.css` y `ocean.js` (no necesitas `npm`, compilador, ni instalar nada).
3. En GitHub abre **Settings → Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**; selecciona `main` y carpeta `/(root)` y guarda.
5. GitHub Pages mostrará la dirección publicada en esa pantalla. Normalmente sigue el patrón `https://TU_USUARIO.github.io/un-rincon-del-oceano/`.

## Ejecutar en tu PC

Por seguridad de los módulos JavaScript, mejor usa un servidor local. Por ejemplo, con Python instalado:

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000`.

También puedes usar la extensión **Live Server** de VS Code.

## Personalizar

- **Frase principal:** busca `<h1>` y `<p class="lead">` en `index.html`.
- **Carta secreta:** busca la sección `id="letter-overlay"` en `index.html`.
- **Colores/tipografía:** edita variables `:root` en `styles.css`.
- **Escena y personajes:** edita la función `buildWorld()` en `ocean.js`.

## Dependencia

El modelo 3D utiliza `three@0.160.1` desde jsDelivr. Al abrir la página debe existir conexión a internet para cargar la biblioteca y las fuentes de Google; la ilustración SVG integrada funciona sin esas dependencias.

Hecho con cariño ♡
