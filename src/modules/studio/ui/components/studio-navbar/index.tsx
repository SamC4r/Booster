import Image from "next/image"
import Link from "next/link"

import { SidebarTrigger } from "@/components/ui/sidebar"

import { AuthButton } from "@/modules/auth/ui/components/auth-button"
import { StudioUploadModal } from "../studio-upload-modal"

export const StudioNavBar = () => {
    return (
        <nav className='fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#212121] flex items-center px-2 pr-5 z-50 shadow-md'>
            <div className='flex items-center gap-4 w-full '>
                {/* Menu and logo */}
                <div className="flex items-center flex-shrink-0">
                    <SidebarTrigger />
                    <Link href="/">
                        <div className="p-4 flex items-center gap-1">
                            <Image src="/logo.webp" alt="Logo" width={30} height={30} className="mr-1" />
                            <Image src="/BoosterLongLogo.webp" alt="Booster" width={150} height={30} className="hidden sm:block" />
                            {/* <p className="text/* - xl font-semibold tracking-tight">Studio</p> */}
                        </div>
                    </Link>
                </div>
                {/*Spacer  */}
                <div className="flex-1"> </div>



                <div className='flex-shrink-0 items-center flex gap-4'>
                    <StudioUploadModal />
                    <AuthButton />
                </div>
            </div>
        </nav>
    )
}
