import asyncio
from mcp import ClientSession
from mcp.client.sse import sse_client

async def list_tools():
    async with sse_client("http://127.0.0.1:8000/sse") as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            for tool in tools.tools:
                print(f"Tool: {tool.name}")
                print(f"Description: {tool.description}")
                print(f"Schema: {tool.inputSchema}")
                print("-" * 40)

if __name__ == "__main__":
    asyncio.run(list_tools())
