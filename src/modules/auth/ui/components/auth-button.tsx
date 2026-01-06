'use client'

import { Button } from "@/components/ui/button"
import { ClapperboardIcon, UserCircle2Icon, Sun, Moon } from "lucide-react"
import { User as RetroUser } from "@react95/icons"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { UserButton,SignInButton, SignedIn, SignedOut } from "@clerk/nextjs"

export const AuthButton = () => {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

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
                    <UserButton.Action 
                        label={theme === 'dark' ? "Light Mode" : "Dark Mode"}
                        labelIcon={theme === 'dark' ? <Sun className="size-4"/> : <Moon className="size-4"/>}
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    />
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
                    {mounted && theme === 'retro' ? <RetroUser variant="16x16_4" /> : <UserCircle2Icon />}
                    Sign In
                </Button>
                </SignInButton>
        </SignedOut>
        </>
    )
}