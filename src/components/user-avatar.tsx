import { Avatar, AvatarImage } from "./ui/avatar";


import { cn } from "@/lib/utils";


import { cva, type VariantProps } from "class-variance-authority";
import { UserProfilePopup } from "@/modules/users/ui/components/user-profile-popup";

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
            iconSize: 'default'
        },
    }
})

interface UserAvatarProps extends VariantProps<typeof avatarVariants> {
    imageUrl: string | undefined;
    name: string | undefined;
    className?: string;
    onClick?: () => void; //optional event
    userId: string | undefined;
    badgeSize?: number;
    disableLink?: boolean; // Prevent nested <a> tags
    trigger?: "click" | "hover";
}

export const UserAvatar = ({
    imageUrl,
    name,
    className,
    onClick,
    size, //because it extends VariantProps
    userId,
    disableLink = false,
    trigger = "click",
}: UserAvatarProps) => {
    const avatar = (
        <Avatar className={cn(avatarVariants({ size, className }), '')} onClick={onClick}>
            <AvatarImage src={imageUrl} alt={name} />
        </Avatar>
    );

    if (disableLink) {
        return (
            <div className="relative ">
                {avatar}
            </div>
        )
    }

    return (
        <UserProfilePopup userId={userId || ""} trigger={trigger}>
            <div className="relative cursor-pointer">
                {avatar}
            </div>
        </UserProfilePopup>
    )
}
