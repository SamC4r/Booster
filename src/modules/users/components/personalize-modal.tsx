"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@clerk/nextjs";
import {
    User,
    Gamepad,
    Palette,
    Code,
    Camera,
    Star,
    Heart,
    Sun,
    Moon,
    Check,
    X,
    Upload,
    Search,
    ShoppingBag,
    type LucideIcon,
    Users,
    Zap,
    Instagram,
    Twitter,
    Youtube,
    Globe,
    FileText,
    Music,
    Gamepad2,
    Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnimatedPlanetIcon } from "@/modules/market/components/assetIcons/planet-animated-icon";

// Default icons available to everyone (free)
const DEFAULT_ICONS = [
    { iconNumber: -99, icon: X as LucideIcon, name: "remove", displayName: "Remove Icon", isLucideIcon: true as const, isRemoveOption: true },
];

const TITLE_DEFINITIONS = [
    { name: "CEO", gradient: "from-yellow-400 to-amber-600" },
    { name: "BornToBoost", gradient: "from-blue-400 to-purple-600" },
    { name: "President", gradient: "from-red-500 to-blue-600" },
    { name: "Founder figure", gradient: "from-emerald-400 to-cyan-500" },
    { name: "OG", gradient: "from-indigo-500 to-pink-500" },
];

const getTitleGradient = (titleName: string) => {
    const def = TITLE_DEFINITIONS.find(t => t.name === titleName);
    return def?.gradient || "from-gray-900 to-gray-600";
};

const ACCENT_COLORS = [
    {
        name: 'Dark Gray',
        bg: 'bg-[#212121]',
        gradient: 'from-[#212121] to-[#424242]',
        border: 'border-[#212121]',
        text: 'text-[#212121]',
        hover: 'hover:bg-[#212121]/90',
        bgSolid: '#212121',
        light: 'bg-gray-100',
        dark: 'bg-gray-900'
    },
    {
        name: 'Blue Teal',
        bg: 'bg-blue-500',
        gradient: 'from-blue-500 to-teal-400',
        border: 'border-blue-500',
        text: 'text-blue-500',
        hover: 'hover:bg-blue-600',
        bgSolid: '#3B82F6',
        light: 'bg-blue-50',
        dark: 'bg-blue-950'
    },
    {
        name: 'Green Blue',
        bg: 'bg-green-500',
        gradient: 'from-green-400 to-blue-500',
        border: 'border-green-500',
        text: 'text-green-500',
        hover: 'hover:bg-green-600',
        bgSolid: '#22C55E',
        light: 'bg-green-50',
        dark: 'bg-green-950'
    },
    {
        name: 'Orange Red',
        bg: 'bg-orange-500',
        gradient: 'from-yellow-400 to-red-500',
        border: 'border-orange-500',
        text: 'text-orange-500',
        hover: 'hover:bg-orange-600',
        bgSolid: '#F97316',
        light: 'bg-orange-50',
        dark: 'bg-orange-950'
    },
    {
        name: 'Purple Pink',
        bg: 'bg-purple-500',
        gradient: 'from-purple-500 to-pink-500',
        border: 'border-purple-500',
        text: 'text-purple-500',
        hover: 'hover:bg-purple-600',
        bgSolid: '#A855F7',
        light: 'bg-purple-50',
        dark: 'bg-purple-950'
    }
];

