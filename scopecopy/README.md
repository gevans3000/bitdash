# Supabase MCP Server

A Model Context Protocol (MCP) server for interacting with Supabase databases. This server implements the [Model Context Protocol](https://modelcontextprotocol.ai/) using the [FastMCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) to provide database operation tools for large language models (LLMs).

## Features

- Read records from Supabase tables with filtering, pagination, and sorting
- Create new records (single or batch) in Supabase tables
- Update existing records based on filter conditions
- Delete records from tables based on filter conditions
- Communicates using MCP's Stdio transport
- Robust error handling and connection testing
- Detailed logging for troubleshooting

## Prerequisites

- Python 3.8 or higher
- A Supabase project with tables already set up
- Supabase service role key for authentication

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/gevans3000/supabase-mcp.git
   cd supabase-mcp
   ```

2. Set up a virtual environment (recommended):
   ```bash
   # Create a virtual environment
   python -m venv venv
   
   # Activate the virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     # On Windows, use:
     # copy .env.example .env
     ```
   - Fill in your Supabase URL and service role key in the `.env` file:
     ```
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```

## Usage

### Starting the Server

Make sure your virtual environment is activated, then run the server:

```bash
python server.py
```

The server uses Stdio transport, so it will listen for MCP requests on standard input and respond on standard output.

### Testing Your Setup

Several test scripts are provided to verify your setup:

1. **Test Supabase Connection**:
   ```bash
   python test_supabase_connection.py
   ```
   This script tests the connection to your Supabase database and performs basic CRUD operations.

2. **Test Server Components**:
   ```bash
   python test_server.py
   ```
   This script tests the server components without initializing the full server.

3. **Test Server Initialization**:
   ```bash
   python test_server_initialization.py
   ```
   This script tests whether the server can be properly initialized.

### Integrating with MCP Clients

This server implements the Model Context Protocol and can be integrated with any MCP-compatible client. For example, you can use it with LLM frameworks that support MCP tools.

#### Adding to Windsurf/Cursor MCP Configuration

To add this MCP server to your Windsurf or Cursor configuration:

1. Use the provided `mcp_config.json` file as a template:
   ```json
   {
     "supabase": {
       "command": "C:\\Users\\lovel\\source\\repos\\gevans3000\\supabase-mcp\\venv\\Scripts\\python.exe",
       "args": [
         "C:\\Users\\lovel\\source\\repos\\gevans3000\\supabase-mcp\\server.py"
       ],
       "env": {
         "SUPABASE_URL": "http://localhost:8000/",
         "SUPABASE_SERVICE_ROLE_KEY": "your_supabase_key",
         "PYTHONUNBUFFERED": "1"
       },
       "timeout": 30000
     }
   }
   ```

2. Copy this file to your MCP client's configuration directory:
   - Windows: `C:\Users\<username>\.codeium\windsurf\mcp_config.json`
   - macOS: `~/.codeium/windsurf/mcp_config.json`
   - Linux: `~/.codeium/windsurf/mcp_config.json`

3. Update the paths and environment variables to match your setup.

4. Restart your Windsurf/Cursor application to apply the changes.

5. The Supabase MCP tools will now be available to your AI assistant.

### Tool Descriptions

The server provides the following tools:

#### 1. read_records

Reads records from a Supabase database table with flexible querying options.

**Parameters:**
- `table` (string, required): Name of the table to read from
- `columns` (string, optional, default: "*"): Columns to select (comma-separated or * for all)
- `filters` (object, optional): Filtering conditions as key-value pairs
- `limit` (integer, optional): Maximum number of records to return
- `offset` (integer, optional): Number of records to skip for pagination
- `order_by` (object, optional): Sorting options as column:direction pairs

**Example:**
```json
{
  "table": "users",
  "columns": "id,name,email",
  "filters": {"is_active": true},
  "limit": 10,
  "offset": 0,
  "order_by": {"created_at": "desc"}
}
```

#### 2. create_records

Creates one or more records in a Supabase database table.

**Parameters:**
- `table` (string, required): Name of the table to create records in
- `records` (object or array, required): A single record object or array of record objects to create

**Example (single record):**
```json
{
  "table": "users",
  "records": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Example (multiple records):**
```json
{
  "table": "users",
  "records": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "admin"
    }
  ]
}
```

#### 3. update_records

Updates existing records in a Supabase database table based on filter conditions.

**Parameters:**
- `table` (string, required): Name of the table to update records in
- `updates` (object, required): Fields to update as key-value pairs
- `filters` (object, required): Filtering conditions to identify records to update

**Example:**
```json
{
  "table": "users",
  "updates": {
    "is_active": false,
    "last_login": "2025-04-05T10:00:00Z"
  },
  "filters": {
    "id": 123
  }
}
```

#### 4. delete_records

Deletes records from a Supabase database table based on filter conditions.

**Parameters:**
- `table` (string, required): Name of the table to delete records from
- `filters` (object, required): Filtering conditions to identify records to delete

**Example:**
```json
{
  "table": "users",
  "filters": {
    "id": 123
  }
}
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to your Supabase database:

1. Verify your Supabase URL and service role key in the `.env` file
2. Ensure your Supabase instance is running
3. Run the `test_supabase_connection.py` script to diagnose connection issues
4. Check the server logs for detailed error messages

### MCP Integration Issues

If you're having trouble integrating with an MCP client:

1. Verify the paths in your `mcp_config.json` file
2. Ensure the Python executable path is correct
3. Make sure the environment variables are properly set
4. Check for any error messages in the MCP client logs

## Extending the Server

To add a new tool to the server:

1. Define a new request model in the `server.py` file
2. Implement the tool logic in the `SupabaseMCPServer` class
3. Register the tool in the `_register_tools` method with a descriptive name and documentation

## License

[MIT License](LICENSE)
