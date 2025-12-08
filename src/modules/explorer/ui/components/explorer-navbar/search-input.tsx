"use client";

import { Button } from "@/components/ui/button";
import { SearchIcon, Stars, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const SearchInput = () => {
  const [value, setValue] = useState("");
  const [isStarMode, setIsStarMode] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {

    // Prevent the form from submitting / reloading the page immediately
    // so our async AI search can run to completion.
    e.preventDefault();

    if (isStarMode) {
      handleAiSearch();
      return;
    }

    const newQuery = value.trim();

    if (newQuery === "") {
      router.push("/search");
    } else {
      router.push(`/search?query=${encodeURIComponent(newQuery)}`);
    }

    setValue(newQuery);
  };



  const handleAiSearch = async () => {

    const text = value.trim();

    if(!text) return;
    // Navigate to Explorer with AI query params; Explorer will use trpc.explorer.aiSearch
    router.push(`/?ai=1&q=${encodeURIComponent(text)}`);
    setIsStarMode(false);
    setValue(text);
    
  }

  const handleStarClick = () => {
    setIsStarMode(!isStarMode);
  };

  return (
    <form
      className="relative flex w-full max-w-[500px] items-center gap-3 justify-between"
      onSubmit={handleSearch}
    >
      <div className="relative w-full">
        {/* Input Container */}
        <div className="w-full flex items-center gap-1 relative">
          {/* Normal Search Input */}
          <div
            className={`transition-all duration-500 ease-out overflow-hidden ${
              isStarMode ? "w-0 opacity-0" : "w-full opacity-100"
            }`}
          >
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="text"
              placeholder="Search for anything..."
              className={`w-full pl-12 pr-16 py-2 rounded-full border-2 bg-background/95 backdrop-blur-sm transition-all duration-300 focus:outline-none text-foreground placeholder:text-muted-foreground
                ${value ? "pr-12" : "pr-4"}
                border-border
              `}
              />
          </div>

          {/* Star Mode Input */}
          <div
            className={`transition-all duration-500 ease-out overflow-hidden ${
              !isStarMode ? "w-0 opacity-0" : "w-full opacity-100"
            }`}
          >
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type="text"
              placeholder="Ask AI..."
              className={`w-full pl-12 pr-16 py-2 rounded-full border-2 bg-background/95 backdrop-blur-sm transition-all duration-300 focus:outline-none text-foreground placeholder:text-muted-foreground
                ${value ? "pr-12" : "pr-4"}
                border-primary shadow-lg shadow-orange-500/30
              `}
            />
          </div>

          {/* Search Icon - Only visible in normal mode */}
          <div
            className={`absolute left-0 top-0 bottom-0 flex items-center transition-all duration-500 ease-in-out ${
              isStarMode ? "opacity-0 scale-0" : "opacity-100 scale-100"
            }`}
          >
            <button
              disabled={!value.trim()}
              type="submit"
              className="px-4 rounded-r-full flex text-gray-500 items-center justify-center focus:outline-none transition-colors duration-200 hover:bg-muted/50"
              onSubmit={handleAiSearch}
            >
              <SearchIcon className="size-5" />
            </button>
          </div>

          {/* Star Icon - Only visible in star mode */}
          <div
            className={`absolute left-0 top-0 bottom-0 flex items-center transition-all duration-500 ease-in-out ${
              !isStarMode ? "opacity-0 scale-0" : "opacity-100 scale-100"
            }`}
          >
            <button
              disabled={!value.trim()}
              type="submit"
              className="px-4 rounded-r-full flex text-gray-500 items-center justify-center focus:outline-none transition-colors duration-200 hover:bg-muted/50"
            >
              <Stars className="size-4 text-primary" />
            </button>
          </div>

          {/* Search Toggle Button - Only visible in star mode */}
          <div
            className={`absolute -left-16 top-0 bottom-0 flex items-center transition-all duration-500 ease-in-out ${
              !isStarMode ? "opacity-0 scale-0" : "opacity-100 scale-100"
            }`}
          >
            <button
              type="button"
              onClick={handleStarClick}
              className="px-4 rounded-r-full flex items-center justify-center focus:outline-none transition-colors duration-200 hover:scale-110"
            >
              <div className="relative p-1.5 group rounded-full transition-all duration-300 bg-background hover:cursor-pointer ring-2 ring-gray-700">
                <div className="z-50 p-1 relative bg-clip-text text-transparent group-hover:brightness-110 transition-all duration-100">
                  <SearchIcon className="size-4 text-primary" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Clear search button */}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full size-7 hover:bg-muted transition-all duration-500 ease-in-out"
          >
            <XIcon className="text-muted-foreground size-4 hover:text-foreground transition-colors" />
          </Button>
        )}
      </div>

      {/* Enhanced Stars Button with Primary-Secondary Gradient Glow */}
      {!isStarMode && (
        <div
          onClick={handleStarClick}
          className="relative p-1.5 group rounded-full transition-all duration-300 hover:scale-105 active:scale-95 bg-background hover:cursor-pointer"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-2xl transition-opacity duration-300 blur-md group-hover:blur-lg -z-10 bg-gradient-to-r from-primary to-secondary opacity-70 group-hover:opacity-90" />

          {/* Gradient Border */}
          <div className="absolute inset-0 rounded-2xl p-0.5 -z-5 transition-all duration-300 bg-gradient-to-r from-primary to-secondary" />

          {/* Icon with Gradient Fill */}
          <div className="z-50 p-1 relative bg-clip-text text-transparent group-hover:brightness-110 transition-all duration-300 bg-gradient-to-r from-primary to-secondary">
            <Stars className="size-4 text-black font-bold" />
          </div>
        </div>
      )}
    </form>
  );
};