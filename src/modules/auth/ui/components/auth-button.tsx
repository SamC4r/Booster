'use client'

import { Button } from "@/components/ui/button"
import { ClapperboardIcon, UserCircle2Icon } from "lucide-react"

import { UserButton,SignInButton, SignedIn, SignedOut } from "@clerk/nextjs"

export const AuthButton = () => {
    // TODO: add different auth states
    return (
        <>
        <SignedIn>
            <UserButton>
                <UserButton.MenuItems>
                    <UserButton.Link
                        href="/studio"
                        label="Studio"
                        labelIcon={<ClapperboardIcon className="size-4"/>}
                        />
                    <UserButton.Action label='manageAccount' />
                </UserButton.MenuItems>
            </UserButton>
            {/* TODO: Menu items for studio and user profile */}
        </SignedIn>
        <SignedOut>
            <SignInButton mode="modal">
                <Button
                    variant='outline'
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 border-blue-500/20 dark:border-blue-400/20 rounded-full shadow-none [&_svg]:size-5"
                >
                    <UserCircle2Icon />
                    Sign In
                </Button>
                </SignInButton>
        </SignedOut>
        </>
    )
}