# Sistema de Triaje Automatizado de Urgencias Médicas

**Hospital Isidro Ayora - Loja, Ecuador**  
*Proyecto Integrador - Estructuras de Datos (Grupo 8)*

Prototipo interactivo para la gestión y re-categorización dinámica de pacientes en la sala de urgencias. Implementa un **Max-Heap** ($O(\log n)$) para el ranking de prioridad en tiempo real y una **Lista Enlazada Ordenada** para la trazabilidad e historial clínico, optimizando el consumo de memoria en el motor V8.

---

## 👥 Equipo de Trabajo (Grupo 8)

* Darwin Campoverde
* Javier Guarnizo
* Ricardo Ochoa
* Diyer Torres
* Mateo Yanangomez

---

## 🎯 Objetivos del Proyecto

* **Objetivo General:** Desarrollar un prototipo de triaje automatizado para el Hospital Isidro Ayora que organice dinámicamente la atención de pacientes en función de la severidad (Escala ESI) y la variabilidad de sus signos vitales mediante un Max-Heap.
* **Objetivos Específicos:**
  1. Diseñar e implementar una estructura de datos **Max-Heap** en TypeScript con métodos de flotación (`heapifyUp`) y hundimiento (`heapifyDown`) de complejidad $O(\log n)$.
  2. Implementar una **Lista Enlazada Ordenada** para auditar el historial de pacientes atendidos, garantizando la desvinculación explícita de punteros para prevenir fugas de memoria (*memory leaks*).
  3. Crear una interfaz en React y Tailwind CSS que visualice el tiempo promedio de espera y emita alertas inmediatas ante variaciones térmicas, hemodinámicas o respiratorias.

---

## 🛠️ Arquitectura y Tecnologías

* **Lenguaje:** TypeScript 5+ (Tipado estricto)
* **Frontend Framework:** React 18+ / Vite
* **Estilos:** Tailwind CSS v4
* **Estructuras de Datos:** Max-Heap y LinkedList (Implementación artesanal en TypeScript puro)

---

## 📖 Guía de Instalación, Configuración y Despliegue

Sigue este tutorial para ejecutar el proyecto de forma local o desplegarlo en la nube.

### 📋 Prerrequisitos
* **Node.js**: v18.0.0 o superior
* **npm**: v9.0.0 o superior
* **Git** instalado en el sistema

---

### 💻 1. Configuración y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/TheJavier37/triaje-hospital-isidro-ayora.git](https://github.com/TU_USUARIO/triaje-hospital-isidro-ayora.git)
   cd triaje-hospital-isidro-ayora