import { SearchIcon } from "lucide-react"

export const SearchInput = () =>{
    // TODO: Search functionality

        return (
            <form className='flex w-full max-w-[600px]'>
                <div className="relative w-full">
                    <input
                        type='text'
                        placeholder="Search"
                        className="w-full pl-4 py-2 pr-12 rounded-l-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333333] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                    />
                    {/* TODO: add remove search button */}
                </div>
                <button
                    type="submit"
                    className="px-5 py-2.5 bg-gray-100 dark:bg-[#333333] border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                >
                    <SearchIcon className='size-5'/>
                </button>
            </form>
        )
}