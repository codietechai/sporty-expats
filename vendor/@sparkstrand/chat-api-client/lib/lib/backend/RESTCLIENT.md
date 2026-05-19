# RestClient Documentation

## Overview
The RestClient is a powerful HTTP client designed for making RESTful API calls to the Sparkstrand chat server. It provides a flexible, type-safe interface for authentication, request handling, and response processing. The client includes specialized modules such as for room and guest management, making it easy to interact with all aspects of the Sparkstrand chat API.

## Purpose
The RestClient enables developers to:

- Make authenticated HTTP requests to the Sparkstrand chat API
- Support multiple authentication methods (token, API key, API key secret)
- Manage rooms (create, update, search, message management)
- Handle guest operations (login, registration, profile management)
- Perform complex queries with a sophisticated query parser
- Debug API interactions with detailed logging

## Installation
Install the required dependency in your project:
```bash
npm install @sparkstrand/chat-api-client
```

## Client Structure
The RestClient is composed of a main client class and specialized modules:

### Main Client:
- **RestClient**: Core HTTP client with methods for making API requests

### Specialized Modules:
- **Room**: Handles room-related operations (create, update, messages, guests)
- **Guest**: Manages guest-related operations (login, registration, profile)

## Configuration

### RestClientOptions
```typescript
interface RestClientOptions {
  baseUrl: string;        // Base URL for the API
  apiKey?: string;        // API key for authentication
  apiKeySecret?: string;  // API key secret for authentication
  token?: string;         // Authentication token
  debug?: boolean;        // Enable debug logging
}
```

### Authentication Options
```typescript
interface RestClientAuthOptions {
  token: boolean;         // Include token in request headers
  apiKey: boolean;        // Include API key in request headers
  apiKeySecret: boolean;  // Include API key secret in request headers
}
```

## Usage

### Initialization
```typescript
import { RestClient } from '@sparkstrand/chat-api-client/backend';

// Initialize with API key and secret (server-side)
const client = new RestClient({
  baseUrl: 'https://api.sparkstrand.com',
  apiKey: 'your-api-key',
  apiKeySecret: 'your-api-key-secret',
  debug: true // Set to false in production
});

// Or initialize with token (client-side)
const client = new RestClient({
  baseUrl: 'https://api.sparkstrand.com',
  token: 'user-auth-token',
  debug: true // Set to false in production
});
```

### Authentication Methods

#### Setting API Credentials
```typescript
client.setApiCredentials('your-api-key', 'your-api-key-secret');
```

#### Setting Authentication Token
```typescript
client.setToken('user-auth-token');
```

### HTTP Methods

#### POST Request
```typescript
// Generic POST request
const response = await client.POST<ResponseType>(
  requestData,
  'api/path',
  { token: true, apiKey: false, apiKeySecret: false }
);
```

#### GET Request
```typescript
// Generic GET request
const response = await client.GET<ResponseType>(
  queryParams,
  'api/path',
  { token: true, apiKey: false, apiKeySecret: false }
);
```

#### PUT Request
```typescript
// Generic PUT request
const response = await client.PUT<ResponseType>(
  updateData,
  'api/path',
  { token: true, apiKey: false, apiKeySecret: false }
);
```

#### DELETE Request
```typescript
// Generic DELETE request
const response = await client.DELETE<ResponseType>(
  deleteParams,
  'api/path',
  { token: true, apiKey: false, apiKeySecret: false }
);
```

## Room Module

The Room module provides specialized methods for room management:

### Creating Rooms

#### Create a Group Room
```typescript
const result = await client.room.createGroup({
  creatorId: 'guest-123',
  name: 'Team Discussion',
  description: 'A room for team discussions',
  membersId: ['guest-456', 'guest-789'],
  setting: { allowGuests: true }
});
```

#### Create a Direct Message Room
```typescript
const result = await client.room.createDm({
  name: 'Private Chat',
  membersId: ['guest-123', 'guest-456'], // Exactly 2 members required
  description: 'Private conversation'
});
```

### Updating Rooms

#### Update Room Settings
```typescript
const result = await client.room.updateSetting({
  roomId: 'room-123',
  setting: {
    allowGuests: false,
    notificationsEnabled: true
  }
});
```

#### Update Room Description
```typescript
const result = await client.room.updateDescription({
  roomId: 'room-123',
  description: 'Updated room description'
});
```

#### Update Room Name
```typescript
const result = await client.room.updateName({
  roomId: 'room-123',
  name: 'New Room Name'
});
```

### Managing Room Messages

#### Get Room Messages
```typescript
const messages = await client.room.getAllMessages({
  roomId: 'room-123',
  limit: 50,
  before: '2023-01-01T00:00:00Z' // Optional timestamp
});
```

### Managing Room Guests

#### Add a Guest to a Room
```typescript
const result = await client.room.addGuest({
  roomId: 'room-123',
  guestId: 'guest-456'
});
```

#### Add Multiple Guests to a Room
```typescript
const result = await client.room.addListOfGuests({
  roomId: 'room-123',
  guestsId: ['guest-456', 'guest-789']
});
```

#### Get All Guests in a Room
```typescript
const guests = await client.room.getAllGuests({
  roomId: 'room-123'
});
```

