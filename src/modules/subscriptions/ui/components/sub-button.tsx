import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils";

interface Props{
    onClick: ButtonProps["onClick"];
    disabled: boolean;
    isSubscribed?: boolean;
    className?: string;
    size?: ButtonProps["size"]
}
export const SubButton = ({
    onClick,
    isSubscribed,
    className,
    size,
    disabled
}:Props) => {
    return (
        <Button
            size={size}
            disabled={disabled}
            variant={isSubscribed ? "destructive" : "default"}
            className={cn(
                `rounded-full`,
                isSubscribed 
                    ? "opacity-50" 
                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600",
                className
            )}
            onClick={onClick}
        >

            {isSubscribed ? "Leave": "Follow"}
        </Button>
    )
}