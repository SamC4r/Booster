import Image from "next/image"
import Link from "next/link"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

import { SearchInput } from "./search-input"

import { AuthButton } from "@/modules/auth/ui/components/auth-button"

export const ExplorerNavBar= () => {
    return (
        <nav className='fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#212121] flex items-center px-2 pr-5 z-50 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center gap-4 w-full '>
                {/* Menu and logo */}
                <div className="flex items-center flex-shrink-0">
                    <SidebarTrigger />
                    <Link href="/">
                    <div className="p-4 flex items-center">

                        <Image src="/logo.svg" alt="Logo" width={30} height={30} className="mr-1" />
                        <Image src="/BoosterLongLogo.svg" alt="Logo" width={150} height={300} />
                    </div>
                   </Link>
                </div>
            {/* Search bar */}
                <div className="flex-1 flex justify-center max-w-[720px] mx-auto">
                    <SearchInput />
                </div>
                <div className='flex-shrink-0 items-center flex gap-4'>
                    <ThemeToggle />
                    <AuthButton />
                </div>
            </div>
        </nav>
    )
}
