export const DEFAULT_LIMIT = 5;
export const MAX_COMMENT_LENGTH=512;
export const COMMENT_SECTION_SIZE=10;
export const COMMENT_REPLIES_SIZE=5;

export const TITLE_DEFINITIONS = [
    { name: "CEO", gradient: "from-yellow-400 to-amber-600" },
    { name: "BornToBoost", gradient: "from-blue-400 to-purple-600" },
    { name: "President", gradient: "from-red-500 to-blue-600" },
    { name: "Founder figure", gradient: "from-emerald-400 to-cyan-500" },
];

export const getTitleGradient = (titleName: string) => {
    const def = TITLE_DEFINITIONS.find(t => t.name === titleName);
    return def?.gradient || "from-gray-900 to-gray-600";
};


