"use client"

import { trpc } from "@/trpc/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export const AccountTypeSelection = () => {
    const router = useRouter()
    const utils = trpc.useUtils()
    const [isPending, setIsPending] = useState(false)

    const setAccountType = trpc.users.setAccountType.useMutation({
        onSuccess: () => {
            utils.users.invalidate()
            toast.success("Account type set successfully")
            router.push("/")
            router.refresh()
        },
        onError: (error) => {
            toast.error(error.message)
            setIsPending(false)
        }
    })

    const handleSelect = (type: 'personal' | 'business') => {
        setIsPending(true)
        setAccountType.mutate({ accountType: type })
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Choose your account type</h1>
                <p className="text-muted-foreground">Select how you want to use Booster. This cannot be changed later.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card
                    className="cursor-pointer hover:border-primary transition-colors relative overflow-hidden group"
                    onClick={() => handleSelect('personal')}
                >
                    <CardHeader>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Personal Account</CardTitle>
                        <CardDescription>For creators and viewers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <ul className="list-disc list-inside space-y-1">
                            <li>Watch and upload videos</li>
                            <li>Earn XP and level up</li>
                            <li>Boost your favorite content</li>
                            <li>Participate in the community</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:border-primary transition-colors relative overflow-hidden group"
                    onClick={() => handleSelect('business')}
                >
                    <CardHeader>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                            <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Business Account</CardTitle>
                        <CardDescription>For brands and organizations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <ul className="list-disc list-inside space-y-1">
                            <li>Upload Featured videos</li>
                            <li>Reach a wider audience</li>
                            <li>No XP or leveling system</li>
                            <li>Professional presence</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {isPending && (
                <div className="text-center text-sm text-muted-foreground animate-pulse">
                    Setting up your account...
                </div>
            )}
        </div>
    )
}
