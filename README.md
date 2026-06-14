# @llmsproxy/mcp-server

The [Model Context Protocol](https://modelcontextprotocol.io) server for
[llmsproxy.ai](https://llmsproxy.ai). It connects Claude Desktop, Cursor, Cline,
Zed, and any other MCP client to your llmsproxy.ai account, exposing chat,
coding, and retrieval capabilities as MCP tools, resources, and prompts.

You bring an `llms_live_…` API key from your [llmsproxy.ai](https://llmsproxy.ai)
dashboard; this server speaks JSON-RPC 2.0 over stdio and forwards your requests
to the gateway.

## Install

The quickest path is the hosted installer, which configures Claude Desktop for
you:

```bash
curl -fsSL https://llmsproxy.ai/mcp/install.sh | bash
```

Or wire it into any MCP client manually:

```json
{
  "mcpServers": {
    "llmsproxy": {
      "command": "npx",
      "args": ["-y", "@llmsproxy/mcp-server"],
      "env": {
        "LLMSPROXY_API_KEY": "llms_live_...",
        "LLMSPROXY_BASE_URL": "https://api.llmsproxy.ai/v1"
      }
    }
  }
}
```

## Configuration

| Environment variable | Required | Description |
|----------------------|----------|-------------|
| `LLMSPROXY_API_KEY`  | yes | Your `llms_live_…` API key from the llmsproxy.ai dashboard. |
| `LLMSPROXY_BASE_URL` | no  | Gateway API root. Defaults to `https://api.llmsproxy.ai/v1`. |

## Supported platforms

`darwin-arm64`, `darwin-x64`, `linux-arm64`, `linux-x64`, `win32-x64`.

The package ships a small Node shim that selects and runs the prebuilt binary for
your platform — installed automatically as an optional dependency. No build step,
no network access at install time, no postinstall scripts.

## Support

- Documentation: <https://llmsproxy.ai>
- Email: <contact@llmsproxy.ai>

## License

[Apache-2.0](./LICENSE)
