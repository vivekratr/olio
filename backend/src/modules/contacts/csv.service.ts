import { parse } from "csv-parse";
import { Readable } from "node:stream";
import { AppError } from "../../common/errors/app-error.js";
import { REQUIRED_CSV_HEADERS } from "./contact.schema.js";

export interface ParsedCsvRow {
  rowNumber: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  tags: string[];
}

export interface CsvParseResult {
  parsedRows: ParsedCsvRow[];
  invalidRows: ParsedCsvRow[];
}

export class CsvService {
  async parse(buffer: Buffer): Promise<CsvParseResult> {
    const parsedRows: ParsedCsvRow[] = [];
    const invalidRows: ParsedCsvRow[] = [];
    let headersValidated = false;
    let rowNumber = 1;

    return new Promise((resolve, reject) => {
      const parser = parse({
        columns: (headers: string[]) => {
          this.validateHeaders(headers);
          headersValidated = true;
          return headers.map((header) => header.trim());
        },
        skip_empty_lines: true,
        trim: false,
        cast: false,
        relax_column_count: true,
      });

      parser.on("readable", () => {
        let record: Record<string, string | undefined> | null;

        while ((record = parser.read()) !== null) {
          rowNumber += 1;

          if (this.isEmptyRow(record)) {
            continue;
          }

          const row = this.toParsedRow(record, rowNumber);

          if (this.isValidRow(row)) {
            parsedRows.push(row);
          } else {
            invalidRows.push(row);
          }
        }
      });

      parser.on("error", (error: Error) => {
        if (error instanceof AppError) {
          reject(error);
          return;
        }

        reject(new AppError(`Failed to parse CSV: ${error.message}`, 400));
      });

      parser.on("end", () => {
        if (!headersValidated) {
          reject(new AppError("CSV file is empty or missing headers", 400));
          return;
        }

        resolve({ parsedRows, invalidRows });
      });

      Readable.from(buffer).pipe(parser);
    });
  }

  private validateHeaders(headers: string[]): void {
    const normalized = headers.map((header) => header.trim().toLowerCase());

    for (const required of REQUIRED_CSV_HEADERS) {
      if (!normalized.includes(required)) {
        throw new AppError(`Missing required CSV header: ${required}`, 400);
      }
    }
  }

  private isEmptyRow(row: Record<string, string | undefined>): boolean {
    return Object.values(row).every((value) => !value?.trim());
  }

  private toParsedRow(
    row: Record<string, string | undefined>,
    rowNumber: number,
  ): ParsedCsvRow {
    const tagsValue = row.tags?.trim() ?? "";

    return {
      rowNumber,
      name: row.name?.trim() ?? "",
      email: row.email?.trim() ?? "",
      phone: row.phone?.trim() ?? "",
      city: row.city?.trim() ?? "",
      tags: tagsValue
        ? tagsValue
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    };
  }

  private isValidRow(row: ParsedCsvRow): boolean {
    return Boolean(row.email) || Boolean(row.phone);
  }
}
