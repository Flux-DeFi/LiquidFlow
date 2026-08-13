import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LiquidFlow API',
      version: '1.0.0',
      description: 'API documentation for LiquidFlow - Real-time payment streaming on Stellar',
      contact: {
        name: 'LiquidFlow Team',
        url: 'https://github.com/Flux-DeFi/LiquidFlow',
      },
      license: {
        name: 'MIT',
        url: 'https://github.com/Flux-DeFi/LiquidFlow/blob/main/LICENSE',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.flowfi.io',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Streams',
        description: 'Payment stream management endpoints',
      },
      {
        name: 'Events',
        description: 'Stream event tracking endpoints',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'publicKey'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the user',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            publicKey: {
              type: 'string',
              description: 'Stellar public key (G...)',
              example: 'GABC123XYZ456DEF789GHI012JKL345MNO678PQR901STU234VWX567YZA',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Stream: {
          type: 'object',
          required: ['id', 'streamId', 'sender', 'recipient', 'tokenAddress', 'ratePerSecond'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Database UUID',
            },
            streamId: {
              type: 'integer',
              description: 'On-chain stream ID',
              example: 1,
            },
            sender: {
              type: 'string',
              description: 'Sender Stellar public key',
              example: 'GABC123XYZ456DEF789GHI012JKL345MNO678PQR901STU234VWX567YZA',
            },
            recipient: {
              type: 'string',
              description: 'Recipient Stellar public key',
              example: 'GDEF456ABC789GHI012JKL345MNO678PQR901STU234VWX567YZA123BCD',
            },
            tokenAddress: {
              type: 'string',
              description: 'Token contract address',
              example: 'CBCD789EFG012HIJ345KLM678NOP901QRS234TUV567WXY890ZAB123CDE',
            },
            ratePerSecond: {
              type: 'string',
              description: 'Payment rate per second (i128 as string)',
              example: '100',
            },
            depositedAmount: {
              type: 'string',
              description: 'Total deposited amount (i128 as string)',
              example: '10000',
            },
            withdrawnAmount: {
              type: 'string',
              description: 'Total withdrawn amount (i128 as string)',
              example: '2500',
            },
            startTime: {
              type: 'integer',
              description: 'Stream start time (Unix timestamp)',
              example: 1708531200,
            },
            lastUpdateTime: {
              type: 'integer',
              description: 'Last update time (Unix timestamp)',
              example: 1708534800,
            },
            isActive: {
              type: 'boolean',
              description: 'Stream active status',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateStreamRequest: {
          type: 'object',
          required: ['sender', 'recipient', 'amount', 'token'],
          properties: {
            sender: {
              type: 'string',
              description: 'Sender Stellar public key (G-prefixed, 56 characters)',
              pattern: '^G[A-Z2-7]{55}$',
              example: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            },
            recipient: {
              type: 'string',
              description: 'Recipient Stellar public key (G-prefixed, 56 characters)',
              pattern: '^G[A-Z2-7]{55}$',
              example: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
            },
            amount: {
              type: 'number',
              format: 'double',
              exclusiveMinimum: 0,
              description: 'Positive amount to deposit into the stream',
              example: 250.5,
            },
            token: {
              type: 'string',
              minLength: 1,
              description: 'Token identifier or contract address used for the stream',
              example: 'USDC',
            },
            startTime: {
              type: 'integer',
              description: 'Optional stream start time as a Unix timestamp',
              example: 1708531200,
            },
            endTime: {
              type: 'integer',
              description: 'Optional stream end time as a Unix timestamp; must be greater than startTime when both are provided',
              example: 1708617600,
            },
          },
          example: {
            sender: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            recipient: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
            amount: 250.5,
            token: 'USDC',
            startTime: 1708531200,
            endTime: 1708617600,
          },
        },
        CreateStreamResponse: {
          type: 'object',
          required: ['id', 'status', 'sender', 'recipient', 'amount', 'token'],
          properties: {
            id: {
              type: 'string',
              description: 'Server-generated stream request identifier',
              example: '123',
            },
            status: {
              type: 'string',
              description: 'Current stream creation status',
              example: 'pending',
            },
            sender: {
              type: 'string',
              description: 'Sender Stellar public key (G-prefixed, 56 characters)',
              pattern: '^G[A-Z2-7]{55}$',
              example: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            },
            recipient: {
              type: 'string',
              description: 'Recipient Stellar public key (G-prefixed, 56 characters)',
              pattern: '^G[A-Z2-7]{55}$',
              example: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
            },
            amount: {
              type: 'number',
              format: 'double',
              exclusiveMinimum: 0,
              description: 'Positive amount deposited into the stream',
              example: 250.5,
            },
            token: {
              type: 'string',
              minLength: 1,
              description: 'Token identifier or contract address used for the stream',
              example: 'USDC',
            },
            startTime: {
              type: 'integer',
              description: 'Optional stream start time as a Unix timestamp',
              example: 1708531200,
            },
            endTime: {
              type: 'integer',
              description: 'Optional stream end time as a Unix timestamp',
              example: 1708617600,
            },
          },
          example: {
            id: '123',
            status: 'pending',
            sender: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            recipient: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
            amount: 250.5,
            token: 'USDC',
            startTime: 1708531200,
            endTime: 1708617600,
          },
        },
        StreamEvent: {
          type: 'object',
          required: ['id', 'streamId', 'eventType', 'transactionHash', 'ledgerSequence', 'timestamp'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            streamId: {
              type: 'integer',
              description: 'Reference to stream ID',
            },
            eventType: {
              type: 'string',
              enum: ['CREATED', 'TOPPED_UP', 'WITHDRAWN', 'CANCELLED', 'COMPLETED'],
              description: 'Type of stream event',
              example: 'TOPPED_UP',
            },
            amount: {
              type: 'string',
              nullable: true,
              description: 'Amount involved in event (i128 as string)',
              example: '5000',
            },
            transactionHash: {
              type: 'string',
              description: 'Stellar transaction hash',
              example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
            },
            ledgerSequence: {
              type: 'integer',
              description: 'Ledger sequence number',
              example: 12345678,
            },
            timestamp: {
              type: 'integer',
              description: 'Event timestamp (Unix)',
              example: 1708531200,
            },
            metadata: {
              type: 'string',
              nullable: true,
              description: 'Additional event data (JSON string)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Resource not found',
            },
            code: {
              type: 'string',
              description: 'Error code',
              example: 'NOT_FOUND',
            },
          },
        },
      },
    },
    paths: {
      '/streams': {
        post: {
          tags: ['Streams'],
          summary: 'Create a payment stream',
          description: 'Validates a stream creation request and returns the indexed stream intent.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateStreamRequest',
                },
                example: {
                  sender: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                  recipient: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
                  amount: 250.5,
                  token: 'USDC',
                  startTime: 1708531200,
                  endTime: 1708617600,
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Stream creation request accepted',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateStreamResponse',
                  },
                  example: {
                    id: '123',
                    status: 'pending',
                    sender: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                    recipient: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
                    amount: 250.5,
                    token: 'USDC',
                    startTime: 1708531200,
                    endTime: 1708617600,
                  },
                },
              },
            },
            '400': {
              description: 'Validation failed',
              content: {
                'application/json': {
                  example: {
                    message: 'Validation failed',
                    errors: [
                      {
                        path: ['amount'],
                        message: 'Amount must be positive',
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/**/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
