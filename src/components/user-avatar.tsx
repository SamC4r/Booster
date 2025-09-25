import { Avatar, AvatarImage } from "./ui/avatar";


import { cn } from "@/lib/utils";


import { cva, type VariantProps } from "class-variance-authority";
import { RocketIcon } from "lucide-react";
import Link from "next/link";

const avatarVariants = cva("", {
    variants: {
        size: {
            default: 'h-9 w-9',
            xs: 'h-4 w-4',
            sm: 'h-6 w-6',
            md: 'h-8 w-8',
            lg: 'h-12 w-12',
            llg: 'h-21 w-21',

            xl: 'h-[160px] w-[160px]',
        },
        
        iconSize: {
            default: 'h-4 w-4',
            xs: 'h-4 w-4',
            sm: 'h-6 w-6',
            md: 'h-8 w-8',
            lg: 'h-12 w-12',
            llg: 'h-20 w-20',
            xl: 'h-[160px] w-[160px]',
        },

        defaultVariants: {
            size: 'default',
            iconSize:'default'
        },
    }
})

interface UserAvatarProps extends VariantProps<typeof avatarVariants> {
    imageUrl: string | undefined;
    name: string | undefined;
    className?: string;
    onClick?: () => void; //optional event
    userId: string | undefined;
}

export const UserAvatar = ({
    imageUrl,
    name,
    className,
    onClick,
    size, //because it extends VariantProps
    userId,
    iconSize,
}: UserAvatarProps) => {
    return (
        <div className="relative">
            <Link href={`/users/${userId}`}>
                <Avatar className={cn(avatarVariants({ size, className }))} onClick={onClick}>
                    <AvatarImage src={imageUrl} alt={name} />
                </Avatar>
            </Link>
            {/* <div className="absolute  right-2 bottom-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-0.5 shadow-md">
                <div className="flex  bg-white dark:bg-[#333333] rounded-full p-1">
                    <RocketIcon className={cn(avatarVariants({iconSize,className}))} />
            
                </div>
            </div> */}
        </div>
    )
}
