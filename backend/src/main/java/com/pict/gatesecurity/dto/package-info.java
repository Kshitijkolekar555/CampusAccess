/**
 * DTOs (Data Transfer Objects) — the only types exposed in API requests/responses.
 *
 * Sub-packages:
 *   request/  — Inbound DTOs (@Valid annotations, Bean Validation constraints)
 *   response/ — Outbound DTOs (never include sensitive fields like passwordHash)
 */
package com.pict.gatesecurity.dto;
