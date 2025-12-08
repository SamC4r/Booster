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
    type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { AnimatedPlanetIcon } from "@/modules/market/components/assetIcons/animated-planet-icon";
import Link from "next/link";
import { useTheme } from "next-themes";

// Default icons available to everyone (free)
const DEFAULT_ICONS = [
    { iconNumber: -99, icon: X as LucideIcon, name: "remove", displayName: "Remove Icon", isLucideIcon: true as const, isRemoveOption: true },
    { iconNumber: -1, icon: User as LucideIcon, name: "user", displayName: "User", isLucideIcon: true as const },
    { iconNumber: -2, icon: Star as LucideIcon, name: "star", displayName: "Star", isLucideIcon: true as const },
    { iconNumber: -3, icon: Heart as LucideIcon, name: "heart", displayName: "Heart", isLucideIcon: true as const },
];

const ROLES = [
    { id: 1, name: 'UX Designer', icon: Palette, color: 'bg-purple-500' },
    { id: 2, name: 'Frontend Developer', icon: Code, color: 'bg-blue-500' },
    { id: 3, name: 'Backend Developer', icon: Code, color: 'bg-green-500' },
    { id: 4, name: 'Product Manager', icon: Star, color: 'bg-yellow-500' },
    { id: 5, name: 'Content Creator', icon: Camera, color: 'bg-pink-500' },
    { id: 6, name: 'Community Manager', icon: User, color: 'bg-indigo-500' },
    { id: 7, name: 'Graphic Designer', icon: Palette, color: 'bg-red-500' },
    { id: 8, name: 'Video Editor', icon: Camera, color: 'bg-teal-500' },
    { id: 9, name: 'Game Developer', icon: Gamepad, color: 'bg-orange-500' },
    { id: 10, name: 'Data Scientist', icon: Star, color: 'bg-cyan-500' }
];

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
    const [activeTab, setActiveTab] = useState<'basic' | 'appearance'>('basic');
    const [previewIconIndex, setPreviewIconIndex] = useState<number | null>(null); // Preview state
    const [selectedRoles, setSelectedRoles] = useState<number[]>([1, 2]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [roleSearch, setRoleSearch] = useState('');
    const { theme, setTheme } = useTheme();
    const [selectedAccent, setSelectedAccent] = useState(0);

    // Fetch user's owned assets from marketplace
    const { data: ownedAssets, isLoading: loadingAssets } = trpc.assets.getAssetsByUser.useQuery();
    
    // Fetch current user information with actual Clerk ID
    const { data: currentUser } = trpc.users.getByClerkId.useQuery(
        { clerkId: clerkUserId },
        { enabled: !!clerkUserId }
    );
    
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

    const utils = trpc.useUtils();

    // Mutation to equip/unequip assets
    const equipAssetMutation = trpc.users.equipAsset.useMutation({
        onSuccess: async () => {
            toast.success('Icon updated successfully!');
            // Invalidate all queries to refresh the equipped asset display everywhere instantly
            if (currentUser?.id) {
                // Invalidate the equipped asset query for instant update
                utils.users.getEquippedAsset.invalidate({ userId: currentUser.id });
                // Also invalidate user data to refresh all components using user info
                utils.users.getByUserId.invalidate({ userId: currentUser.id });
                // Invalidate all instances of getEquippedAsset to update everywhere
                utils.users.getEquippedAsset.invalidate();
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update icon');
        }
    });

    // Map iconNumber to component (extensible for future icons)
    const getIconComponent = (iconNumber: number) => {
        const iconMap = new Map([
            [0, AnimatedPlanetIcon], // Founder Member Icon
            // Add more icons here as marketplace grows
        ]);
        return iconMap.get(iconNumber);
    };

    // Combine default icons with purchased assets
    const availableIcons = [
        ...DEFAULT_ICONS,
        ...(ownedAssets?.map(asset => ({
            iconNumber: asset.iconNumber,
            icon: getIconComponent(asset.iconNumber),
            name: asset.name.toLowerCase().replace(/\s+/g, '-'),
            displayName: asset.name,
            isPurchased: true,
            isLucideIcon: false,
            assetId: asset.assetId
        })) || [])
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
        }
        
        toast.success('Profile updated successfully!');
        setPreviewIconIndex(null); // Reset preview
        onClose();
    };

    const handleCancel = () => {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            setPreviewIconIndex(null); // Reset preview
            setSelectedRoles([1, 2]);
            toast.info('Changes discarded');
            onClose();
        }
    };

    const toggleRole = (roleId: number) => {
        setSelectedRoles(prev => 
            prev.includes(roleId) 
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId]
        );
    };

    const filteredRoles = ROLES.filter(role => 
        role.name.toLowerCase().includes(roleSearch.toLowerCase())
    );

    const primaryRole = ROLES.find(role => role.id === selectedRoles[0]);

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
                                            <UserAvatar
                                                size="xl"
                                                imageUrl={currentUser?.imageUrl || undefined}
                                                name={currentUser?.name || "User"}
                                                className="w-32 h-32 border-4 border-border"
                                                userId={currentUser?.id || ''}
                                            />
                                            <button
                                                onClick={() => setShowAvatarModal(true)}
                                                className="absolute bottom-1 right-1 bg-white dark:bg-gray-800 rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                            >
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h2 className="text-2xl font-bold">{currentUser?.name || 'Loading...'}</h2>
                                        <p className="text-muted-foreground">{primaryRole?.name || 'No role selected'}</p>
                                        
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

                                    {/* Selected Roles */}
                                    <div className="mt-6">
                                        <h3 className="font-medium mb-3">Selected Roles</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRoles.map(roleId => {
                                                const role = ROLES.find(r => r.id === roleId);
                                                if (!role) return null;
                                                const RoleIcon = role.icon;
                                                return (
                                                    <div 
                                                        key={roleId}
                                                        className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm text-white", role.color)}
                                                    >
                                                        <RoleIcon className="w-3 h-3 mr-1" />
                                                        <span>{role.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Forms */}
                            <div className="lg:col-span-2">
                                <div className="bg-card rounded-xl border shadow-lg p-6">
                                    {/* Tabs */}
                                    <div className="flex space-x-2 mb-6 bg-muted p-1 rounded-xl">
                                        <button
                                            onClick={() => setActiveTab('basic')}
                                            className={cn(
                                                "flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm",
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
                                            onClick={() => setActiveTab('appearance')}
                                            className={cn(
                                                "flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm",
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
                                                    value={currentUser?.name || ''} 
                                                    disabled
                                                    className="border-2 border-gray-300 dark:border-gray-600 bg-muted cursor-not-allowed"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Name is managed through your account settings
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold mb-2">Display Role</label>
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    onClick={() => setShowRoleModal(true)} 
                                                    className="w-full justify-start border-2 border-gray-300 dark:border-gray-600 hover:border-[#212121] dark:hover:border-[#212121]"
                                                >
                                                    {selectedRoles.length > 0 
                                                        ? selectedRoles.map(id => ROLES.find(r => r.id === id)?.name).join(', ')
                                                        : 'Select roles...'
                                                    }
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
                                                                        if (iconData.iconNumber === 0) {
                                                                            return <AnimatedPlanetIcon size={4} />;
                                                                        }
                                                                        return <span className="text-xs">?</span>;
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

                                    {/* Appearance Tab */}
                                    {activeTab === 'appearance' && (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-bold mb-3">Theme</h3>
                                                <div className="grid grid-cols-2 gap-4">
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
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold mb-3">Accent Color</h3>
                                                <div className="flex space-x-3">
                                                    {ACCENT_COLORS.map((accent, idx) => (
                                                        <button 
                                                            key={idx} 
                                                            onClick={() => setSelectedAccent(idx)} 
                                                            className={cn(
                                                                "w-12 h-12 rounded-lg transition-all border-4", 
                                                                `bg-gradient-to-br ${accent.gradient}`,
                                                                selectedAccent === idx ? "scale-110 shadow-lg" : "border-transparent"
                                                            )}
                                                            style={selectedAccent === idx ? { borderColor: accent.bgSolid } : {}}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex justify-end space-x-3 pt-4">
                                                <Button variant="outline">Reset</Button>
                                                <Button 
                                                    className="text-white"
                                                    style={{ background: currentAccent.bgSolid }}
                                                >
                                                    Apply
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Selector Sub-Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-card rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Select Roles</h3>
                            <button onClick={() => setShowRoleModal(false)} className="hover:bg-muted rounded-lg p-2">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                value={roleSearch} 
                                onChange={(e) => setRoleSearch(e.target.value)} 
                                placeholder="Search roles..." 
                                className="pl-10 border-2 border-gray-300 dark:border-gray-600 focus:border-[#212121] dark:focus:border-[#212121]"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {filteredRoles.map(role => {
                                const RoleIcon = role.icon;
                                const isSelected = selectedRoles.includes(role.id);
                                return (
                                    <button 
                                        key={role.id} 
                                        onClick={() => toggleRole(role.id)} 
                                        className={cn(
                                            "w-full flex items-center p-3 rounded-lg border-2 transition-all", 
                                            isSelected ? "" : "border-transparent hover:bg-muted"
                                        )}
                                        style={isSelected ? { 
                                            borderColor: currentAccent.bgSolid,
                                            backgroundColor: `${currentAccent.bgSolid}15`
                                        } : {}}
                                    >
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white mr-3", role.color)}>
                                            <RoleIcon className="w-5 h-5" />
                                        </div>
                                        <span className="flex-1 text-left font-medium">{role.name}</span>
                                        {isSelected && (
                                            <Check 
                                                className="w-5 h-5" 
                                                style={{ color: currentAccent.bgSolid }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setShowRoleModal(false)}>Cancel</Button>
                            <Button 
                                onClick={() => { setShowRoleModal(false); toast.success('Roles updated!'); }} 
                                className="text-white"
                                style={{ background: currentAccent.bgSolid }}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Avatar Upload Sub-Modal */}
            {showAvatarModal && (
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
            )}
        </>
    );
};
