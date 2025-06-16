# 🗂️ CacheDash Examples — Master Index  
*(English first · Español después)*

---

## 📖 Overview (EN)

The **`examples/`** directory is split into **three sub‑folders** so you can pick **exactly the flavour you need**:

| Folder | Contents | Ideal when you… |
|--------|----------|-----------------|
| **`EN/`**   | 11 **reference snippets** in English. Each file is richly commented but intentionally **non‑runnable**: they rely on async IIFEs, placeholders instead of live APIs, and zero external dependencies. | • Work in English.<br>• Just need copy‑paste patterns.<br>• Want fast onboarding without clutter. |
| **`ES/`**   | The **same snippets** as *EN* but with all headings and comments in Spanish. Code blocks are byte‑for‑byte identical, so diff noise is zero. | • Work in Spanish.<br>• Give workshops or slides in ES.<br>• Need 1‑to‑1 parity with the English docs. |
| **`DEMO/`** | A **runnable subset** (TypeScript). Every file can be executed with `ts-node` and prints to the console. The demos are safe—no live APIs, no DB writes—so you can tweak and rerun freely. | • Need a quick PoC.<br>• Want to see CacheDash “in action”.<br>• Perform rapid regression checks. |

> **Note:** **EN** and **ES** are *documentation only*; **DEMO** is the *only* folder wired for execution.

### 🚀 Quick Start (EN)

```bash
git clone <repo>
cd examples/DEMO
npm install
ts-node demo-basic-local.ts        # or any demo-*.ts
```

**Requirements**

* Node ≥ 18  
* TypeScript → `npm i -g typescript ts-node`  
* For Redis demos: local Redis → `docker run -p 6379:6379 redis`

### 🗺 Folder map

```
examples/
├── EN/          # 1-basic-local.ts … 11-advanced-orchestration.ts
│   └── README.md
├── ES/          # identical files, comments in ES
│   └── README.md
└── DEMO/
    ├── demo-basic-local.ts
    ├── demo-basic-redis.ts
    └── …
```

---

## 📖 Descripción general (ES)

El directorio **`examples/`** se divide en **tres sub‑carpetas** para que elijas **exactamente el formato que necesitas**:

| Carpeta | Contenido | Úsala cuando… |
|---------|-----------|---------------|
| **`EN/`**   | 11 *snippets* de referencia en inglés. Archivos **no ejecutables**, con comentarios extensos. | • Tu equipo trabaja en inglés.<br>• Solo quieres copiar patrones.<br>• Buscas incorporación rápida. |
| **`ES/`**   | **Los mismos snippets** pero con comentarios y títulos en español. Bloques de código idénticos. | • Tu equipo es hispanohablante.<br>• Presentaciones o formación en ES. |
| **`DEMO/`** | Subconjunto **ejecutable** (TypeScript). Cada demo se lanza con `ts-node` y escribe en consola. Sin dependencias externas peligrosas. | • Pruebas de concepto.<br>• Mostrar CacheDash “en vivo”.<br>• Comprobaciones rápidas de regresión. |

> **Nota:** **EN** y **ES** son solo documentación; **DEMO** es la única lista para ejecutar.

### 🚀 Inicio rápido (ES)

```bash
git clone <repositorio>
cd examples/DEMO
npm install
ts-node demo-basic-local.ts        # o cualquier demo-*.ts
```

**Requisitos**

* Node ≥ 18  
* TypeScript → `npm i -g typescript ts-node`  
* Para demos Redis: contenedor local → `docker run -p 6379:6379 redis`

### 🗺 Estructura de carpetas

```
examples/
├── EN/   # 1-basic-local.ts … 11-advanced-orchestration.ts
├── ES/   # mismos archivos, comentarios ES
└── DEMO/ # scripts ejecutables
```

¡Feliz caching!
```