import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Users, Shield } from "lucide-react";

interface CommunityCardProps {
    community: {
        communityId: string;
        name: string;
        description_short: string | null;
        icon_url: string | null;
        banner_url: string | null;
        membersCount?: number;
        postsCount?: number;
        trendingScore?: number;
        isVerified?: boolean;
        category?: {
            name: string;
            color: string;
        };
    };
}

export const CommunityCard = ({ community }: CommunityCardProps) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Link href={`/c/${community.communityId}`} className="group block h-full">
            <Card className="flex flex-row items-center p-4 gap-4 h-full hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                        <AvatarImage src={community.icon_url || ""} alt={community.name} className="object-cover" />
                        <AvatarFallback>
                            {getInitials(community.name)}
                        </AvatarFallback>
                    </Avatar>
                    {community.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-background">
                            <Shield className="h-3 w-3 text-white" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0 gap-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate text-base group-hover:text-primary transition-colors">
                            {community.name}
                        </h3>
                    </div>

                    {community.description_short && (
                        <p className="text-sm text-muted-foreground line-clamp-1 leading-snug">
                            {community.description_short}
                        </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{community.membersCount?.toLocaleString() || '0'} members</span>
                        </div>
                    </div>
                </div>


            </Card>
        </Link>
    );
};