#### Remove a Guest from a Room
```typescript
const result = await client.room.removeGuest({
  roomId: 'room-123',
  guestId: 'guest-456'
});
```

#### Remove Multiple Guests from a Room
```typescript
const result = await client.room.removeListOfGuests({
  roomId: 'room-123',
  guestsId: ['guest-456', 'guest-789']
});
```

### Searching for Rooms

#### Find a Single Room
```typescript
const room = await client.room.findFirst({
  roomId: 'room-123',
  query: {
    data: {
      query: {
        operator: Operators.AND,
        value: [
          {
            field: 'name',
            operator: Operators.CONTAINS,
            value: 'Team'
          }
        ]
      }
    }
  }
});
```

#### Find Multiple Rooms
```typescript
const rooms = await client.room.findMany({
  roomId: 'room-123',
  query: {
    data: {
      query: {
        operator: Operators.OR,
        value: [
          {
            field: 'type',
            operator: Operators.EQUALS,
            value: RoomType.GROUP
          },
          {
            field: 'membersCount',
            operator: Operators.GREATER_THAN,
            value: 5
          }
        ]
      }
    },
    pagination: {
      per_page: 10,
      skip: 0
    },
    sort: {
      field: 'createdAt',
      order: 'DESC'
    }
  }
});
```

## Guest Module

The Guest module provides specialized methods for guest management:

### Guest Registration and Authentication

#### Register or Update a Guest
```typescript
const result = await client.guest.upsert({
  name: 'John Doe',
  externalId: 'user-123', // ID from your system
  username: 'johndoe',
  email: 'john@example.com',
  phone: '+1234567890',
  avatar: {
    filename: 'avatar.jpg',
    fileUrl: 'https://example.com/avatar.jpg'
  }
});
```

#### Login a Guest
```typescript
const loginResult = await client.guest.login('guest-123');

// The token is automatically set in the client if login is successful
if (loginResult.success) {
  console.log('Logged in successfully');
  console.log('Token:', loginResult.data?.token);
  console.log('Guest data:', loginResult.data?.data);
}
```

#### Logout a Guest
```typescript
const logoutResult = await client.guest.logout();
```

### Guest Information

#### Get Current Guest Information
```typescript
// Only works after successful login
const guestInfo = await client.guest.getInfo();
```

#### Get Guest by External ID
```typescript
const guest = await client.guest.getByExternalId('user-123');
```

### Guest Room Management

#### List All Rooms for Current Guest
```typescript
// Only works after successful login
const rooms = await client.guest.listRooms();
```

#### List Rooms by Application ID
```typescript
// Only works after successful login
const rooms = await client.guest.listRoomsByApplicationId('app-123');
```

#### Check if Guest is Member of Room
```typescript
// Only works after successful login
const isMember = await client.guest.isMemberOfRoom('room-123');
```

#### Create a Room as Guest
```typescript
// Only works after successful login
const room = await client.guest.createRoom({
  name: 'New Room',
  type: RoomType.GROUP,
  description: 'A new room created by guest',
  membersId: ['guest-456', 'guest-789'],
  applicationId: 'app-123'
});
```

#### Update a Room as Guest
```typescript
// Only works after successful login
const updatedRoom = await client.guest.updateRoom({
  roomId: 'room-123',
  name: 'Updated Room Name',
  description: 'Updated room description',
  setting: { allowGuests: true }
});
```

## Response Format

All API responses follow a consistent format (similar to what we used on Taxdone):

```typescript
interface IResponse<T> {
  data?: T;             // Response data (type varies by endpoint)
  success: boolean;     // Whether the request was successful
  message: string;      // Human-readable message
  statusCode: number;   // HTTP status code
}
```

## Error Handling

The RestClient provides built-in error handling:

```typescript
try {
  const result = await client.room.createGroup({
    creatorId: 'guest-123',
    name: 'Team Discussion'
  });

  if (result.success) {
    console.log('Room created:', result.data);
  } else {
    console.error('Failed to create room:', result.message);
  }
} catch (error) {
  console.error('API request failed:', error);
}
```

## Debugging

When `debug: true` is set in the options, the RestClient logs detailed information about requests and responses:

```typescript
const client = new RestClient({
  baseUrl: 'https://api.sparkstrand.com',
  apiKey: 'your-api-key',
  debug: true // Enable debug logging
});

// Debug logs will show:
// - Request URLs and methods
// - Request headers and bodies
// - Response status and data
```

## Best Practices

### Authentication
- Use API key/secret for server-side applications
- Use token-based authentication for client-side applications
- Store tokens securely and refresh when needed

### Error Handling
- Always check `result.success` before using response data
- Implement proper error handling with try/catch blocks
- Display user-friendly error messages based on `result.message`

### Performance
- Limit the number of requests by batching operations when possible
- Use pagination for large data sets
- Consider caching frequently accessed data

### Security
- Never expose API key secret in client-side code
- Validate all user inputs before sending to the API
- Use HTTPS for all API communications in Production

## Limitations

- The RestClient requires a running Sparkstrand chat server Url
- Some operations require specific permissions or authentication levels
- Rate limiting may apply to certain endpoints
- Complex queries may impact performance

_This documentation provides a comprehensive guide for using the RestClient to interact with the Sparkstrand chat API, with practical examples for common operations and best practices for implementation._

*For any issues contact Bello or Bolu on Slack*