interface PersonalizeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PersonalizeModal = ({ isOpen, onClose }: PersonalizeModalProps) => {
    const { userId: clerkUserId } = useAuth();
    const [activeTab, setActiveTab] = useState<'basic' | 'appearance' | 'about'>('basic');
    const [previewIconIndex, setPreviewIconIndex] = useState<number | null>(null); // Preview state
    const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
    const [showTitleModal, setShowTitleModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const { theme, setTheme } = useTheme();
    const [selectedAccent, setSelectedAccent] = useState(0);
    const [displayName, setDisplayName] = useState("");
    const [about, setAbout] = useState("");
    const [instagram, setInstagram] = useState("");
    const [twitter, setTwitter] = useState("");
    const [youtube, setYoutube] = useState("");
    const [tiktok, setTiktok] = useState("");
    const [discord, setDiscord] = useState("");
    const [website, setWebsite] = useState("");

    // Fetch user's owned assets from marketplace
    const { data: ownedAssets, isLoading: loadingAssets } = trpc.assets.getAssetsByUser.useQuery();

    const ownedTitles = ownedAssets?.filter(asset => asset.category === 'titles') || [];

    // Fetch current user information with actual Clerk ID
    const { data: currentUser } = trpc.users.getByClerkId.useQuery(
        { clerkId: clerkUserId },
        { enabled: !!clerkUserId }
    );

    const utils = trpc.useUtils();

    // Fetch boost points for XP bar
    const { data: boostPoints } = trpc.xp.getBoostByUserId.useQuery(
        { userId: currentUser?.id || '' },
        { enabled: !!currentUser?.id }
    );

    // Fetch currently equipped asset
    const { data: equippedAsset } = trpc.users.getEquippedAsset.useQuery(
        { userId: currentUser?.id || '' },
        { enabled: !!currentUser?.id }
    );

    // Fetch currently equipped title
    const { data: equippedTitle } = trpc.users.getEquippedTitle.useQuery(
        { userId: currentUser?.id || '' },
        { enabled: !!currentUser?.id }
    );

    // Initialize selectedTitle with equippedTitle when loaded
    React.useEffect(() => {
        if (equippedTitle) {
            setSelectedTitle(equippedTitle.name);
        }
    }, [equippedTitle]);

    // Initialize displayName when user is loaded
    React.useEffect(() => {
        if (currentUser) {
            setDisplayName(currentUser.name || "");
            setAbout(currentUser.about || "");
            setInstagram(currentUser.instagram || "");
            setTwitter(currentUser.twitter || "");
            setYoutube(currentUser.youtube || "");
            setTiktok(currentUser.tiktok || "");
            setDiscord(currentUser.discord || "");
            setWebsite(currentUser.website || "");
        }
    }, [currentUser]);

    // Calculate channel level and XP
    const channelLevel = currentUser && boostPoints
        ? Math.floor(Math.floor(Math.sqrt(boostPoints.boostPoints * 1000)) / 1000)
        : 0;

    const f = (x: number) => Math.floor((x * x) / 1000);
    const xpOnCurrentLevel = f(1000 * channelLevel);
    const xpForNextLevel = f(1000 * (channelLevel + 1));
    const xpProgress = boostPoints
        ? Math.max(0, Math.min(100, ((boostPoints.boostPoints - xpOnCurrentLevel) / (xpForNextLevel - xpOnCurrentLevel)) * 100))
        : 0;

    // Mutation to equip/unequip assets
    const equipAssetMutation = trpc.users.equipAsset.useMutation({
        onSuccess: async () => {
            // Invalidate all queries to refresh the equipped asset display everywhere instantly
            if (currentUser?.id) {
                utils.users.getEquippedAsset.invalidate({ userId: currentUser.id });
                utils.users.getByUserId.invalidate({ userId: currentUser.id });
                utils.users.getEquippedAsset.invalidate();
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update icon');
        }
    });

    const equipTitleMutation = trpc.users.equipTitle.useMutation({
        onSuccess: async () => {
            if (currentUser?.id) {
                utils.users.getEquippedTitle.invalidate({ userId: currentUser.id });
                utils.users.getByUserId.invalidate({ userId: currentUser.id });
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update title');
        }
    });

    const updateUserMutation = trpc.users.update.useMutation({
        onSuccess: async () => {
            if (currentUser?.id) {
                utils.users.getByUserId.invalidate({ userId: currentUser.id });
                utils.users.getByClerkId.invalidate({ clerkId: clerkUserId });
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update profile');
        }
    });

    // Map iconNumber to component (extensible for future icons)
    const getIconComponent = (iconNumber: number) => {
        const iconMap = new Map<number, React.ComponentType<any>>([
            [1, Zap],
            [2, Users],
            [3, Star],
            [4, AnimatedPlanetIcon],
            // Add more icons here as marketplace grows
        ]);
        return iconMap.get(iconNumber);
    };

    // Process purchased icons to ensure uniqueness by iconNumber
    // If multiple assets share the same iconNumber, prefer the one that is currently equipped
    const purchasedIcons = ownedAssets?.filter(asset => asset.category === 'icons').map(asset => ({
        iconNumber: asset.iconNumber,
        icon: getIconComponent(asset.iconNumber),
        name: asset.name.toLowerCase().replace(/\s+/g, '-'),
        displayName: asset.name,
        isPurchased: true,
        isLucideIcon: false,
        assetId: asset.assetId
    })) || [];

    // Deduplicate icons, preferring the equipped one
    const uniquePurchasedIcons = purchasedIcons.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.iconNumber === current.iconNumber);

        if (existingIndex === -1) {
            // New icon number, add it
            acc.push(current);
        } else {
            // Duplicate icon number found
            // If the current one is equipped, replace the existing one
            if (equippedAsset && current.assetId === equippedAsset.assetId) {
                acc[existingIndex] = current;
            }
            // Otherwise keep the existing one (which might be equipped or just the first one found)
        }
        return acc;
    }, [] as typeof purchasedIcons);

    // Combine default icons with unique purchased assets
    const availableIcons = [
        ...DEFAULT_ICONS,
        ...uniquePurchasedIcons
    ];

    // Find the index of currently equipped asset
    const equippedIconIndex = equippedAsset
        ? availableIcons.findIndex(icon => 'assetId' in icon && icon.assetId === equippedAsset.assetId)
        : -1;

    // Use preview if set, otherwise show currently equipped
    const displayIconIndex = previewIconIndex !== null ? previewIconIndex : equippedIconIndex;
    const selectedIconData = displayIconIndex >= 0 ? availableIcons[displayIconIndex] : null;
    const currentAccent = ACCENT_COLORS[selectedAccent];

    // Render the preview icon in the same style as channel page
    const renderPreviewIcon = () => {
        if (!selectedIconData) return null;

        // If the "Remove Icon" option is selected, show nothing
        if ('isRemoveOption' in selectedIconData && selectedIconData.isRemoveOption) {
            return <span className="text-muted-foreground text-sm">(No icon)</span>;
        }

        const size = 10; // Same size as channel page (size 10 = big)

        if (selectedIconData.isLucideIcon && selectedIconData.icon) {
            const IconComponent = selectedIconData.icon;
            return <IconComponent size={40} className="w-10 h-10" />;
        } else if (!selectedIconData.isLucideIcon && selectedIconData.icon) {
            // Custom component like AnimatedPlanetIcon
            const CustomIcon = selectedIconData.icon;
            return <CustomIcon size={size} />;
        }

        return null;
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        let changesSaved = false;

        // Only save if there's a change to the icon
        if (previewIconIndex !== null) {
            const iconData = availableIcons[previewIconIndex];

            // Check if it's the remove icon option
            if ('isRemoveOption' in iconData && iconData.isRemoveOption) {
                // Unequip any equipped icon
                equipAssetMutation.mutate({ assetId: null });
            } else if ('isPurchased' in iconData && iconData.isPurchased && 'assetId' in iconData) {
                // Equip the purchased asset
                equipAssetMutation.mutate({ assetId: iconData.assetId });
            } else {
                // Unequip (default icons mean no asset equipped)
                equipAssetMutation.mutate({ assetId: null });
            }
            changesSaved = true;
        }

        // Save title if changed
        if (selectedTitle !== (equippedTitle?.name || null)) {
            if (selectedTitle) {
                const titleAsset = ownedTitles.find(t => t.name === selectedTitle);
                if (titleAsset) {
                    equipTitleMutation.mutate({ assetId: titleAsset.assetId });
                }
            } else {
                equipTitleMutation.mutate({ assetId: null });
            }
            changesSaved = true;
        }

        // Save display name and other info if changed
        if (displayName !== currentUser?.name ||
            about !== (currentUser?.about || "") ||
            instagram !== (currentUser?.instagram || "") ||
            twitter !== (currentUser?.twitter || "") ||
            youtube !== (currentUser?.youtube || "") ||
            tiktok !== (currentUser?.tiktok || "") ||
            discord !== (currentUser?.discord || "") ||
            website !== (currentUser?.website || "")
        ) {
            updateUserMutation.mutate({
                name: displayName,
                about,
                instagram,
                twitter,
                youtube,
                tiktok,
                discord,
                website
            });
            changesSaved = true;
        }

        if (changesSaved) {
            toast.success('Profile updated successfully!');
        }

        setPreviewIconIndex(null); // Reset preview
        onClose();
    };

    const handleCancel = () => {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            setPreviewIconIndex(null); // Reset preview
            setSelectedTitle(null);
            toast.info('Changes discarded');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Main Modal Overlay */}
            <div className="fixed inset-0 bg-transparent backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-background rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden my-8">
                    {/* Header */}
                    <div
                        className="px-6 py-4 flex justify-between items-center"
                        style={{ background: currentAccent.bgSolid }}
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-white">Customize Your Profile</h2>
                            <p className="text-white/90 text-sm">Personalize your profile information and appearance</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Profile Preview */}
                            <div className="lg:col-span-1">
                                <div className="bg-card rounded-xl border shadow-lg p-6 sticky top-0">
                                    <div className="text-center mb-6">
                                        <div className="relative inline-block mx-auto mb-4">
                                            {/* User Avatar with actual profile picture */}
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild >
                                                        <div className="cursor-help">
                                                            <UserAvatar
                                                                size="xl"
                                                                imageUrl={currentUser?.imageUrl || undefined}
                                                                name={displayName || currentUser?.name || "User"}
                                                                className="w-32 h-32 border-4 border-border"
                                                                userId={currentUser?.id || ''}
                                                            />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>You can change your profile picture in Manage account (top right navbar)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            {/* Deprecated */}
                                            {/* <button
                                                onClick={() => setShowAvatarModal(true)}
                                                className="absolute bottom-1 right-1 bg-white dark:bg-gray-800 rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                            >
                                                <Camera className="w-4 h-4" />
                                            </button> */}
                                        </div>
                                        <h2 className="text-2xl font-bold">{displayName || currentUser?.name || 'Loading...'}</h2>
                                        <p className="text-muted-foreground">
                                            {selectedTitle ? (
                                                <span className={cn(
                                                    "font-bold bg-clip-text text-transparent bg-gradient-to-r",
                                                    getTitleGradient(selectedTitle)
                                                )}>
                                                    {selectedTitle}
                                                </span>
                                            ) : 'No title selected'}
                                        </p>

