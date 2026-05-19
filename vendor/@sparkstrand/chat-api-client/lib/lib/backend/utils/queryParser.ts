import { Operators, QueryNode, QueryCondition, SearchQuery } from '../../types';

/**
 * A class to parse search queries into Prisma-compatible query objects.
 * Supports nested AND/OR operations, various comparison operators, pagination, and sorting.
 */
export class QueryParser {
  /**
   * Parses a search query into a Prisma-compatible query object.
   * @param query - The search query containing query conditions, pagination, and sorting options.
   * @returns A Prisma query object with `where`, `take`, `skip`, `cursor`, and `orderBy` clauses.
   * @throws Error if the query is missing or invalid.
   */
  public parseSearchQuery(query: SearchQuery): any {
    if (!query.data.query) {
      throw new Error('Missing query in search request');
    }

    const where = this.parseQueryNode(query.data.query);
    const { pagination, sort } = query;

    // Handle pagination
    const take = pagination?.take ?? pagination?.per_page;
    const skip = pagination?.skip;
    let cursor;
    if (pagination?.starting_after) {
      cursor = { id: this.decodeStartingAfter(pagination.starting_after) };
    }

    // Handle sorting
    const orderBy = sort ? [{ [sort.field]: sort.order.toLowerCase() }] : undefined;

    return {
      where,
      ...(take && { take }),
      ...(skip && { skip }),
      ...(cursor && { cursor, skip: 1 }),
      ...(orderBy && { orderBy }),
    };
  }

  /**
   * Parses a query node containing AND or OR operations.
   * @param node - The query node with an operator (AND/OR) and values (conditions or nested nodes).
   * @returns A Prisma-compatible filter object (e.g., `{ AND: [...] }` or `{ OR: [...] }`).
   * @throws Error if the operator is unsupported.
   */
  private parseQueryNode(node: QueryNode): any {
    const conditions = node.value.map((item: any) =>
      'operator' in item ? this.parseQueryNode(item) : this.parseCondition(item as QueryCondition)
    );

    switch (node.operator) {
      case Operators.AND:
        return { AND: conditions };
      case Operators.OR:
        return { OR: conditions };
      default:
        throw new Error(`Unsupported operator: ${node.operator}`);
    }
  }

  /**
   * Parses an individual query condition (e.g., field comparison).
   * @param condition - The query condition with field, operator, and value.
   * @returns A Prisma-compatible filter object for the condition.
   * @throws Error if the field, value, or operator is invalid or unsupported.
   */
  private parseCondition(condition: QueryCondition): any {
    const { field, operator, value } = condition;

    // Validate field and value
    if (!field || value === undefined || value === null) {
      throw new Error(`Invalid condition: field=${field}, value=${value}`);
    }

    // Handle nested fields (e.g., 'company.applications.id')
    const fieldPath = field.split('.');
    const currentField: any = {};
    let temp = currentField;

    // Build nested structure for relation fields
    for (let i = 0; i < fieldPath.length - 1; i++) {
      temp[fieldPath[i]] = { some: {} };
      temp = temp[fieldPath[i]].some;
    }

    // Apply the condition operator
    const lastField = fieldPath[fieldPath.length - 1];
    switch (operator) {
      case Operators.EQUALS:
        temp[lastField] = { equals: value };
        break;
      case Operators.NOT_EQUALS:
        temp[lastField] = { not: { equals: value } };
        break;
      case Operators.GREATER_THAN:
        temp[lastField] = { gt: value };
        break;
      case Operators.LESS_THAN:
        temp[lastField] = { lt: value };
        break;
      case Operators.GREATER_THAN_OR_EQUAL:
        temp[lastField] = { gte: value };
        break;
      case Operators.LESS_THAN_OR_EQUAL:
        temp[lastField] = { lte: value };
        break;
      case Operators.IN:
        if (!Array.isArray(value)) {
          throw new Error(`IN operator requires an array value`);
        }
        temp[lastField] = { in: value };
        break;
      case Operators.CONTAINS:
        if (typeof value !== 'string') {
          throw new Error(`CONTAINS operator requires a string value`);
        }
        temp[lastField] = { contains: value, mode: 'insensitive' };
        break;
      default:
        throw new Error(`Unsupported condition operator: ${operator}`);
    }

    return currentField;
  }

  /**
   * Decodes a base64-encoded `starting_after` cursor for pagination.
   * Expects a JSON array with [timestamp, id, number] format.
   * @param startingAfter - The base64-encoded cursor string.
   * @returns The decoded ID to be used in Prisma's cursor-based pagination.
   * @throws Error if the cursor is invalid or cannot be decoded.
   */
  private decodeStartingAfter(startingAfter: string): string {
    try {
      // Decode base64 string
      const decoded = Buffer.from(startingAfter, 'base64').toString('utf-8');
      
      // Parse JSON array [timestamp, id, number]
      const [timestamp, id, number] = JSON.parse(decoded);
      
      // Validate the decoded components
      if (typeof timestamp !== 'number' || typeof id !== 'string' || typeof number !== 'number') {
        throw new Error('Invalid cursor format: expected [timestamp, id, number]');
      }

      return id;
    } catch (error: any) {
      throw new Error(`Failed to decode starting_after cursor: ${error?.message || error}`);
    }
  }
}


/* Example usage
async function searchContacts(client: PrismaClient, searchQuery: SearchQuery) {
  const parser = new QueryParser();
  const prismaQuery = parser.parseSearchQuery(searchQuery);
  
  return await client.contacts.findMany(prismaQuery);
}

// Example conversion of the provided query
const exampleQuery: SearchQuery = {
  data: {
    query: {
      operator: Operators.AND,
      value: [
        {
          operator: Operators.AND,
          value: [
            {
              field: 'updatedAt',
              operator: Operators.GREATER_THAN,
              value: 1560436650,
            },
            {
              field: 'lastRequestAt',
              operator: Operators.EQUALS,
              value: 1,
            },
          ],
        },
        {
          operator: Operators.OR,
          value: [
            {
              field: 'updatedAt',
              operator: Operators.GREATER_THAN,
              value: 1560436650,
            },
            {
              field: 'lastSeenAt',
              operator: Operators.EQUALS,
              value: 2,
            },
          ],
        },
      ],
    },
  },
  pagination: {
    per_page: 5,
    starting_after: 'WzE2MzU4NjA2NDgwMDAsIjYxODJiNjJlNDM4YjdhM2EwMWE4YWYxNSIsMl0=',
  },
  sort: { field: 'name', order: 'ASC' },
};

// The parsed query will produce a Prisma query like:
const prismaQuery = {
  where: {
    AND: [
      {
        AND: [
          { updatedAt: { gt: 1560436650 } },
          { lastRequestAt: { equals: 1 } },
        ],
      },
      {
        OR: [
          { updatedAt: { gt: 1560436650 } },
          { lastSeenAt: { equals: 2 } },
        ],
      },
    ],
  },
  take: 5,
  cursor: { id: '6182b62e438b7a3a01a8af15' }, 
  skip: 1,
  orderBy: [{ name: 'asc' }],
};
*/