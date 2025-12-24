'use client'

import React, { useState, useEffect, Suspense, JSX } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Coins, ShoppingCart, Filter, Star, Lock, Check, Box, Landmark, X, Video, CreditCard, Crown, Users, Zap, Store } from "lucide-react"
import { XpIndicator } from "@/modules/xp/ui/components/xp-indicator"
import { trpc } from "@/trpc/client"
import { useAuth } from "@clerk/nextjs"
import { ErrorBoundary } from "react-error-boundary"
import { Spinner } from "@/components/ui/shadcn-io/spinner"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { type InferSelectModel } from "drizzle-orm"
import { users } from "../../../db/schema"

type User = InferSelectModel<typeof users>;

export const MarketSection = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <MarketSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  )
}

export const MarketSectionSuspense = () => {
  const [activeAssets] = trpc.assets.getMany.useSuspenseQuery();
  const [selectedCategory, setSelectedCategory] = useState("icons")
  const searchParams = useSearchParams();
  const [showXpPopup, setShowXpPopup] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "get-xp") {
      setShowXpPopup(true);
    }
  }, [searchParams]);

  const { userId: clerkUserId } = useAuth();
  const { data: userData } = trpc.users.getByClerkId.useQuery({
    clerkId: clerkUserId,
  }, {
    enabled: !!clerkUserId,
  });
  
  const user = userData as User | undefined;

  if ((user as any)?.accountType === 'business') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="bg-muted/30 p-8 rounded-2xl border border-border max-w-md">
          <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Market Unavailable</h2>
          <p className="text-muted-foreground">
            The marketplace is not available for business accounts.
          </p>
          <Link href="/business">
            <Button className="mt-6">
              Go to Business Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const userId = user?.id;
  const { data: myXp } = trpc.xp.getXpByUserId.useQuery(
    { userId: userId! },
    { enabled: !!userId, staleTime: 60_000, refetchOnWindowFocus: false }
  );

  const { data: ownedItemsData } = trpc.assets.getAssetsByUser.useQuery(undefined, {
    enabled: !!userId && (user as any)?.accountType !== 'business'
  });
  const ownedItems = ownedItemsData || [];

  const utils = trpc.useUtils();
  const toggleAds = trpc.users.toggleRewardedAds.useMutation({
    onSuccess: (data) => {
      utils.users.getByClerkId.setData({ clerkId: clerkUserId }, data as any);
      utils.users.getByClerkId.invalidate({ clerkId: clerkUserId });
    }
  });

  const userCoins = myXp?.xp || 0;

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

  const assetIcon = new Map<number, JSX.Element>([
    [1, <Zap className="w-12 h-12 text-yellow-400" key={1} />],
    [2, <Users className="w-12 h-12 text-blue-400" key={2} />],
    [3, <Star className="w-12 h-12 text-purple-400" key={3} />],
  ])

  const filteredItems = activeAssets.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesCategory
  })

  const allItems = filteredItems


  // handle

  const { mutate: buy, isPending } = trpc.xp.buyById.useMutation({
    onSuccess: () => {
      utils.xp.getXpByUserId.invalidate({ userId });
      utils.assets.getAssetsByUser.invalidate();
    }
  })



  const buyXp = trpc.xp.buyXp.useMutation();

  const handlePurchase = (assetId: string, price: number) => {
    if (userCoins >= price) {
      buy({ price, assetId });
    } else {
      setShowXpPopup(true);
    }
  }

  const handlePurchaseXp = async (lookupKey: "xp_500" | "xp_1200" | "xp_2500" | "xp_5500" | "xp_10000" | "xp_50000") => {
    const { url } = await buyXp.mutateAsync({ priceLookupKey: lookupKey });
    window.location.href = url!;
  };

  const xpPackages: { amount: number; price: number; popular: boolean; lookup: "xp_500" | "xp_1200" | "xp_2500" | "xp_5500" | "xp_10000" | "xp_50000" }[] = [
    { amount: 200, price: 0.99, popular: false, lookup: "xp_500" },
    { amount: 500, price: 1.99, popular: false, lookup: "xp_1200" },
    { amount: 2500, price: 7.99, popular: true, lookup: "xp_2500" },
    { amount: 5500, price: 15.99, popular: false, lookup: "xp_5500" },
    { amount: 10000, price: 25.99, popular: false, lookup: "xp_10000" },
    { amount: 50000, price: 70.99, popular: false, lookup: "xp_50000" },
  ]

  const categories = [
    { id: "icons", name: "Icons", icon: <Star className="h-4 w-4" /> },
    { id: "titles", name: "Titles", icon: <Crown className="h-4 w-4" /> },
  ]

  // Add CSS animations to your global CSS or CSS-in-JS
  useEffect(() => {
    // Inject custom animations
    const style = document.createElement('style')
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(3deg); }
      }
      @keyframes float-sparkle {
        0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0; }
        50% { transform: translateY(-20px) translateX(10px) scale(1.2); opacity: 1; }
        100% { transform: translateY(-40px) translateX(20px) scale(0.8); opacity: 0; }
      }
      @keyframes ping-once {
        0% { transform: scale(1); opacity: 0.7; }
        100% { transform: scale(2); opacity: 0; }
      }
      .animate-float { animation: float 4s ease-in-out infinite; }
      .animate-float-sparkle { animation: float-sparkle linear infinite; }
      .animate-ping-once { animation: ping-once 0.6s ease-out; }
      .animate-spin-slow { animation: spin 8s linear infinite; }
      .animate-spin-slow-reverse { animation: spin 12s linear infinite reverse; }
      .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      .animate-pulse-slower { animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const owned = (assetId: string): boolean => {
    let ans: boolean = false;
    ownedItems.map((item) => {
      if (item.assetId === assetId) {
        ans = true;
      }
    })
    return ans;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 ml-16 relative overflow-hidden">


      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="relative">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ffca55] to-[#FFA100] bg-clip-text text-transparent">
              Marketplace
            </h1>
            <p className="text-muted-foreground mt-2">Personalize your profile with exclusive items</p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0 relative">
            {(user as any)?.accountType !== 'business' && (
              <>
                <XpIndicator xp={userCoins} />
                <Button
                  className="flex rounded-full bg-gradient-to-r from-[#ffca55] to-[#FFA100] text-gray-900 font-semibold hover:opacity-90"
                  onClick={() => setShowXpPopup(true)}
                >
                  <Landmark className="h-4 w-4 mr-2" />
                  <span>Get More XP</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* XP Popup Modal */}
        {showXpPopup && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl border border-border max-w-md w-full max-h-[70vh] overflow-y-auto relative overflow-hidden scrollbar-hide">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border relative">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ffca55] to-[#FFA100] bg-clip-text text-transparent">
                  Get More XP
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowXpPopup(false)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Current Balance */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-500">XP</span>
                    <span className="text-xl font-bold">{Intl.NumberFormat("en").format(userCoins)}</span>
                  </div>
                </div>
              </div>

              {/* Free Option - Rewarded Ads */}
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-400" />
                  Free XP - Featured Videos
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Watch featured videos to earn XP for free!
                </p>
                <div className="flex items-center justify-between p-5 bg-muted/50 rounded-xl border-2 border-border hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <Video className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-base">Featured Videos</div>
                      <div className="text-sm text-muted-foreground">
                        {user?.rewardedAdsEnabled ? "✓ Ads are active" : "Enable to watch ads"}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={(user as any)?.accountType === 'business' ? true : (user?.rewardedAdsEnabled ?? false)}
                    onCheckedChange={(checked) => toggleAds.mutate({ enabled: checked })}
                    disabled={toggleAds.isPending || (user as any)?.accountType === 'business'}
                    className="data-[state=checked]:bg-blue-600 scale-125"
                  />
                </div>
                {(user as any)?.accountType === 'business' && (
                  <p className="text-xs text-muted-foreground mt-2 ml-1">
                    * Business accounts have Featured Videos permanently enabled.
                  </p>
                )}
              </div>

              {/* Paid Options */}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-400" />
                  Buy XP (Future Implementation)
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Get instant XP with these premium packages
                </p>

                <div className="space-y-3">
                  {xpPackages.map((pkg, index) => (
                    <div
                      key={index}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer ${pkg.popular
                        ? "border-purple-500 bg-gradient-to-r from-purple-700/10 to-purple-100/10"
                        : "border-border bg-muted/50 hover:border-muted-foreground"
                        }`}
                      onClick={() => handlePurchaseXp(pkg.lookup)}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            MOST POPULAR
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-purple-500">XP</span>
                          <div>
                            <div className="font-semibold text-lg">{pkg.amount.toLocaleString()}</div>
                            <div className="text-muted-foreground text-sm">Instant delivery</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${pkg.price}</div>
                          <div className="text-muted-foreground text-sm">
                            ${(pkg.price / (pkg.amount / 1000)).toFixed(2)} per 1K XP
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Security Note */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>Secure payment processing. Your transaction is safe and encrypted.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rest of your existing JSX remains the same, just add animation classes */}
        {/* Category Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted/30 p-1.5 rounded-full inline-flex items-center border border-border/50">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === category.id
                  ? "bg-gradient-to-r from-[#ffca55] to-[#FFA100] text-gray-900 shadow-md scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
            <div className="px-4 py-2 text-sm font-medium text-red-400 italic border-l border-border/50 ml-2 select-none">
              More coming soon...
            </div>
          </div>
        </div>

        {/* Marketplace Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allItems.map((item) => {
            const isOwned = owned(item.assetId);
            const isDummy = item.assetId.startsWith('dummy-');
            const isTitle = item.category === "titles";

            return (
              <Card
                key={item.assetId}
                className="bg-card border border-border overflow-hidden group relative"
              >
                <CardContent className="p-0">
                  {/* Item Image */}
                  <div className="h-40 flex items-center justify-center bg-gradient-to-b from-muted/50 to-card relative">
                    <span className={isTitle ? `text-2xl font-bold text-center px-4 bg-gradient-to-r ${getTitleGradient(item.name)} bg-clip-text text-transparent` : "text-5xl"}>
                      {isTitle ? item.name : (isDummy ? (item as any).emoji : assetIcon.get(item.iconNumber))}
                    </span>

                    {/* Owned Badge */}
                    {isOwned && (
                      <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Owned
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xs font-bold text-purple-500 mr-1">XP</span>
                        <span className="font-semibold">{item.price}</span>
                      </div>

                      {isPending ? (
                        <>
                          <Spinner variant="circle" />
                        </>
                      ) : (
                        <>
                          {isOwned ? (
                            <Button
                              className="rounded-full bg-green-600 text-white text-sm hover:bg-green-700 transition-all duration-300"
                              disabled
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Owned
                            </Button>
                          ) : (
                            <Button
                              className="rounded-xl bg-black text-white hover:bg-black/80 text-sm font-semibold shadow-lg hover:shadow-[#ffca55] transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 border border-white/20"
                              onClick={() => handlePurchase(item.assetId, item.price)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              <span>Buy Now</span>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {
          allItems.length === 0 && (
            <div className="text-center py-16">
              <Box className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground">No items found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your filter criteria</p>
            </div>
          )
        }
      </div >
    </div >
  )
}