"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Braces, RefreshCw, Send, PlusCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Playground() {
  // State variables
  const [apiKey, setApiKey] = useState("");
  const [userId, setUserId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [memoryInput, setMemoryInput] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [userMemories, setUserMemories] = useState([]);
  const [agentMemories, setAgentMemories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState("add"); // 'add', 'search', or 'visualize'
  const [isLoading, setIsLoading] = useState(false);
  const [activeMemoryType, setActiveMemoryType] = useState("user"); // 'user' or 'agent'
  const [visualizationData, setVisualizationData] = useState(null);
  const [error, setError] = useState("");

  // Load stored settings from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem("mem0ApiKey");
    const storedUserId = localStorage.getItem("userId") || "alice";
    const storedAgentId = localStorage.getItem("agentId") || "haruka";

    if (storedApiKey) setApiKey(storedApiKey);
    if (storedUserId) setUserId(storedUserId);
    if (storedAgentId) setAgentId(storedAgentId);

    // Initial memory fetch
    if (storedApiKey && storedUserId && storedAgentId) {
      fetchMemories();
    }
  }, []);

  // Function to fetch memories from the API
  const fetchMemories = useCallback(async () => {
    if (!apiKey || !userId || !agentId) {
      setError("API key, User ID, and Agent ID are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Fetch user memories
      const userResponse = await fetch(`/api/get?user_id=${userId}&output_format=v1.1`, {
        method: "GET",
        headers: { Authorization: `Token ${apiKey}` },
      });

      // Fetch agent memories
      const agentResponse = await fetch(`/api/get?agent_id=${agentId}&output_format=v1.1`, {
        method: "GET",
        headers: { Authorization: `Token ${apiKey}` },
      });

      if (!userResponse.ok || !agentResponse.ok) {
        throw new Error("Failed to fetch memories");
      }

      const userData = await userResponse.json();
      const agentData = await agentResponse.json();

      setUserMemories(userData.results || []);
      setAgentMemories(agentData.results || []);

      // Prepare visualization data
      setVisualizationData({
        userCount: (userData.results || []).length,
        agentCount: (agentData.results || []).length,
      });
    } catch (error) {
      console.error("Error fetching memories:", error);
      setError("Error fetching memories: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, userId, agentId]);

  // Function to add a new memory
  const addMemory = async () => {
    if (!apiKey || !userId || !agentId || !memoryInput.trim()) {
      setError("API key, ID, and memory text are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Prepare memory object based on whether it's a user or agent memory
      const memoryObj = {
        role: activeMemoryType === "user" ? "user" : "assistant",
        content: memoryInput.trim(),
      };

      const body = {
        messages: [memoryObj],
        user_id: activeMemoryType === "user" ? userId : undefined,
        agent_id: activeMemoryType === "agent" ? agentId : undefined,
        output_format: "v1.1",
      };

      const response = await fetch("/api/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to add memory");
      }

      // Clear input and refresh memories
      setMemoryInput("");
      fetchMemories();
    } catch (error) {
      console.error("Error adding memory:", error);
      setError("Error adding memory: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to search memories
  const searchMemories = async () => {
    if (!apiKey || !userId || !agentId || !queryInput.trim()) {
      setError("API key, IDs, and query text are required");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearchResults([]);

    try {
      // Search both user and agent memories
      const body = {
        query: queryInput.trim(),
        user_id: activeMemoryType === "user" ? userId : undefined,
        agent_id: activeMemoryType === "agent" ? agentId : undefined,
      };

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to search memories");
      }

      const data = await response.json();
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching memories:", error);
      setError("Error searching memories: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle Enter key press
  const handleKeyPress = (e, action) => {
    if (e.key === "Enter" && !isLoading) {
      if (action === "add") {
        addMemory();
      } else if (action === "search") {
        searchMemories();
      }
    }
  };

  // Render memory card
  const MemoryCard = ({ memory }) => (
    <div className="bg-gray-800 rounded-lg p-3 mb-3 border border-gray-700">
      <div className="text-xs text-gray-400 mb-1 flex justify-between">
        <span>ID: {memory.id ? memory.id.substring(0, 8) : "N/A"}</span>
        <span>
          {new Date(memory.created_at || Date.now()).toLocaleString()}
        </span>
      </div>
      <p className="text-white">{memory.memory}</p>
    </div>
  );

  // Tab content for Add Memory
  const AddMemoryTab = () => (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button
          className={`w-1/2 ${
            activeMemoryType === "user" ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => setActiveMemoryType("user")}
        >
          User Memory
        </Button>
        <Button
          className={`w-1/2 ${
            activeMemoryType === "agent" ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => setActiveMemoryType("agent")}
        >
          Agent Memory
        </Button>
      </div>

      <div>
        <label className="text-sm text-gray-400">
          {activeMemoryType === "user" ? "User" : "Agent"} ID
        </label>
        <Input
          value={activeMemoryType === "user" ? userId : agentId}
          onChange={(e) =>
            activeMemoryType === "user"
              ? setUserId(e.target.value)
              : setAgentId(e.target.value)
          }
          className="mb-2 bg-gray-800"
          placeholder={`Enter ${
            activeMemoryType === "user" ? "user" : "agent"
          } ID`}
        />
      </div>

      <div>
        <label className="text-sm text-gray-400">Memory Content</label>
        <Textarea
          value={memoryInput}
          onChange={(e) => setMemoryInput(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, "add")}
          className="h-24 bg-gray-800"
          placeholder="Enter memory content..."
        />
      </div>

      <Button
        className="w-full bg-amber-600 hover:bg-amber-700"
        onClick={addMemory}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Adding...
          </span>
        ) : (
          <span className="flex items-center">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Memory
          </span>
        )}
      </Button>
    </div>
  );

  // Tab content for Search Memories
  const SearchMemoriesTab = () => (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button
          className={`w-1/2 ${
            activeMemoryType === "user" ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => setActiveMemoryType("user")}
        >
          Search User
        </Button>
        <Button
          className={`w-1/2 ${
            activeMemoryType === "agent" ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => setActiveMemoryType("agent")}
        >
          Search Agent
        </Button>
      </div>

      <div>
        <label className="text-sm text-gray-400">Search Query</label>
        <div className="flex space-x-2">
          <Input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, "search")}
            className="bg-gray-800 flex-grow"
            placeholder="Enter search query..."
          />
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={searchMemories}
            disabled={isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Results */}
      <div>
        <h3 className="text-md font-semibold mb-2">Search Results</h3>
        {isLoading ? (
          <div className="text-center py-10">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Searching memories...</p>
          </div>
        ) : (
          <ScrollArea className="h-64 border border-gray-700 rounded-lg p-2">
            {searchResults.length === 0 ? (
              <p className="text-center py-10 text-gray-400">
                No results found. Try a different search query.
              </p>
            ) : (
              searchResults.map((result, idx) => (
                <MemoryCard key={idx} memory={result} />
              ))
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );

  // Tab content for Visualize Memories
  const VisualizeMemoriesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold">Memory Visualization</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchMemories}
          disabled={isLoading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {visualizationData ? (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h4 className="text-center mb-6 font-medium">Memory Distribution</h4>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div
                className="mx-auto mb-3"
                style={{
                  width: "100px",
                  height: `${Math.min(200, visualizationData.userCount * 10)}px`,
                  minHeight: "20px",
                  backgroundColor: "rgba(59, 130, 246, 0.8)",
                  borderRadius: "6px 6px 0 0",
                }}
              ></div>
              <div>
                <p className="font-medium">User</p>
                <p className="text-2xl font-bold text-blue-500">
                  {visualizationData.userCount}
                </p>
              </div>
            </div>
            <div className="text-center">
              <div
                className="mx-auto mb-3"
                style={{
                  width: "100px",
                  height: `${Math.min(200, visualizationData.agentCount * 10)}px`,
                  minHeight: "20px",
                  backgroundColor: "rgba(217, 119, 6, 0.8)",
                  borderRadius: "6px 6px 0 0",
                }}
              ></div>
              <div>
                <p className="font-medium">Agent</p>
                <p className="text-2xl font-bold text-amber-600">
                  {visualizationData.agentCount}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h4 className="text-md font-medium mb-3">Memory Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-400">Total Memories</p>
                <p className="text-xl font-bold">
                  {visualizationData.userCount + visualizationData.agentCount}
                </p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-400">Memory Ratio</p>
                <p className="text-xl font-bold">
                  {visualizationData.userCount}:{visualizationData.agentCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-400">
            No visualization data available. Refresh to load data.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-blue-600 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-white hover:text-gray-200 mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Mem0 Playground</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-64 bg-blue-700 border-blue-500 text-white placeholder-blue-300"
              placeholder="Mem0 API Key"
              type="password"
            />
            <Button
              variant="outline"
              className="bg-blue-700 border-blue-500 hover:bg-blue-800"
              onClick={fetchMemories}
            >
              Connect
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Error message display */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 text-white p-3 rounded-md mb-4">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex mb-6 border-b border-gray-700">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "add"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("add")}
          >
            Add Memory
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "search"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("search")}
          >
            Search
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "visualize"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("visualize")}
          >
            Visualize
          </button>
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left panel - Tab content */}
          <div className="md:col-span-3 bg-gray-900 border-2 border-gray-800 rounded-lg p-4">
            {activeTab === "add" && <AddMemoryTab />}
            {activeTab === "search" && <SearchMemoriesTab />}
            {activeTab === "visualize" && <VisualizeMemoriesTab />}
          </div>

          {/* Right panel - Memories browser */}
          <div className="md:col-span-2 bg-gray-900 border-2 border-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Recent {activeMemoryType === "user" ? "User" : "Agent"} Memories
              </h3>
              <div className="flex">
                <Button
                  size="sm"
                  variant="ghost"
                  className={activeMemoryType === "user" ? "bg-blue-900/30" : ""}
                  onClick={() => setActiveMemoryType("user")}
                >
                  User
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={activeMemoryType === "agent" ? "bg-amber-900/30" : ""}
                  onClick={() => setActiveMemoryType("agent")}
                >
                  Agent
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-280px)]">
              {isLoading ? (
                <div className="text-center py-10">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Loading memories...</p>
                </div>
              ) : activeMemoryType === "user" ? (
                userMemories.length > 0 ? (
                  userMemories.map((memory, idx) => (
                    <MemoryCard key={idx} memory={memory} />
                  ))
                ) : (
                  <p className="text-center py-10 text-gray-400">
                    No user memories found.
                  </p>
                )
              ) : agentMemories.length > 0 ? (
                agentMemories.map((memory, idx) => (
                  <MemoryCard key={idx} memory={memory} />
                ))
              ) : (
                <p className="text-center py-10 text-gray-400">
                  No agent memories found.
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 p-4 mt-8">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-400">
          <p>
            Mem0AI Playground - Built with{" "}
            <a
              href="https://mem0.ai"
              className="text-blue-400 hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mem0
            </a>{" "}
            and{" "}
            <a
              href="https://openrouter.ai"
              className="text-blue-400 hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenRouter
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}