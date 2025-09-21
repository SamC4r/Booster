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
    disabled,
    isSubscribed,
    className,
    size
}:Props) => {
    return (
        <Button
            size={size}
            variant={isSubscribed ? "ghost" : "default"}
            className={cn(`rounded-full ${isSubscribed ? "opacity-50" : ""}`,className)}
            onClick={onClick}
        >

            {isSubscribed ? "Leave": "Follow"}
        </Button>
    )
}