                                        {/* Icon Preview - Same as channel page */}
                                        <div className="mt-1 flex justify-center">
                                            {renderPreviewIcon()}
                                        </div>
                                    </div>

                                    {/* XP Progress - Real Channel Booster */}
                                    <div className="border-t pt-4">
                                        <div className="flex justify-between mb-3">
                                            <span className="text-foreground font-bold text-sm">Channel Booster</span>
                                            <span className="text-primary font-bold text-sm">Level {channelLevel}</span>
                                        </div>
                                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${xpProgress}%`, background: currentAccent.bgSolid }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                            <span>{xpProgress.toFixed(1)}% progress</span>
                                            <span>{boostPoints ? (xpForNextLevel - boostPoints.boostPoints).toLocaleString() : 0} XP to next level</span>
                                        </div>
                                    </div>

                                    {/* Selected Title */}
                                    <div className="mt-6">
                                        <h3 className="font-medium mb-3">Selected Title</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTitle ? (
                                                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-muted">
                                                    <span className={cn(
                                                        "font-bold bg-clip-text text-transparent bg-gradient-to-r",
                                                        getTitleGradient(selectedTitle)
                                                    )}>
                                                        {selectedTitle}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">No title selected</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Forms */}
                            <div className="lg:col-span-2">
                                <div className="bg-card rounded-xl border shadow-lg p-6">
                                    {/* Tabs */}
                                    <div className="flex space-x-2 mb-6 bg-muted p-1 rounded-xl overflow-x-auto">
                                        <button
                                            onClick={() => setActiveTab('basic')}
                                            className={cn(
                                                "flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm whitespace-nowrap",
                                                activeTab === 'basic'
                                                    ? "text-white"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                            style={activeTab === 'basic' ? { background: currentAccent.bgSolid } : {}}
                                        >
                                            <User className="w-4 h-4 inline mr-2" />
                                            Basic Info
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('about')}
                                            className={cn(
                                                "flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm whitespace-nowrap",
                                                activeTab === 'about'
                                                    ? "text-white"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                            style={activeTab === 'about' ? { background: currentAccent.bgSolid } : {}}
                                        >
                                            <FileText className="w-4 h-4 inline mr-2" />
                                            About
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('appearance')}
                                            className={cn(
                                                "flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm whitespace-nowrap",
                                                activeTab === 'appearance'
                                                    ? "text-white"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                            style={activeTab === 'appearance' ? { background: currentAccent.bgSolid } : {}}
                                        >
                                            <Palette className="w-4 h-4 inline mr-2" />
                                            Appearance
                                        </button>
                                    </div>

                                    {/* Basic Info Tab */}
                                    {activeTab === 'basic' && (
                                        <form onSubmit={handleSave} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold mb-2">Display Name</label>
                                                <Input
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    className="border-2 border-gray-300 dark:border-gray-600 bg-background"
                                                    placeholder="Enter your display name"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    This is how you will appear to other users
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold mb-2">Username</label>
                                                <Input
                                                    value={currentUser?.username ? `@${currentUser.username}` : ''}
                                                    disabled
                                                    className="border-2 border-gray-300 dark:border-gray-600 bg-muted cursor-not-allowed"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Change your username in account settings!
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold mb-2">Select Title</label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setShowTitleModal(true)}
                                                    className="w-full justify-start border-2 border-gray-300 dark:border-gray-600 hover:border-[#212121] dark:hover:border-[#212121]"
                                                >
                                                    {selectedTitle ? (
                                                        <span className={cn(
                                                            "font-bold bg-clip-text text-transparent bg-gradient-to-r",
                                                            getTitleGradient(selectedTitle)
                                                        )}>
                                                            {selectedTitle}
                                                        </span>
                                                    ) : 'Select title...'}
                                                </Button>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="block text-sm font-bold">Displayed Icon</label>
                                                    {previewIconIndex !== null && (
                                                        <span className="text-xs text-blue-500 font-semibold">
                                                            Preview Mode - Save to apply
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-3">
                                                    Select an icon to preview. Changes apply when you click &quot;Save Changes&quot;.
                                                </p>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {loadingAssets ? (
                                                        <div className="col-span-6 text-center py-8 text-muted-foreground">
                                                            Loading icons...
                                                        </div>
                                                    ) : availableIcons.length === 0 ? (
                                                        <div className="col-span-6 text-center py-8">
                                                            <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                                            <p className="text-sm text-muted-foreground mb-2">No icons available</p>
                                                            <Link href="/market">
                                                                <Button variant="outline" size="sm">
                                                                    Visit Marketplace
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    ) : availableIcons.map((iconData, idx) => {
                                                        const isPurchased = 'isPurchased' in iconData && iconData.isPurchased;
                                                        const isLucideIcon = 'isLucideIcon' in iconData && iconData.isLucideIcon;
                                                        const assetId = 'assetId' in iconData ? iconData.assetId : null;
                                                        const isEquipped = equippedAsset?.assetId === assetId;
                                                        const isSelected = displayIconIndex === idx;

                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => {
                                                                    // Just preview the selection, don't save yet
                                                                    setPreviewIconIndex(idx);
                                                                }}
                                                                className={cn(
                                                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all border-2 relative",
                                                                    isSelected
                                                                        ? "border-blue-500 bg-blue-500/10"
                                                                        : isEquipped
                                                                            ? "border-green-500 bg-green-500/5"
                                                                            : "border-transparent hover:border-gray-300"
                                                                )}
                                                            >
                                                                {/* Render appropriate icon component */}
                                                                {(() => {
                                                                    if (isPurchased && iconData.icon) {
                                                                        // Handle custom purchased icons
                                                                        const CustomIcon = iconData.icon;
                                                                        return <CustomIcon className="w-4 h-4" />;
                                                                    }
                                                                    if (isLucideIcon && iconData.icon) {
                                                                        const IconComponent = iconData.icon as LucideIcon;
                                                                        return <IconComponent className="w-4 h-4" />;
                                                                    }
                                                                    return <User className="w-4 h-4" />;
                                                                })()}
                                                                {isSelected && (
                                                                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                                        <Check className="h-2.5 w-2.5 text-white" />
                                                                    </div>
                                                                )}
                                                                {isEquipped && !isSelected && (
                                                                    <div className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-green-500/90 text-[8px] text-white rounded-full font-bold">
                                                                        EQUIPPED
                                                                    </div>
                                                                )}
                                                                {isPurchased && (
                                                                    <div className="absolute -top-0.5 -left-0.5 w-2 h-2 bg-amber-500 rounded-full border border-background" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="flex justify-end space-x-3 pt-4">
                                                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                                                <Button
                                                    type="submit"
                                                    className="text-white"
                                                    style={{ background: currentAccent.bgSolid }}
                                                >
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </form>
                                    )}

                                    {/* About Tab */}
                                    {activeTab === 'about' && (
                                        <form onSubmit={handleSave} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold mb-2">About Me</label>
                                                <textarea
                                                    value={about}
                                                    onChange={(e) => setAbout(e.target.value)}
                                                    className="w-full min-h-[100px] p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-background resize-y focus:outline-none focus:border-blue-500"
                                                    placeholder="Tell us about yourself..."
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="block text-sm font-bold">Social Links</label>

                                                <div className="relative">
                                                    <Instagram className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                                    <Input
                                                        value={instagram}
                                                        onChange={(e) => setInstagram(e.target.value)}
                                                        className="pl-10 border-2 border-gray-300 dark:border-gray-600 bg-background"
                                                        placeholder="Instagram username or URL"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <Twitter className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                                    <Input
                                                        value={twitter}
                                                        onChange={(e) => setTwitter(e.target.value)}
                                                        className="pl-10 border-2 border-gray-300 dark:border-gray-600 bg-background"
                                                        placeholder="Twitter username or URL"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <Youtube className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                                    <Input
                                                        value={youtube}
                                                        onChange={(e) => setYoutube(e.target.value)}
                                                        className="pl-10 border-2 border-gray-300 dark:border-gray-600 bg-background"
                                                        placeholder="YouTube channel URL"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <Music className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                                    <Input
                                                        value={tiktok}
                                                        onChange={(e) => setTiktok(e.target.value)}
                                                        className="pl-10 border-2 border-gray-300 dark:border-gray-600 bg-background"
                                                        placeholder="TikTok username or URL"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <Gamepad2 className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                                    <Input
                                                        value={discord}
                                                        onChange={(e) => setDiscord(e.target.value)}
                                                        className="pl-10 border-2 border-gray-300 dark:border-gray-600 bg-background"
                                                        placeholder="Discord server URL or username"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                                    <Input
                                                        value={website}
                                                        onChange={(e) => setWebsite(e.target.value)}
                                                        className="pl-10 border-2 border-gray-300 dark:border-gray-600 bg-background"
                                                        placeholder="Website URL"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <Button
                                                    type="submit"
                                                    className="text-white"
                                                    style={{ background: currentAccent.bgSolid }}
                                                >
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Appearance Tab */}
                                    {activeTab === 'appearance' && (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-bold mb-3">Theme</h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Light Theme */}
                                                    <button
                                                        onClick={() => setTheme('light')}
                                                        className={cn(
                                                            "relative border-2 rounded-xl p-4 transition-all group hover:scale-105",
                                                            theme === 'light'
                                                                ? "bg-gradient-to-br from-white to-gray-100 shadow-lg"
                                                                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50"
                                                        )}
                                                        style={theme === 'light' ? { borderColor: currentAccent.bgSolid } : {}}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 bg-yellow-100 rounded-lg">
                                                                <Sun className="w-6 h-6 text-yellow-600" />
                                                            </div>
                                                            <div className="text-left flex-1">
                                                                <div className="font-bold text-gray-900 dark:text-gray-100">Light Mode</div>
                                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Bright & clean interface</div>
                                                            </div>
                                                        </div>
                                                        {/* Selection indicator */}
                                                        {theme === 'light' && (
                                                            <div
                                                                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                                                style={{ background: currentAccent.bgSolid }}
                                                            >
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                        {/* Preview bars */}
                                                        <div className="mt-3 flex gap-1">
                                                            <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                                                            <div className="h-1 flex-1 bg-gray-300 rounded-full"></div>
                                                            <div className="h-1 flex-1 bg-gray-400 rounded-full"></div>
                                                        </div>
                                                    </button>

                                                    {/* Dark Theme */}
                                                    <button
                                                        onClick={() => setTheme('dark')}
                                                        className={cn(
                                                            "relative border-2 rounded-xl p-4 transition-all group hover:scale-105",
                                                            theme === 'dark'
                                                                ? "bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg"
                                                                : "border-gray-300 dark:border-gray-600 bg-gray-900 dark:bg-gray-800/50"
                                                        )}
                                                        style={theme === 'dark' ? { borderColor: currentAccent.bgSolid } : {}}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 bg-indigo-900/50 rounded-lg">
                                                                <Moon className="w-6 h-6 text-indigo-300" />
                                                            </div>
                                                            <div className="text-left flex-1">
                                                                <div className="font-bold text-white">Dark Mode</div>
                                                                <div className="text-xs text-gray-400 mt-0.5">Easy on the eyes</div>
                                                            </div>
                                                        </div>
                                                        {/* Selection indicator */}
                                                        {theme === 'dark' && (
                                                            <div
                                                                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                                                style={{ background: currentAccent.bgSolid }}
                                                            >
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                        {/* Preview bars */}
                                                        <div className="mt-3 flex gap-1">
                                                            <div className="h-1 flex-1 bg-gray-700 rounded-full"></div>
                                                            <div className="h-1 flex-1 bg-gray-600 rounded-full"></div>
                                                            <div className="h-1 flex-1 bg-gray-500 rounded-full"></div>
                                                        </div>
                                                    </button>

                                                    {/* Retro Theme */}
                                                    <button
                                                        onClick={() => setTheme('retro')}
                                                        className={cn(
                                                            "relative border-2 rounded-xl p-4 transition-all group hover:scale-105",
                                                            theme === 'retro'
                                                                ? "bg-gradient-to-br from-gray-200 to-gray-300 shadow-lg"
                                                                : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50"
                                                        )}
                                                        style={theme === 'retro' ? { borderColor: currentAccent.bgSolid } : {}}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 bg-gray-300 rounded-lg border border-gray-400 shadow-inner">
                                                                <Monitor className="w-6 h-6 text-gray-700" />
                                                            </div>
                                                            <div className="text-left flex-1">
                                                                <div className="font-bold text-gray-800 dark:text-gray-200">Retro Mode</div>
                                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">2009 Internet Style</div>
                                                            </div>
                                                        </div>
                                                        {/* Selection indicator */}
                                                        {theme === 'retro' && (
                                                            <div
                                                                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                                                style={{ background: currentAccent.bgSolid }}
                                                            >
                                                                <Check className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                        {/* Preview bars */}
                                                        <div className="mt-3 flex gap-1">
                                                            <div className="h-1 flex-1 bg-blue-600 rounded-none border border-gray-500"></div>
                                                            <div className="h-1 flex-1 bg-gray-300 rounded-none border border-gray-500"></div>
                                                            <div className="h-1 flex-1 bg-gray-200 rounded-none border border-gray-500"></div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Title Selector Sub-Modal */}
            {showTitleModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-card rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Select Title</h3>
                            <button onClick={() => setShowTitleModal(false)} className="hover:bg-muted rounded-lg p-2">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {ownedTitles.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>You don't own any titles yet.</p>
                                    <Link href="/market" onClick={() => setShowTitleModal(false)}>
                                        <Button variant="link" className="mt-2">Visit Marketplace</Button>
                                    </Link>
                                </div>
                            ) : (
                                ownedTitles.map(title => {
                                    const isSelected = selectedTitle === title.name;
                                    return (
                                        <button
                                            key={title.assetId}
                                            onClick={() => setSelectedTitle(isSelected ? null : title.name)}
                                            className={cn(
                                                "w-full flex items-center p-3 rounded-lg border-2 transition-all",
                                                isSelected ? "" : "border-transparent hover:bg-muted"
                                            )}
                                            style={isSelected ? {
                                                borderColor: currentAccent.bgSolid,
                                                backgroundColor: `${currentAccent.bgSolid}15`
                                            } : {}}
                                        >
                                            <span className={cn(
                                                "flex-1 text-left font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r",
                                                getTitleGradient(title.name)
                                            )}>
                                                {title.name}
                                            </span>
                                            {isSelected && (
                                                <Check
                                                    className="w-5 h-5"
                                                    style={{ color: currentAccent.bgSolid }}
                                                />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setShowTitleModal(false)}>Cancel</Button>
                            <Button
                                onClick={() => { setShowTitleModal(false); toast.success('Title updated!'); }}
                                className="text-white"
                                style={{ background: currentAccent.bgSolid }}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Avatar Upload Sub-Modal (deprecated)*/}
            {/* {showAvatarModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-card rounded-xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Change Avatar</h3>
                            <button onClick={() => setShowAvatarModal(false)} className="hover:bg-muted rounded-lg p-2">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-[#212121] hover:bg-gray-100 dark:hover:bg-gray-900 transition-all mb-4">
                            <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="font-medium">Drag & drop image here</p>
                            <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setShowAvatarModal(false)}>Cancel</Button>
                            <Button 
                                className="text-white"
                                style={{ background: currentAccent.bgSolid }}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            )} */}
        </>
    );
};
