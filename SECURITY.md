# Política de seguridad

## Versiones con soporte

| Versión | Soporte |
|---|---|
| 1.x | ✅ |

## Reportar una vulnerabilidad

**No abras un issue público** para problemas de seguridad.

Repórtala de forma privada desde la pestaña **Security → Report a vulnerability** del repositorio ([GitHub Private Vulnerability Reporting](https://docs.github.com/es/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)).

Incluye, si puedes:

- Qué tipo de problema es (por ejemplo, ejecución de scripts al importar un archivo).
- Pasos para reproducirlo y un archivo de ejemplo **sin datos reales de personas**.
- El navegador y la versión.

Recibirás respuesta en un plazo razonable. Te avisaremos cuando haya una corrección y te daremos crédito si así lo deseas.

## Alcance

Fichaje se ejecuta por completo en el navegador y no tiene servidor. Las áreas más relevantes son:

- La importación de archivos CSV y JSON (datos no confiables).
- Las imágenes de firma guardadas en `localStorage`.
- La generación de la credencial a partir de los datos del usuario.
