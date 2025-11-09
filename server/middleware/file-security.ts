/**
 * File upload security utilities
 * Provides additional validation beyond MIME type checking
 */

import path from 'path';
import { Request } from 'express';

/**
 * File type signatures (magic numbers) for validation
 * First few bytes of file content to verify actual file type
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  // MS Office formats use ZIP signature
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04]],
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0]], // Old .doc format
  'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0]], // Old .xls format
  'text/plain': [], // No magic number for text
  'text/csv': [], // No magic number for CSV
};

/**
 * Allowed file extensions by MIME type
 */
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/msword': ['.doc'],
  'application/vnd.ms-excel': ['.xls'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
};

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename);

  // Remove potentially dangerous characters
  const sanitized = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars with underscore
    .replace(/\.{2,}/g, '.') // Prevent multiple dots
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255); // Limit length

  // Ensure we have a valid filename
  if (!sanitized || sanitized === '.') {
    return `file_${Date.now()}`;
  }

  return sanitized;
}

/**
 * Validate file extension matches MIME type
 */
export function validateExtension(filename: string, mimeType: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = ALLOWED_EXTENSIONS[mimeType];

  if (!allowedExts) {
    return false; // Unknown MIME type
  }

  // Text files can have no extension or allowed extensions
  if (mimeType === 'text/plain' || mimeType === 'text/csv') {
    return true; // Allow any extension for text
  }

  return allowedExts.includes(ext);
}

/**
 * Validate file content matches declared MIME type using magic numbers
 */
export function validateFileContent(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType];

  // If no signatures defined (text files), skip validation
  if (!signatures || signatures.length === 0) {
    return true;
  }

  // Check if buffer starts with any of the valid signatures
  return signatures.some(signature => {
    if (buffer.length < signature.length) {
      return false;
    }

    return signature.every((byte, index) => buffer[index] === byte);
  });
}

/**
 * Get file size limits from environment
 */
export function getFileSizeLimits() {
  const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10');
  return {
    maxSizeBytes: maxSizeMB * 1024 * 1024,
    maxSizeMB,
  };
}

/**
 * Get allowed MIME types from environment
 */
export function getAllowedMimeTypes(): string[] {
  const envMimes = process.env.ALLOWED_MIME_TYPES;

  if (envMimes) {
    return envMimes.split(',').map(m => m.trim());
  }

  // Default allowed types
  return [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];
}

/**
 * Comprehensive file validation
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

export function validateUploadedFile(
  file: Express.Multer.File
): FileValidationResult {
  // 1. Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.originalname);

  // 2. Validate file size
  const { maxSizeBytes, maxSizeMB } = getFileSizeLimits();
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // 3. Validate MIME type is allowed
  const allowedMimes = getAllowedMimeTypes();
  if (!allowedMimes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed`,
    };
  }

  // 4. Validate extension matches MIME type
  if (!validateExtension(sanitizedFilename, file.mimetype)) {
    return {
      valid: false,
      error: `File extension does not match file type`,
    };
  }

  // 5. Validate file content (magic numbers)
  if (!validateFileContent(file.buffer, file.mimetype)) {
    return {
      valid: false,
      error: `File content does not match declared type (possible spoofing)`,
    };
  }

  return {
    valid: true,
    sanitizedFilename,
  };
}

/**
 * Security headers for file downloads
 */
export function setDownloadSecurityHeaders(res: any, filename: string): void {
  // Prevent content type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent rendering in browser (force download)
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(filename)}"`);

  // Prevent caching of sensitive files
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

/**
 * TODO: For production deployment, integrate virus scanning
 *
 * Recommended solutions:
 * 1. ClamAV (open source) - https://www.clamav.net/
 *    - Install: apt-get install clamav clamav-daemon
 *    - Node package: clamscan (npm install clamscan)
 *
 * 2. Cloud-based scanning:
 *    - AWS S3 + Lambda with ClamAV
 *    - VirusTotal API (for low volume)
 *    - MetaDefender Cloud
 *
 * Example integration:
 * ```typescript
 * import NodeClam from 'clamscan';
 *
 * const clam = new NodeClam().init({
 *   clamdscan: { host: 'localhost', port: 3310 }
 * });
 *
 * const { isInfected, viruses } = await clam.scanBuffer(file.buffer);
 * if (isInfected) {
 *   throw new Error(`Virus detected: ${viruses.join(', ')}`);
 * }
 * ```
 */
