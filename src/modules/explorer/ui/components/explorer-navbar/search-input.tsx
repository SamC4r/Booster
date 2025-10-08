import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation";
import { useState } from "react"

export const SearchInput = () => {
    // TODO: Search functionality

    const [value,setValue] = useState("");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const url = new URL("/search",  process.env.VERCEL_URL! ?? "http://localhost:3000")
        const newQuery = value.trim();


        url.searchParams.set("query",encodeURIComponent(newQuery))

        if(newQuery === ""){
            url.searchParams.delete("query")
        }

        setValue(newQuery)

        router.push(url.toString())
    }

    return (
        <form className='flex w-full max-w-[600px]' onSubmit={handleSearch}>
            <div className="relative w-full">
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    type='text'
                    placeholder="Search"
                    className="w-full pl-4 py-2 pr-12 rounded-l-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333333] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
                {/* TODO: add remove search button */}
                {value && (
                    <Button
                        type="button"
                        variant='ghost'
                        size='icon'
                        onClick={() => setValue("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                    >
                        <XIcon className="text-gray-500"/>
                    </Button>
                )}
            </div>
            <button
                disabled={!value.trim()}
                type="submit"
                className="px-5 py-2.5 bg-gray-100 dark:bg-[#333333] border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
                <SearchIcon className='size-5' />
            </button>
        </form>
    )
}