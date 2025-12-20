'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, Shield, Info, Gavel, Flag, RefreshCw } from "lucide-react";

export const Guidelines = () => {
    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Guidelines & Policies</h1>
            
            <Tabs defaultValue="community" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="community">Community Guidelines</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy Policies</TabsTrigger>
                </TabsList>
                
                <TabsContent value="community" className="space-y-6">
                    {/* Introduction */}
                    <Card className="border-l-4 border-l-primary">
                        <CardHeader>
                            <CardTitle className="text-2xl">Booster Community Guidelines</CardTitle>
                            <CardDescription>Effective date: December 20, 2025</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            <p>
                                Booster is a place to share and discover video content that is entertaining, informative, and safe. These Community Guidelines explain what is allowed, what is not allowed, and how we enforce the rules. They apply to all content and behavior on Booster, including videos, captions, thumbnails, comments, messages, livestreams, usernames, and profile content.
                            </p>
                            <p>
                                If something is not explicitly covered here, we may still take action when content or behavior creates risk, harm, or violates the spirit of these guidelines.
                            </p>
                        </CardContent>
                    </Card>

                    {/* 1) Core Principles */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                1. Core Principles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-muted-foreground">We built Booster around a few simple expectations:</p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="p-4 bg-accent/50 rounded-lg">
                                    <h4 className="font-semibold mb-1">Be respectful</h4>
                                    <p className="text-sm text-muted-foreground">Challenge ideas without attacking people.</p>
                                </div>
                                <div className="p-4 bg-accent/50 rounded-lg">
                                    <h4 className="font-semibold mb-1">Be safe</h4>
                                    <p className="text-sm text-muted-foreground">Don’t encourage harm or illegal activity.</p>
                                </div>
                                <div className="p-4 bg-accent/50 rounded-lg">
                                    <h4 className="font-semibold mb-1">Be honest</h4>
                                    <p className="text-sm text-muted-foreground">Don’t mislead users, impersonate others, or manipulate the platform.</p>
                                </div>
                                <div className="p-4 bg-accent/50 rounded-lg">
                                    <h4 className="font-semibold mb-1">Respect rights</h4>
                                    <p className="text-sm text-muted-foreground">Protect privacy and intellectual property.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2) Respectful conduct */}
                    <GuidelineCard 
                        number="2"
                        title="Respectful conduct (harassment, bullying, threats)"
                        description="We allow disagreement and strong criticism. We do not allow harassment or targeted abuse."
                        notAllowed={[
                            "Harassment, bullying, humiliation, or repeated unwanted contact",
                            "Slurs, derogatory insults, or demeaning language aimed at a person or group",
                            "Coordinated attacks, brigading, or directing others to target someone",
                            "Threats of violence, intimidation, or extortion",
                            "Mocking serious illness, disability, or tragedy to harm or shame"
                        ]}
                        allowed={[
                            "Criticism of public figures, institutions, and ideas",
                            "Satire, parody, commentary, and debate",
                            "Reporting on events, including quoting public statements (without harassment)"
                        ]}
                    />

                    {/* 3) Hate and hateful conduct */}
                    <GuidelineCard 
                        number="3"
                        title="Hate and hateful conduct"
                        description="Booster does not allow hateful content that targets people based on protected characteristics, including race, ethnicity, nationality, religion, caste, disability, sexual orientation, gender identity, or similar protected status."
                        notAllowed={[
                            "Calls for violence, exclusion, or segregation",
                            "Dehumanizing language or depicting groups as inferior, criminal, or subhuman",
                            "Praising, supporting, or promoting hate groups or ideologies"
                        ]}
                    />

                    {/* 4) Violence */}
                    <GuidelineCard 
                        number="4"
                        title="Violence, graphic content, and dangerous behavior"
                        description="We restrict content that depicts or promotes violence or severe harm."
                        notAllowed={[
                            "Graphic gore or extreme injury presented for shock value",
                            "Glorifying or celebrating violence against people or animals",
                            "Encouraging dangerous stunts likely to cause serious harm",
                            "Supporting or praising violent extremist or terrorist organizations"
                        ]}
                        allowedWithRestrictions={[
                            "Newsworthy, educational, or documentary content shown responsibly",
                            "Fictional violence (film, games, staged scenarios)",
                            "Safety education that does not provide instructions to harm others"
                        ]}
                    />

                    {/* 5) Sexual content */}
                    <GuidelineCard 
                        number="5"
                        title="Sexual content and nudity"
                        description="Booster is not a pornography platform. We also enforce strict protections against exploitation."
                        notAllowed={[
                            "Pornography or explicit sexual acts",
                            "Sexual content involving minors (including implied, animated, or “aged-up” depictions)",
                            "Sexual violence, coercion, or non-consensual sexual content",
                            "“Revenge” imagery or sexual content shared without consent"
                        ]}
                        allowedWithRestrictions={[
                            "Non-explicit educational content (health, relationships, anatomy)",
                            "Non-explicit artistic nudity in limited contexts"
                        ]}
                    />

                    {/* 6) Child safety */}
                    <GuidelineCard 
                        number="6"
                        title="Child safety and minors"
                        description="Protecting minors is a priority."
                        notAllowed={[
                            "Any sexual content involving minors",
                            "Grooming, sexualization, fetish content, or requests for sexual content from minors",
                            "Encouraging minors to share personal data, meet strangers, or participate in risky challenges",
                            "Content depicting child abuse or exploitation (we may report to relevant authorities where required)"
                        ]}
                        mayBeRestricted={[
                            "Content featuring minors in vulnerable settings when it increases risk (even if not illegal)"
                        ]}
                    />

                    {/* 7) Self-harm */}
                    <GuidelineCard 
                        number="7"
                        title="Self-harm and suicide"
                        description="We do not allow content that promotes or instructs self-harm. We do allow supportive content."
                        notAllowed={[
                            "Encouraging self-harm or suicide",
                            "Instructions, methods, or “challenge” content related to self-harm"
                        ]}
                        allowed={[
                            "Recovery stories, prevention resources, and supportive discussion",
                            "Non-graphic educational content focused on help and safety"
                        ]}
                        footer="If you or someone you know may be in danger, contact local emergency services immediately."
                    />

                    {/* 8) Illegal activity */}
                    <GuidelineCard 
                        number="8"
                        title="Illegal activity and regulated goods"
                        description="Do not use Booster to facilitate wrongdoing."
                        notAllowed={[
                            "Instructions to commit crimes or evade law enforcement",
                            "Buying/selling illegal drugs or facilitating trafficking or exploitation",
                            "Promoting or facilitating fraud, theft, or violent wrongdoing",
                            "Detailed guidance for creating weapons or explosives intended to harm"
                        ]}
                    />

                    {/* 9) Privacy */}
                    <GuidelineCard 
                        number="9"
                        title="Privacy, consent, and personal information"
                        description="Respect privacy and obtain consent when appropriate."
                        notAllowed={[
                            "Doxxing: sharing private personal information (home address, phone number, IDs, banking data)",
                            "Filming or sharing content from private spaces without consent (bathrooms, changing rooms, medical settings)",
                            "Sharing someone’s intimate or humiliating content without permission",
                            "Posting private info even if it appears elsewhere online"
                        ]}
                        allowed={[
                            "Filming in public spaces where legally permitted, when not used to harass or endanger",
                            "Reporting on public events in a responsible way"
                        ]}
                    />

                    {/* 10) Impersonation */}
                    <GuidelineCard 
                        number="10"
                        title="Impersonation and deceptive media"
                        description="Be transparent about who you are and what your content represents."
                        notAllowed={[
                            "Impersonation intended to deceive or defraud",
                            "Misleading “official” accounts or fake endorsements",
                            "Manipulated media (including deepfakes) used to scam, defame, or cause harm",
                            "Coordinated inauthentic behavior (bots, fake engagement, or artificial amplification)"
                        ]}
                        allowed={[
                            "Parody, fan, and commentary accounts when clearly labeled",
                            "Creative editing that is not deceptive or harmful"
                        ]}
                    />

                    {/* 11) Scams */}
                    <GuidelineCard 
                        number="11"
                        title="Scams, spam, and platform manipulation"
                        description="We remove content that exploits users or undermines integrity."
                        notAllowed={[
                            "Scams, phishing, or links designed to steal credentials or money",
                            "Fake giveaways, pyramid schemes, and deceptive “get rich quick” claims",
                            "Spam: repetitive posting, mass messaging, or engagement bait",
                            "Buying/selling or otherwise manipulating views, likes, comments, or followers"
                        ]}
                    />

                    {/* 12) Misinformation */}
                    <GuidelineCard 
                        number="12"
                        title="Misinformation and harmful deception"
                        description="Booster does not remove content solely because it is controversial or disputed. We may take action when misinformation creates a meaningful risk of harm."
                        notAllowed={[
                            "Dangerous misinformation likely to cause immediate harm (e.g., urging ingestion of harmful substances)",
                            "High-risk medical misinformation presented as certain fact that could lead to harm",
                            "Coordinated disinformation campaigns, forged documents, or fake “official” announcements designed to mislead"
                        ]}
                        possibleActions={[
                            "Adding context labels, reducing distribution, age-gating, or removal depending on severity and risk"
                        ]}
                    />

                    {/* 13) Intellectual property */}
                    <GuidelineCard 
                        number="13"
                        title="Intellectual property (copyright and trademarks)"
                        description="Only post content you own or have the rights to use."
                        notAllowed={[
                            "Re-uploading movies, TV, sports broadcasts, or creators’ work without permission",
                            "Repeated infringement or attempts to bypass rights protections"                        ]}
                        footer="We may remove content upon valid rights-holder reports and restrict accounts that repeatedly infringe."
                    />

                    {/* 14) Commercial content */}
                    <GuidelineCard 
                        number="14"
                        title="Commercial content, disclosures, and promotions"
                        description="If your content includes paid promotions, sponsorships, affiliate links, or product placement, disclose it clearly."
                        notAllowed={[
                            "Deceptive advertising or misleading claims",
                            "Promoting scams or unsafe products/services",
                            "Content that hides paid relationships or incentives"
                        ]}
                    />

                    {/* 15) Rewards */}
                    <GuidelineCard 
                        number="15"
                        title="Rewards, coins, and monetization integrity"
                        description="If Booster includes rewards, coins, or monetized features, you must not abuse them."
                        notAllowed={[
                            "Fraud, fake engagement, or coordinated manipulation to earn rewards",
                            "Misleading calls for payment, coercion, or harassment related to monetization",
                            "Attempts to exploit bugs or loopholes in rewards systems"
                        ]}
                        footer="We may remove earnings, restrict features, suspend accounts, or permanently ban users for abuse."
                    />

                    {/* Enforcement */}
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gavel className="h-5 w-5" />
                                Enforcement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">We use a combination of user reports, automated signals, and human review. Actions may include:</p>
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {["Content removal", "Age-gating or distribution limits", "Feature restrictions", "Account warnings or strikes", "Temporary suspension", "Permanent ban"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-sm text-muted-foreground mt-4">
                                We consider severity, context, intent, and real-world harm. A single serious violation can result in immediate action.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Reporting & Updates */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Flag className="h-5 w-5" />
                                    Reporting and Appeals
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground space-y-2">
                                <p>Use the in-app reporting tools to report content, accounts, comments, or messages.</p>
                                <p>If you believe we made a mistake, you may appeal through the support process available in the app/site.</p>
                                <p className="text-destructive/80">Misuse of reporting tools (false reports meant to harass) may lead to enforcement action.</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <RefreshCw className="h-5 w-5" />
                                    Updates
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>We may update these guidelines as Booster evolves. Continued use of Booster means you agree to follow the most current version.</p>
                            </CardContent>
                        </Card>
                    </div>

                </TabsContent>
                
                <TabsContent value="privacy" className="space-y-4">
                    <div className="bg-card rounded-lg p-6 shadow-sm border">
                        <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
                        <p className="text-muted-foreground">
                            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
                        </p>
                        <div className="mt-4 space-y-4 text-muted-foreground">
                            <h3 className="text-lg font-medium text-foreground">Data Collection</h3>
                            <p>We collect information you provide directly to us, such as when you create an account or post content.</p>
                            
                            <h3 className="text-lg font-medium text-foreground">Data Usage</h3>
                            <p>We use your information to provide and improve our services, communicate with you, and ensure safety.</p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

interface GuidelineCardProps {
    number: string;
    title: string;
    description?: string;
    notAllowed?: string[];
    allowed?: string[];
    allowedWithRestrictions?: string[];
    mayBeRestricted?: string[];
    possibleActions?: string[];
    footer?: string;
}

const GuidelineCard = ({ 
    number, 
    title, 
    description, 
    notAllowed, 
    allowed, 
    allowedWithRestrictions,
    mayBeRestricted,
    possibleActions,
    footer 
}: GuidelineCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-start gap-2 text-xl">
                    <span className="text-muted-foreground font-normal">{number}.</span>
                    {title}
                </CardTitle>
                {description && <CardDescription className="text-base pt-2">{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-6">
                {notAllowed && (
                    <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2 text-destructive">
                            <XCircle className="h-4 w-4" />
                            Not allowed
                        </h4>
                        <ul className="space-y-2">
                            {notAllowed.map((item, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive/50 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {allowed && (
                    <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2 text-green-600 dark:text-green-500">
                            <CheckCircle2 className="h-4 w-4" />
                            Allowed
                        </h4>
                        <ul className="space-y-2">
                            {allowed.map((item, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-600/50 dark:bg-green-500/50 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {allowedWithRestrictions && (
                    <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="h-4 w-4" />
                            Allowed with restrictions
                        </h4>
                        <ul className="space-y-2">
                            {allowedWithRestrictions.map((item, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-600/50 dark:bg-amber-500/50 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {mayBeRestricted && (
                    <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="h-4 w-4" />
                            May be restricted
                        </h4>
                        <ul className="space-y-2">
                            {mayBeRestricted.map((item, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-600/50 dark:bg-amber-500/50 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {possibleActions && (
                    <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-500">
                            <Info className="h-4 w-4" />
                            Possible actions
                        </h4>
                        <ul className="space-y-2">
                            {possibleActions.map((item, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600/50 dark:bg-blue-500/50 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {footer && (
                    <div className="pt-4 border-t text-sm text-muted-foreground italic">
                        {footer}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
