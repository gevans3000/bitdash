# Supabase MCP Server - Project Planning

## Project Overview
This project implements a Model Context Protocol (MCP) server that provides tools for interacting with a Supabase database. The server enables AI assistants to perform database operations through a standardized interface.

## Architecture
- **Transport Layer**: Stdio transport for communication
- **Protocol**: Model Context Protocol (MCP)
- **Framework**: FastMCP Python SDK
- **Database**: Supabase (PostgreSQL)

## Components
1. **MCP Server**
   - Implements the Model Context Protocol
   - Uses FastMCP for server implementation
   - Communicates via Stdio transport

2. **Supabase Client**
   - Handles authentication with Supabase
   - Performs database operations

3. **MCP Tools**
   - Read records from tables
   - Create records in tables
   - Update records in tables
   - Delete records from tables

## Environment Configuration
- `SUPABASE_URL`: URL of the Supabase project
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for Supabase authentication

## File Structure
```
supabase-mcp/
├── server.py                     # Main MCP server implementation
├── supabase_client.py            # Supabase client wrapper
├── requirements.txt              # Python dependencies
├── .env.example                  # Example environment variables
├── mcp_config.json               # MCP configuration for Windsurf/Cursor
├── README.md                     # Project documentation
├── PLANNING.md                   # Project planning (this file)
├── TASKS.md                      # Task tracking
├── test_supabase_connection.py   # Test script for Supabase connection
├── test_server.py                # Test script for server components
├── test_server_initialization.py # Test script for server initialization
└── tests/                        # Unit tests
    ├── __init__.py               # Makes tests a proper package
    ├── conftest.py               # Shared pytest fixtures
    ├── test_server.py            # Tests for the MCP server
    └── test_supabase_client.py   # Tests for the Supabase client
```

## Implementation Details

### Connection Testing
The server implements a robust connection testing approach:
1. First tries to query the `test_items` table
2. If that fails, tries to create a record in `test_items`
3. If that fails, tries a direct client query
4. If all else fails, tries a simple RPC call to verify connection

### Error Handling
- All database operations include comprehensive error handling
- Errors are logged with timestamps and detailed information
- Client operations return structured error responses

### CRUD Operations
- **Read**: Supports filtering, pagination, and sorting
- **Create**: Supports single and batch record creation
- **Update**: Uses direct client approach for reliable updates
- **Delete**: Uses direct client approach for reliable deletions

## MCP Integration
The server can be integrated with any MCP-compatible client:
- Windsurf/Cursor: Use the provided `mcp_config.json`
- Custom clients: Connect via stdin/stdout

## Style Guidelines
- Follow PEP8 standards
- Use type hints for all functions
- Document functions with Google-style docstrings
- Format code with Black
- Use Pydantic for data validation

## Testing Strategy
- Use pytest for unit testing
- Manual testing scripts for connection and functionality verification
- Test both success and error cases for all operations
- Ensure all request models are properly validated
- Test edge cases like empty results, batch operations, etc.

## Dependencies
- fastmcp (>= 0.4.1)
- supabase (>= 1.0.0)
- python-dotenv (>= 1.0.0)
- pydantic (>= 2.0.0)
- pytest (>= 7.0.0) [dev]