import { Tooltip,TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User } from "@/modules/users/types";
import { trpc } from "@/trpc/client";
import { useAuth, } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { CircleQuestionMark, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  user: User;
  setShowAddXpModal: (show: boolean) => void;
  videoId?: string;
}
export const XpCard = ({ user,setShowAddXpModal,videoId }: Props) => {
  const [selectedXp, setSelectedXp] = useState(10);
  const xpOptions = [10, 20, 50, 75, 100, 500, 1000];

  const { userId: clerkUserId } = useAuth();
  const { data: userLogged } = trpc.users.getByClerkId.useQuery({
    clerkId: clerkUserId,
  });
  const userId = userLogged?.id; //logged user id

  const { data: myXp } = trpc.xp.getXpByUserId.useQuery(
    { userId: userId! },
    {
      enabled: !!userId,           // dont fetch until there is a user
      staleTime: 60_000,           // reduce refetching
      refetchOnWindowFocus: false, // optional (suggested by companion)
    }
  );

  const loggedUserXp = myXp?.xp || 0;

  const utils = trpc.useUtils();

  const buy = trpc.xp.buyBoostById.useMutation({
    onSuccess: () => {
      utils.xp.getXpByUserId.invalidate({ userId }); //userId => current logged user
      utils.xp.getBoostByUserId.invalidate({userId: user.id}) //user.id => creator
      utils.xp.getBoostersByCreatorId.invalidate({creatorId: user.id})
      utils.users.getByUserId.invalidate({ userId: user.id });
      if(videoId) utils.xp.getBoostByVideoId.invalidate({ videoId })
    }
  })


  const handleAddXp = () => {
    // Here you would implement the actual XP adding logic
    if(loggedUserXp >= selectedXp){
      buy.mutate({price:selectedXp, recipientId: user.id})
      setShowAddXpModal(false);
      toast.success(`Added ${selectedXp} points to ${user.name}`);
    }else{
      //TODO: implement buy xp dialog
      alert('not enough xp')
    }
  };

  // Create evenly spaced positions for all markers
  const getMarkerPosition = (value: number, index: number) => {
    return (index / (xpOptions.length - 1)) * 100;
  };

  return (
    <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddXpModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              Boost with XP

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-1 rounded-full cursor-help">
                      
                      <CircleQuestionMark className="size-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-justify">Adding XP boosts a channel, making it more visible. The higher the boost level, the more it gets recommended.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              </h3>
              <button
                onClick={() => setShowAddXpModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Select how much XP to boost this community
              </p>

              {/* XP Slider */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    XP Amount
                  </span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    +{selectedXp}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={xpOptions.indexOf(selectedXp)}
                    onChange={(e) =>
                      setSelectedXp(xpOptions[parseInt(e.target.value)])
                    }
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    title="Select XP amount to boost"
                  />
                  <div className="absolute top-3 left-0 right-0 flex justify-between pointer-events-none">
                    {xpOptions.map((value, index) => (
                      <div
                        key={value}
                        className={`w-0.5 h-3 bg-gray-400 rounded-full ${
                          selectedXp === value ? "bg-amber-500 h-4" : ""
                        }`}
                        style={{
                          marginLeft: `${getMarkerPosition(value, index)}%`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>10</span>
                  <span>1000</span>
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-3">
                {xpOptions.map((xp) => (
                  <button
                    key={xp}
                    onClick={() => setSelectedXp(xp)}
                    className={`p-3 rounded-xl border transition-all ${
                      selectedXp === xp
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-400"
                    }`}
                  >
                    <span className="font-semibold">+{xp}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddXpModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddXp}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
              >
                Add XP
              </button>
            </div>
          </motion.div>
        </motion.div>
    </>
  );
};
