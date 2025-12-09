import { trpc } from "@/trpc/client";

const assetIconSmall = new Map<number, JSX.Element>([
    // [0, <AnimatedPlanetIcon size={4} key={0}/>],
])

const assetIconMedium = new Map<number, JSX.Element>([
    // [0, <AnimatedPlanetIcon size={6} key={0}/>],
])

const assetIconBig = new Map<number, JSX.Element>([
    // [0, <AnimatedPlanetIcon size={10} key={0} />],
])



const renderIcon = (index: number, size: number) => {
    if(size >= 10){
        return assetIconBig.get(index)
    }else if(size >= 5)
        return assetIconMedium.get(index);
    else{
        return assetIconSmall.get(index);
    }
}

// Helper function to determine which icon to show based on user role/status
export const getUserIcons = (userId: string, size:number) => {

    // Only fetch the equipped asset instead of all owned assets
    // Add refetchOnWindowFocus and refetchOnMount to ensure updates are caught
    const { data: equippedAsset } = trpc.users.getEquippedAsset.useQuery(
        { userId: userId },
        {
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            staleTime: 0, // Consider data stale immediately to allow refetch
        }
    );

    // Only render if user has an equipped asset
    if (!equippedAsset) {
        return null;
    }

    return (
        <>
            {renderIcon(equippedAsset.iconNumber, size)}
        </>
    )
};