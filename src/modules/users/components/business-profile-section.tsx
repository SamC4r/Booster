"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/trpc/client";
import { UploadDropzone } from "@/lib/uploadthing";
import { Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface BusinessProfileSectionProps {
  userId: string;
  isOwnProfile: boolean;
  businessDescription: string | null;
  businessImageUrls: string[] | null;
}

export const BusinessProfileSection = ({
  userId,
  isOwnProfile,
  businessDescription,
  businessImageUrls,
}: BusinessProfileSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(businessDescription || "");
  const [images, setImages] = useState<string[]>(businessImageUrls || []);

  const utils = trpc.useUtils();
  const updateProfile = trpc.users.updateBusinessProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setIsEditing(false);
      utils.users.getByUserId.invalidate({ userId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    updateProfile.mutate({
      businessDescription: description,
      businessImageUrls: images,
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          About the Company
        </h2>
        {isOwnProfile && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="w-4 h-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Business Profile</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Company Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us about your company..."
                    maxLength={5000}
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gallery Images (Max 5)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {images.map((url, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                        <Image
                          src={url}
                          alt={`Gallery image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {images.length < 5 && (
                    <div className="border-2 border-dashed border-border rounded-lg p-4">
                      <UploadDropzone
                        endpoint="businessImageUploader"
                        onClientUploadComplete={(res) => {
                          if (res) {
                            const newUrls = res.map(file => file.url);
                            setImages([...images, ...newUrls]);
                            toast.success("Images uploaded");
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast.error(`Upload failed: ${error.message}`);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap text-muted-foreground">
          {businessDescription || "No description provided yet."}
        </p>
      </div>

      {businessImageUrls && businessImageUrls.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Gallery</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {businessImageUrls.map((url, index) => (
              <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted/30">
                <Image
                  src={url}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
