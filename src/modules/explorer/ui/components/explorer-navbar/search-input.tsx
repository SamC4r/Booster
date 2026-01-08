"use client";

import { Button } from "@/components/ui/button";
import { SearchIcon, Stars, XIcon, ArrowLeft } from "lucide-react";
import { FileFind, Star, Close, ArrowLeft as RetroArrowLeft } from "@react95/icons";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface SearchInputProps {
  isMobileSearchOpen?: boolean;
  setIsMobileSearchOpen?: (isOpen: boolean) => void;
}

export const SearchInput = ({ isMobileSearchOpen, setIsMobileSearchOpen }: SearchInputProps) => {
  const [value, setValue] = useState("");
  const [isStarMode, setIsStarMode] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMobileSearchClick = () => {
    setIsStarMode(false);
    setIsMobileSearchOpen?.(true);
  };

  const handleMobileAiClick = () => {
    setIsStarMode(true);
    setIsMobileSearchOpen?.(true);
  };

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
    <>
      {/* Mobile Triggers */}
      <div className="flex items-center gap-3 sm:hidden">
        {!isMobileSearchOpen && (
            <>
                <button onClick={handleMobileSearchClick} className="p-2 hover:bg-muted rounded-full transition-colors">
                    {mounted && theme === 'retro' ? <FileFind variant="16x16_4" /> : <SearchIcon className="size-5" />}
                </button>
                <button onClick={handleMobileAiClick} className="p-2 hover:bg-muted rounded-full transition-colors">
                     {mounted && theme === 'retro' ? <Star variant="16x16_4" /> : <Stars className="size-5 text-[#f59e0b]" />}
                </button>
            </>
        )}
      </div>

      <form
        className={`relative w-full max-w-[500px] items-center gap-3 justify-between ${isMobileSearchOpen ? 'flex' : 'hidden sm:flex'}`}
        onSubmit={handleSearch}
      >
        {/* Back button for mobile */}
        {isMobileSearchOpen && (
            <button type="button" onClick={() => setIsMobileSearchOpen?.(false)} className="mr-2 sm:hidden p-2 hover:bg-muted rounded-full transition-colors">
                {mounted && theme === 'retro' ? <RetroArrowLeft width={16} height={16} /> : <ArrowLeft className="size-5" />}
            </button>
        )}

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
                {mounted && theme === 'retro' ? <FileFind variant="16x16_4" /> : <SearchIcon className="size-5" />}
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
                {mounted && theme === 'retro' ? <Star variant="16x16_4" /> : <Stars className="size-4 text-[#f59e0b]" />}
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
                    {mounted && theme === 'retro' ? <FileFind variant="16x16_4" /> : <SearchIcon className="size-4 text-[#f59e0b]" />}
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
              {mounted && theme === 'retro' ? <Close variant="16x16_4" /> : <XIcon className="text-muted-foreground size-4 hover:text-foreground transition-colors" />}
            </Button>
          )}
        </div>

        {/* Enhanced Stars Button with Primary-Secondary Gradient Glow */}
        {!isStarMode && (
          <div
            onClick={handleStarClick}
            className="relative p-1.5 group rounded-full transition-all duration-300 hover:scale-105 active:scale-95 bg-background hover:cursor-pointer hidden sm:block"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-2xl transition-opacity duration-300 blur-md group-hover:blur-lg -z-10 bg-gradient-to-r from-[#f59e0b] to-[#ff8904] opacity-70 group-hover:opacity-90" />

            {/* Gradient Border */}
            <div className="absolute inset-0 rounded-2xl p-0.5 -z-5 transition-all duration-300 bg-gradient-to-r from-[#f59e0b] to-[#ff8904]" />

            {/* Icon with Gradient Fill */}
            <div className="z-50 p-1 relative bg-clip-text text-transparent group-hover:brightness-110 transition-all duration-300 bg-gradient-to-r from-[#f59e0b] to-[#ff8904]">
              {mounted && theme === 'retro' ? <Star variant="16x16_4" /> : <Stars className="size-4 text-black font-bold" />}
            </div>
          </div>
        )}
      </form>
    </>
  );
};