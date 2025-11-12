import { AnalyticsSection } from "../sections/analytics-section";

export const AnalyticsView = () => {
    return (
        <div className="w-full max-w-full overflow-hidden">
            <div className="flex flex-col gap-y-6 mx-auto">
                <AnalyticsSection />
            </div>
        </div>
    );
}