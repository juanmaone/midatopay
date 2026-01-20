# MidatoPay API v1

!API Version
!License

**URL Base:** `https://api.midatopay.com/v1`

## Tabla de Contenidos

- Introducción
- Empezando
- Autenticación
- Endpoints
  - Autenticación
    - `POST /auth/generate-api-keys`
    - `POST /auth/token`
  - Pagos
    - `POST /sdk/payments`
- Modelos de Datos
- Flujo de Ejemplo Completo (cURL)
- Códigos de Error Comunes

## Introducción

Bienvenido a la API de MidatoPay. Esta API REST te permite integrar las funcionalidades de pago de MidatoPay directamente en tus aplicaciones, sitios web o sistemas de punto de venta, permitiéndote generar cobros en criptomonedas de forma programática.

La API utiliza un sistema de autenticación basado en Bearer Tokens (JWT) que se obtienen a través de claves de API. Todas las respuestas de la API son en formato JSON.

## Empezando

Para comenzar a usar la API, sigue estos pasos:

1.  **Regístrate en MidatoPay**: Crea una cuenta de comerciante en nuestra plataforma.
2.  **Genera tus API Keys**: Desde tu panel de control, genera un par de credenciales: una `apiKey` (pública) y una `apiSecret` (privada).
3.  **Autentícate y Crea Pagos**: Sigue el flujo de autenticación descrito a continuación para obtener un token temporal y comenzar a crear solicitudes de pago.

## Autenticación

El acceso a los endpoints del SDK está protegido y requiere un `token` JWT. Este token tiene una vida útil de **1 hora** y debe ser enviado en la cabecera `Authorization` de cada solicitud.

El flujo de autenticación es el siguiente:

1.  **Generar API Keys**: Desde el panel de tu cuenta de MidatoPay, genera un par de credenciales: una `apiKey` (pública) y una `apiSecret` (privada). Este paso solo se realiza una vez.
2.  **Obtener Token de API**: Usa tu `apiKey` y `apiSecret` para llamar al endpoint `POST /auth/token`. La respuesta te dará un `token` JWT.
3.  **Realizar Llamadas**: Incluye el `token` JWT en la cabecera de tus solicitudes a los endpoints del SDK: `Authorization: Bearer <tu_token_jwt>`.

---

## Endpoints

### Autenticación

Endpoints para gestionar la autenticación y las credenciales de la API.

---

### `POST /auth/generate-api-keys`

Genera un nuevo par de `apiKey` y `apiSecret` para el comerciante autenticado.

> **Nota Importante**: Este endpoint es para ser usado desde un entorno seguro (como el panel de control de MidatoPay) y requiere un **token de sesión de usuario** (obtenido al hacer login en la plataforma), no un token de API.

**Seguridad:**
*   **Tipo:** Bearer Token (Token de sesión de usuario)

#### Respuestas

*   **`200 OK`** - API Keys generadas exitosamente.

    ```json
    {
      "message": "API Keys generadas exitosamente. Guarda tu apiSecret en un lugar seguro, no se mostrará de nuevo.",
      "apiKey": "mp_pk_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      "apiSecret": "mp_sk_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2"
    }
    ```

*   **`401 Unauthorized`** - El token de sesión de usuario no es válido o no fue proporcionado.

    ```json
    {
      "error": "Token requerido",
      "message": "Debes proporcionar un token de autenticación",
      "code": "MISSING_TOKEN"
    }
    ```

---

### `POST /auth/token`

Intercambia una `apiKey` y `apiSecret` por un token JWT de corta duración (`1 hora`) para usar en los endpoints del SDK. Este es el primer paso que tu integración debe realizar.

**Parámetros del Body:**

| Nombre | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `apiKey` | string | Sí | Tu clave de API pública (`mp_pk_...`). |
| `apiSecret` | string | Sí | Tu secreto de API (`mp_sk_...`). |

#### Ejemplo de Request Body

```json
{
  "apiKey": "mp_pk_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "apiSecret": "mp_sk_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2"
}
```

**Respuestas:**

