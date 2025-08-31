# OTP Verification System

This document outlines the OTP (One-Time Password) verification system implemented for user authentication.

## Overview

The system provides phone number verification using OTPs sent via SMS. It includes:

- OTP generation and validation
- Rate limiting to prevent abuse
- Automatic cleanup of expired OTPs
- User management

## Database Schema

### otp_verifications
Stores OTP codes and their verification status.

| Column      | Type      | Description                                   |
|-------------|-----------|-----------------------------------------------|
| id          | UUID      | Primary key                                   |
| phone_number| TEXT      | User's phone number                           |
| otp_code    | TEXT      | The OTP code (6 digits)                       |
| expires_at  | TIMESTAMPTZ| When the OTP expires                         |
| verified    | BOOLEAN   | Whether the OTP has been verified             |
| created_at  | TIMESTAMPTZ| When the OTP was created                     |
| updated_at  | TIMESTAMPTZ| Last update timestamp                        |

### users
Stores user information.

| Column      | Type      | Description                                   |
|-------------|-----------|-----------------------------------------------|
| id          | UUID      | Primary key                                   |
| phone_number| TEXT      | User's phone number (unique)                  |
| created_at  | TIMESTAMPTZ| When the user was created                    |
| updated_at  | TIMESTAMPTZ| Last update timestamp                        |
| last_login  | TIMESTAMPTZ| When the user last logged in                 |

## API Endpoints

### Send OTP

**Path:** `/api/send-otp`
**Method:** `POST`
**Body:** `{ "phone_number": "+1234567890" }`

**Responses:**
- `200`: OTP sent successfully
- `400`: Invalid phone number
- `429`: Too many requests
- `500`: Server error

### Verify OTP

**Path:** `/api/verify-otp`
**Method:** `POST`
**Body:** `{ "phone_number": "+1234567890", "otp_code": "123456" }`

**Responses:**
- `200`: OTP verified, user authenticated
- `400`: Invalid request
- `401`: Invalid or expired OTP
- `500`: Server error

## Security Considerations

- OTPs expire after 10 minutes
- Rate limiting: 5 attempts per phone number per 10 minutes
- OTPs are hashed before storage
- Database cleanup runs daily to remove expired OTPs

## Environment Variables

- `BREVO_API_KEY`: API key for Brevo SMS service
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## Setup

1. Set up the required environment variables
2. Run database migrations:
   ```bash
   npx supabase db reset
   ```
3. The system is ready to use!

## Testing

1. Use the `/api/send-otp` endpoint to request an OTP
2. Check the console logs for the OTP (in development)
3. Verify the OTP using the `/api/verify-otp` endpoint
