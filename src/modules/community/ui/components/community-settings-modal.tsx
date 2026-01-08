"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Shield,
  Image as ImageIcon,
  Lock,
  Globe,
  Save,
  Loader2,
  X,
  Plus,
  AlertCircle,
  AlertCircleIcon,
  LockIcon,
  Globe2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UploadDropzone } from "@/lib/uploadthing";
import { updateCommunitySchema } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

type UpdateFormValues = z.infer<typeof updateCommunitySchema>;

interface CommunitySettingsModalProps {
  communityId: string;
  initialData: {
    name: string;
    description_short?: string | null;
    description_long?: string | null;
    rules?: string | null;
    icon_url?: string | null;
    banner_url?: string | null;
    isPrivate?: boolean;
    allowUserPosts?: boolean;
    categoryId?: string | null;
  };
  moderators: {
    userId: string;
    user: {
      name: string;
      imageUrl: string;
      username?: string | null;
    };
  }[];
}

const SIDEBAR_ITEMS = [
  { id: "general", label: "General", icon: Settings, color: "text-blue-500" },
  { id: "appearance", label: "Appearance", icon: ImageIcon, color: "text-purple-500" },
  { id: "moderators", label: "Moderators", icon: Shield, color: "text-amber-500" },
] as const;

export const CommunitySettingsModal = ({
  communityId,
  initialData,
  moderators,
}: CommunitySettingsModalProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [newModUsername, setNewModUsername] = useState("");
  const utils = trpc.useUtils();
  const { data: categories } = trpc.categories.getMany.useQuery();

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateCommunitySchema),
    defaultValues: {
      name: initialData.name,
      description_short: initialData.description_short || "",
      description_long: initialData.description_long || "",
      rules: initialData.rules || "",
      icon_url: initialData.icon_url || "",
      banner_url: initialData.banner_url || "",
      isPrivate: initialData.isPrivate || false,
      allowUserPosts: initialData.allowUserPosts ?? true,
      categoryId: initialData.categoryId || null,
    },
  });

  const updateMutation = trpc.community.update.useMutation({
    onSuccess: () => {
      toast.success("Community settings updated successfully")
      utils.community.get.invalidate({ id: communityId });
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update settings", { description: error.message });
    },
  });

  const addModeratorMutation = trpc.community.addModerator.useMutation({
    onSuccess: () => {
      toast.success("Moderator added");
      setNewModUsername("");
      utils.community.get.invalidate({ id: communityId });
    },
    onError: (error) => {
      toast.error("Failed to add moderator", {
        description: error.message,
      });
    },
  });

  const removeModeratorMutation = trpc.community.removeModerator.useMutation({
    onSuccess: () => {
      toast.success("Moderator removed", {
        description: "User's moderator privileges have been revoked",
      });
      utils.community.get.invalidate({ id: communityId });
    },
    onError: (error) => {
      toast.error("Failed to remove moderator", {
        description: error.message,
      });
    },
  });

  const onSubmit: SubmitHandler<UpdateFormValues> = (values) => {
    updateMutation.mutate({
      communityId,
      ...values,
    });
  };

  const handleAddModerator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModUsername.trim()) {
      toast.error("Please enter a username");
      return;
    }
    addModeratorMutation.mutate({
      communityId,
      username: newModUsername.trim(),
    });
  };


  const handleRemoveModerator = (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    removeModeratorMutation.mutate({
      communityId,
      userId,
    });
  };

  const isDirty = Object.keys(form.formState.dirtyFields).length > 0;

  // console.log("initialData.is_private:", initialData);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 hover:bg-accent/50 transition-all">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 overflow-hidden border shadow-2xl flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-background to-accent/5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <div className="p-2 bg-primary-gradient/10 rounded-lg">
                  <Settings className="h-5 w-5 text-secondary" />
                </div>
                Community Settings
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your community's appearance, rules, and members
              </p>
            </div>
            <Badge variant="outline" className="font-normal">
              {moderators.length} {moderators.length === 1 ? "Moderator" : "Moderators"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar Navigation */}
          <div className="w-56 border-r bg-gradient-to-b from-background to-accent/5 p-4 space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    activeTab === item.id
                      ? "bg-primary-gradient/10 text-secondary border border-primary/20 shadow-sm"
                      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", item.color)} />
                  <span className="font-medium">{item.label}</span>
                  {activeTab === item.id && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary-gradient animate-pulse" />
                  )}
                </button>
              );
            })}

            <Separator className="my-4" />

            <div className="px-3 py-2 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Community Stats
              </h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant={initialData.isPrivate ? "default" : "outline"}
                    className="text-xs"
                  >
                    {initialData.isPrivate ? (<><LockIcon className="size-4 mr-1" /> Private </>) : <><Globe2 className="size-4 mr-1" /> Public </>}
                  </Badge>
                </div>
                <div className="flex justify-between ">
                  <span className="text-muted-foreground">Video Linking:</span>
                  <Badge
                    variant="outline"
                    className="text-xs text-center p-0"
                  >
                    {initialData.allowUserPosts ? "Members Allowed" : "Moderators Only"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <ScrollArea className="flex-1 p-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="h-full">
                <div className="p-6 space-y-8">
                  {/* General Settings */}
                  {activeTab === "general" && (
                    <div className="space-y-8 animate-in fade-in-50 duration-300">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                            <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          Basic Information
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          Configure your community's identity and guidelines
                        </p>

                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base">Community Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="h-11 text-base"
                                    placeholder="e.g., Tech Enthusiasts United"
                                  />
                                </FormControl>
                                <FormDescription>
                                  This is the public display name for your community
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="description_short"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tagline</FormLabel>
                                  <FormDescription className="mb-2">
                                    Brief description (max 200 chars)
                                  </FormDescription>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      className="h-28 resize-none"
                                      value={field.value ?? ""}
                                      placeholder="What's your community about in one sentence?"
                                    />
                                  </FormControl>
                                  <div className="flex justify-end">
                                    <span className={cn(
                                      "text-xs",
                                      (field.value?.length || 0) > 180
                                        ? "text-amber-600"
                                        : "text-muted-foreground"
                                    )}>
                                      {field.value?.length || 0}/200
                                    </span>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="description_long"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Detailed Description</FormLabel>
                                  <FormDescription className="mb-2">
                                    Full community introduction
                                  </FormDescription>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      className="h-28 resize-none"
                                      value={field.value ?? ""}
                                      placeholder="Tell people what your community is all about..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={
                                    field.value
                                      ? String(field.value)
                                      : undefined
                                  }
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories?.map((category) => (
                                      <SelectItem
                                        key={category.id}
                                        value={category.id}
                                      >
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="rules"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Community Rules</FormLabel>
                                <FormDescription className="mb-2">
                                  Set clear guidelines for member behavior (Markdown supported)
                                </FormDescription>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    className="h-40 resize-none font-mono text-sm"
                                    value={field.value ?? ""}
                                    placeholder="1. Be respectful to all members...
2. No spam or self-promotion...
3. Keep discussions on-topic..."
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                            <Lock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          Privacy & Permissions
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          Control who can see and participate in your community
                        </p>

                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="isPrivate"
                            render={({ field }) => (
                              <FormItem className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1 flex-1">
                                    <FormLabel className="text-base flex items-center gap-2">
                                      <Lock className="h-4 w-4" />
                                      Private Community (Future Implementation)
                                    </FormLabel>
                                    <FormDescription>
                                      When enabled, only approved members can view and participate.
                                      New members require moderator approval. (Future Implementation)
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="scale-125"
                                    />
                                  </FormControl>
                                </div>
                                {field.value && (
                                  <Alert className=" mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 ">
                                      <AlertCircleIcon className="size-4  text-blue-600 dark:text-blue-400" />
                                      <AlertDescription className="text-blue-700 dark:text-blue-300">
                                        Private mode is active. All content is hidden from non-members.
                                      </AlertDescription>
                                    </div>
                                  </Alert>
                                )}
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="allowUserPosts"
                            render={({ field }) => (
                              <FormItem className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1 flex-1">
                                    <FormLabel className="text-base flex items-center gap-2">
                                      <Globe className="h-4 w-4" />
                                      Allow Member Posts
                                    </FormLabel>
                                    <FormDescription>
                                      When disabled, only moderators can create new posts and discussions.
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="scale-125"
                                    />
                                  </FormControl>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Appearance Settings */}
                  {activeTab === "appearance" && (
                    <div className="space-y-8 animate-in fade-in-50 duration-300">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                            <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          Visual Identity
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          Customize how your community looks across the platform
                        </p>

                        <div className="space-y-8">
                          <FormField
                            control={form.control}
                            name="icon_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base">Community Icon</FormLabel>
                                <FormDescription className="mb-4">
                                  Recommended: 256×256px PNG or JPG. This appears next to your community name.
                                </FormDescription>

                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                  <div className="flex-shrink-0">
                                    <div className="relative group">
                                      <Avatar className="h-40 w-40 border-4 border-background shadow-lg">
                                        <AvatarImage
                                          src={field.value || ""}
                                          className="object-cover"
                                        />
                                        <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-primary/5">
                                          {initialData.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      {field.value && (
                                        <button
                                          type="button"
                                          onClick={() => field.onChange("")}
                                          className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex-1 space-y-4">
                                    <div className="rounded-lg border-2 border-dashed bg-muted/30 p-8">
                                      <UploadDropzone
                                        endpoint="communityImageUploader"
                                        onClientUploadComplete={(res) => {
                                          if (res?.[0]) {
                                            field.onChange(res[0].url);
                                            toast.success("Icon uploaded successfully");
                                          }
                                        }}
                                        onUploadError={(error: Error) => {
                                          toast.error("Upload failed", {
                                            description: error.message,
                                          });
                                        }}
                                        config={{
                                          mode: "auto",
                                        }}
                                        className="ut-allowed-content:text-sm ut-label:text-base ut-button:bg-primary-gradient ut-button:text-primary-foreground ut-button:hover:bg-primary-gradient/90"
                                        appearance={{
                                          label: "text-foreground",
                                          allowedContent: "text-muted-foreground",
                                        }}
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="text-center p-3 rounded-lg bg-muted/30">
                                        <div className="text-xs font-medium text-muted-foreground mb-1">
                                          Format
                                        </div>
                                        <div className="font-semibold">PNG, JPG</div>
                                      </div>
                                      <div className="text-center p-3 rounded-lg bg-muted/30">
                                        <div className="text-xs font-medium text-muted-foreground mb-1">
                                          Max Size
                                        </div>
                                        <div className="font-semibold">2MB</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator />

                          <FormField
                            control={form.control}
                            name="banner_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-base">Banner Image</FormLabel>


                                <div className="space-y-6">
                                  <div className="relative rounded-xl border-2 overflow-hidden bg-gradient-to-r from-muted/30 to-muted/10">
                                    {field.value ? (
                                      <>
                                        <img
                                          src={field.value}
                                          alt="Banner preview"
                                          className="w-full aspect-[5/1] object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => field.onChange("")}
                                          className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-lg hover:bg-background transition-colors"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </>
                                    ) : (
                                      <div className="aspect-[5/1] flex flex-col items-center justify-center text-muted-foreground">
                                        <ImageIcon className="h-12 w-12 mb-2 opacity-30" />
                                        <p className="font-medium">No banner image set</p>
                                        <p className="text-sm">Upload a banner to make your community stand out</p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="rounded-lg border-2 border-dashed bg-muted/30 p-8">
                                    <UploadDropzone
                                      endpoint="communityImageUploader"
                                      onClientUploadComplete={(res) => {
                                        if (res?.[0]) {
                                          field.onChange(res[0].url);
                                          toast.success("Banner uploaded successfully");
                                        }
                                      }}
                                      onUploadError={(error: Error) => {
                                        toast.error("Upload failed", {
                                          description: error.message,
                                        });
                                      }}
                                      className="ut-allowed-content:text-sm ut-label:text-base ut-button:bg-primary-gradient ut-button:text-primary-foreground ut-button:hover:bg-primary-gradient/90"
                                      appearance={{
                                        label: "text-foreground",
                                        allowedContent: "text-muted-foreground",
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-center p-3 rounded-lg bg-muted/30">
                                    <div className="text-xs font-medium text-muted-foreground mb-1">
                                      Format
                                    </div>
                                    <div className="font-semibold">PNG, JPG</div>
                                  </div>
                                  <div className="text-center p-3 rounded-lg bg-muted/30">
                                    <div className="text-xs font-medium text-muted-foreground mb-1">
                                      Max Size
                                    </div>
                                    <div className="font-semibold">2MB</div>
                                  </div>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Moderators Settings */}
                  {activeTab === "moderators" && (
                    <div className="space-y-8 animate-in fade-in-50 duration-300">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded">
                            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          Moderator Management
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          Add or remove community moderators. Moderators can manage videos, members, and settings.
                        </p>

                        <div className="space-y-6">
                          <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <h4 className="font-semibold text-lg mb-4">Add New Moderator</h4>
                            <form onSubmit={handleAddModerator} className="flex gap-3">
                              <div className="flex-1">
                                <Input
                                  placeholder="Enter exact username (e.g., sammas24)"
                                  value={newModUsername}
                                  onChange={(e) => setNewModUsername(e.target.value)}
                                  className="h-11"
                                  disabled={addModeratorMutation.isPending}
                                />
                              </div>
                              <Button
                                disabled={addModeratorMutation.isPending || !newModUsername.trim()}
                                className="gap-2"
                                onClick={handleAddModerator}
                              >
                                {addModeratorMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                                Add Moderator
                              </Button>
                            </form>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-lg">Current Moderators</h4>
                              <Badge variant="outline">
                                {moderators.length} {moderators.length === 1 ? "Moderator" : "Moderators"}
                              </Badge>
                            </div>

                            {moderators.length === 0 ? (
                              <div className="text-center py-12 rounded-xl border border-dashed">
                                <Shield className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                                <p className="text-muted-foreground font-medium">
                                  No moderators yet
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Add moderators to help manage your community
                                </p>
                              </div>
                            ) : (
                              <div className="grid gap-3">
                                {moderators.map((mod) => (
                                  <div
                                    key={mod.userId}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors group"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="relative">
                                        <Avatar className="h-10 w-10 border-2 border-background">
                                          <AvatarImage src={mod.user.imageUrl} />
                                          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                                            {mod.user.name.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 p-0.5 bg-amber-500 rounded-full border-2 border-background">
                                          <Shield className="h-3 w-3 text-white" />
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-medium">{mod.user.name}</div>
                                        {mod.user.username && (
                                          <div className="text-sm text-muted-foreground">
                                            @{mod.user.username}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => handleRemoveModerator(e, mod.userId)}
                                      disabled={mod.userId === removeModeratorMutation.variables?.userId && removeModeratorMutation.isPending}
                                    >
                                      {removeModeratorMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Remove"
                                      )}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button - Hidden for moderators tab */}
                {activeTab !== "moderators" && (
                  <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur-sm p-6">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                      <div className="text-sm text-muted-foreground">
                        {isDirty ? (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="h-4 w-4" />
                            You have unsaved changes
                          </div>
                        ) : (
                          "Edit your community settings"
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateMutation.isPending || !isDirty}
                          className="gap-2 min-w-32"
                        >
                          {updateMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};