*   **`200 OK`** - Token generado exitosamente.

    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWh6ZThxZm4wMDAwNGdwZGNnZTVoZzY3Iiwic2NvcGUiOiJhcGkiLCJpYXQiOjE3MzE2MTc5ODIsImV4cCI6MTczMTYyMTU4Mn0.abcdefg...",
      "expiresIn": 3600
    }
    ```

*   **`401 Unauthorized`** - Las credenciales de API son inválidas.

    ```json
    {
      "message": "Credenciales de API inválidas."
    }
    ```

---

<br>

### Pagos

Endpoints para crear y gestionar solicitudes de pago.

---

#### `POST /sdk/payments`

Crea una nueva solicitud de pago (cobro) y devuelve los datos necesarios para generar un código QR.

**Seguridad:**
*   **Tipo:** Bearer Token (Token de API obtenido desde `POST /auth/token`)

**Parámetros del Body:**

| Nombre | Tipo | Requerido | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `amount` | number | Sí | | Monto del cobro. |
| `currency` | string | No | `ARS` | Moneda del monto (`ARS` o `USDT`). |
| `concept` | string | No | `Pago recibido` | Descripción o concepto del pago. |

**Request Body Ejemplo:**

```json
{
  "amount": 1500.50,
  "currency": "ARS",
  "concept": "Venta de producto #XYZ"
}
```

**Respuestas:**

*   **`201 Created`** - Solicitud de pago creada exitosamente.

    ```json
    {
      "paymentId": "cmhze8rnb00394gpdycszdcxz",
      "qrData": {
        "protocol": "starknet",
        "recipient": "0x01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
        "params": {
          "amount": 1.5005,
          "payment_id": "cmhze8rnb00394gpdycszdcxz"
        },
        "fullString": "starknet:0x01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2?amount=1.500500&payment_id=cmhze8rnb00394gpdycszdcxz"
      },
      "amountARS": 1500.5,
      "amountUSDT": 1.5005,
      "walletDestino": "0x01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
      "expiresAt": "2025-11-14T22:07:29.676Z"
    }
    ```

*   **`400 Bad Request`** - Faltan datos, son incorrectos o el comerciante no tiene una wallet configurada.

    ```json
    {
      "message": "El monto debe ser un número positivo."
    }
    ```
    ```json
    {
      "message": "El comerciante no tiene una wallet configurada para recibir pagos."
    }
    ```

*   **`401 Unauthorized`** - El token de API no es válido o ha expirado.

    ```json
    {
      "error": "Token de API expirado",
      "message": "Tu token de API ha expirado. Por favor, genera uno nuevo.",
      "code": "API_TOKEN_EXPIRED"
    }
    ```

*   **`403 Forbidden`** - El token proporcionado no tiene el `scope` correcto (ej. se usó un token de sesión de usuario).

    ```json
    {
      "error": "Permiso denegado",
      "message": "El token proporcionado no es válido para el acceso a la API.",
      "code": "INVALID_TOKEN_SCOPE"
    }
    ```

---

## Modelos de Datos

### Objeto `qrData`

Este objeto contiene todos los componentes necesarios para construir una URL de pago o generar un código QR.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `protocol` | string | El protocolo de la blockchain (`starknet`). |
| `recipient` | string | La dirección de la wallet del comerciante que recibirá el pago. |
| `params` | object | Un objeto con los parámetros de la transacción. |
| `params.amount` | number | El monto a pagar en la criptomoneda (ej. USDT), en formato legible. |
| `params.payment_id` | string | El ID único del pago, útil para trazabilidad. |
| `fullString` | string | La cadena completa y formateada, lista para ser convertida en un código QR. |

---

## Flujo de Ejemplo Completo (cURL)

Aquí se muestra un flujo completo desde la obtención del token hasta la creación de un pago.

### 1. Obtener Token de API

```bash
# Reemplaza con tus credenciales reales
curl --location 'https://api.midatopay.com/v1/auth/token' \
--header 'Content-Type: application/json' \
--data '{
    "apiKey": "mp_pk_...",
    "apiSecret": "mp_sk_..."
}'
```

> Copia el `token` de la respuesta. Lo llamaremos `SDK_JWT`.

### 2. Crear una Solicitud de Pago

```bash
# Reemplaza TU_SDK_JWT con el token del paso anterior
curl --location 'https://api.midatopay.com/v1/sdk/payments' \
--header 'Authorization: Bearer TU_SDK_JWT' \
--header 'Content-Type: application/json' \
--data '{
    "amount": 2500,
    "currency": "ARS",
    "concept": "Orden #555-ABC"
}'
```

La respuesta de esta llamada te proporcionará el objeto `qrData` que puedes usar para mostrar el código QR a tu cliente final.

---

## Códigos de Error Comunes

| Código HTTP | Código Interno | Descripción |
| :--- | :--- | :--- |
| `400 Bad Request` | `INVALID_DATA` | Los datos enviados en la solicitud son incorrectos o están incompletos. |
| `401 Unauthorized` | `MISSING_API_TOKEN` | No se proporcionó un token de autenticación. |
| `401 Unauthorized` | `API_TOKEN_EXPIRED` | El token de API ha expirado. Se debe solicitar uno nuevo. |
| `401 Unauthorized` | `INVALID_CREDENTIALS` | La `apiKey` o `apiSecret` son incorrectas. |
| `403 Forbidden` | `INVALID_TOKEN_SCOPE` | Se usó un token que no es para la API (ej. un token de sesión). |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` | Se ha superado el límite de solicitudes permitidas. |
| `500 Internal Server Error` | `INTERNAL_SERVER_ERROR` | Ocurrió un error inesperado en el servidor. |
