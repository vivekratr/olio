import { AppError } from "../../common/errors/app-error.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type {
  AudienceField,
  AudienceFilter,
  AudienceOperator,
  AudienceRule,
} from "./audience.types.js";

const SUPPORTED_FIELDS = new Set<AudienceField>([
  "tag",
  "name",
  "email",
  "phone",
  "customFields.city",
]);

const SUPPORTED_OPERATORS = new Set<AudienceOperator>([
  "eq",
  "neq",
  "contains",
  "in",
]);

export class AudienceQueryBuilder {
  build(filter: AudienceFilter): Prisma.ContactWhereInput {
    const conditions = filter.rules.map((rule) => this.buildRule(rule));

    if (conditions.length === 0) {
      return {};
    }

    const match = filter.match ?? "all";
    if (match === "all") {
      return { AND: conditions };
    }

    return { OR: conditions };
  }

  private buildRule(rule: AudienceRule): Prisma.ContactWhereInput {
    this.assertSupportedField(rule.field);
    this.assertSupportedOperator(rule.operator);

    switch (rule.field) {
      case "name":
      case "email":
      case "phone":
        return this.buildStringField(rule.field, rule.operator, rule.value);
      case "tag":
        return this.buildTagField(rule.operator, rule.value);
      case "customFields.city":
        return this.buildCustomField("city", rule.operator, rule.value);
      default: {
        const exhaustiveField: never = rule.field;
        throw new AppError(`Unknown field: ${exhaustiveField}`, 400);
      }
    }
  }

  private buildStringField(
    field: "name" | "email" | "phone",
    operator: AudienceOperator,
    value: unknown,
  ): Prisma.ContactWhereInput {
    switch (operator) {
      case "eq":
        return {
          [field]: {
            equals: this.assertStringValue(value, field, operator),
            mode: "insensitive",
          },
        };
      case "neq":
        return {
          NOT: {
            [field]: {
              equals: this.assertStringValue(value, field, operator),
              mode: "insensitive",
            },
          },
        };
      case "contains":
        return {
          [field]: {
            contains: this.assertStringValue(value, field, operator),
            mode: "insensitive",
          },
        };
      case "in":
        return {
          [field]: { in: this.assertStringArrayValue(value, field, operator) },
        };
      default: {
        const exhaustiveOperator: never = operator;
        throw new AppError(`Unknown operator: ${exhaustiveOperator}`, 400);
      }
    }
  }

  private buildTagField(
    operator: AudienceOperator,
    value: unknown,
  ): Prisma.ContactWhereInput {
    const field = "tag";

    switch (operator) {
      case "eq":
        return {
          contactTags: {
            some: {
              tag: {
                name: {
                  equals: this.assertStringValue(value, field, operator),
                  mode: "insensitive",
                },
              },
            },
          },
        };
      case "neq":
        return {
          NOT: {
            contactTags: {
              some: {
                tag: {
                  name: {
                    equals: this.assertStringValue(value, field, operator),
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        };
      case "contains":
        return {
          contactTags: {
            some: {
              tag: {
                name: {
                  contains: this.assertStringValue(value, field, operator),
                  mode: "insensitive",
                },
              },
            },
          },
        };
      case "in":
        return {
          contactTags: {
            some: {
              tag: {
                name: {
                  in: this.assertStringArrayValue(value, field, operator),
                },
              },
            },
          },
        };
      default: {
        const exhaustiveOperator: never = operator;
        throw new AppError(`Unknown operator: ${exhaustiveOperator}`, 400);
      }
    }
  }

  private buildCustomField(
    key: string,
    operator: AudienceOperator,
    value: unknown,
  ): Prisma.ContactWhereInput {
    const field = `customFields.${key}`;

    switch (operator) {
      case "eq":
        return {
          customFields: {
            path: [key],
            equals: this.assertStringValue(value, field, operator),
          },
        };
      case "neq":
        return {
          NOT: {
            customFields: {
              path: [key],
              equals: this.assertStringValue(value, field, operator),
            },
          },
        };
      case "contains":
        return {
          customFields: {
            path: [key],
            string_contains: this.assertStringValue(value, field, operator),
          },
        };
      case "in": {
        const values = this.assertStringArrayValue(value, field, operator);
        return {
          OR: values.map((item) => ({
            customFields: {
              path: [key],
              equals: item,
            },
          })),
        };
      }
      default: {
        const exhaustiveOperator: never = operator;
        throw new AppError(`Unknown operator: ${exhaustiveOperator}`, 400);
      }
    }
  }

  private assertSupportedField(field: string): asserts field is AudienceField {
    if (!SUPPORTED_FIELDS.has(field as AudienceField)) {
      throw new AppError(`Unknown field: ${field}`, 400);
    }
  }

  private assertSupportedOperator(
    operator: string,
  ): asserts operator is AudienceOperator {
    if (!SUPPORTED_OPERATORS.has(operator as AudienceOperator)) {
      throw new AppError(`Unknown operator: ${operator}`, 400);
    }
  }

  private assertStringValue(
    value: unknown,
    field: string,
    operator: string,
  ): string {
    if (typeof value !== "string") {
      throw new AppError(
        `Field "${field}" with operator "${operator}" requires a string value`,
        400,
      );
    }

    return value;
  }

  private assertStringArrayValue(
    value: unknown,
    field: string,
    operator: string,
  ): string[] {
    if (
      !Array.isArray(value) ||
      value.length === 0 ||
      value.some((item) => typeof item !== "string")
    ) {
      throw new AppError(
        `Field "${field}" with operator "${operator}" requires a non-empty array of strings`,
        400,
      );
    }

    return value;
  }
}
