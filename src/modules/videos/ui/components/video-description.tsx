import { cn } from "@/lib/utils";
import {  ChevronDownIcon } from "lucide-react";
import { useState } from "react";

interface Props {
  compactViews: string;
  expandedViews: string;
  compactDate: string;
  expandedDate: string;
  description?: string | null;
}

export const VideoDescription = ({
  compactViews,
  expandedViews,
  compactDate,
  expandedDate,
  description,
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-[#333333] dark:to-[#333333] rounded-2xl p-5 cursor-pointer 
                    shadow-lg hover:shadow-xl transition-all duration-300
                 "
      onClick={() => setIsExpanded((current) => !current)}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-4 text-sm">
          <span className="font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            {isExpanded ? expandedViews : compactViews} views
          </span>
          <span className="font-semibold text-gray-600 dark:text-gray-400">
            {isExpanded ? expandedDate : compactDate}
          </span>
        </div>

        <div
          className={cn(
            "p-1.5 rounded-full transition-all duration-300",
            isExpanded
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white rotate-180"
              : "bg-yellow-100 text-amber-600 hover:bg-yellow-200"
          )}
        >
          <ChevronDownIcon className="size-4" />
        </div>
      </div>

      <div className="relative">
        <p
          className={cn(
            "text-gray-700 dark:text-gray-300 transition-all duration-500 whitespace-pre-wrap",
            !isExpanded && "line-clamp-3"
          )}
        >
          {description
            ? // Split text by URL-like substrings and render anchors for links.
              // Use whitespace-pre-wrap on the container to preserve newlines and spaces.
              ((): React.ReactNode => {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const parts = description.split(urlRegex);
                return parts.map((part, idx) => {
                  if (urlRegex.test(part)) {
                    return (
                      <a
                        key={idx}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-500 dark:text-orange-300 hover:underline"
                      >
                        {part}
                      </a>
                    );
                  }
                  return <span key={idx}>{part}</span>;
                });
              })()
            : "No description available for this video."}
        </p>

        <div
          className={cn(
            "flex items-center gap-1 mt-4 text-sm font-semibold transition-opacity duration-300",
            isExpanded ? "text-amber-600" : "text-yellow-600"
          )}
        >
          {isExpanded ? <>Show less</> : <>Show more</>}
        </div>
      </div>
    </div>
  );
};
