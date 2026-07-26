/**
 * Service layer — business logic for all modules.
 * Rules:
 *   - Services are the single source of truth for business rules.
 *   - Controllers call services, never repositories directly.
 *   - Services call repositories and return DTOs or throw typed exceptions.
 */
package com.pict.gatesecurity.service;
