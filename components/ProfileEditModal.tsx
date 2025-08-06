"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { X, User, Mail, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

import { useAlertContext } from "@/components/AlertProvider";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProfileEditModal({ isOpen, onClose, onUpdate }: ProfileEditModalProps) {
  const { user } = useUser();

  const { showSuccess, showError } = useAlertContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [imageUrl, setImageUrl] = useState(user?.imageUrl || "");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        setImageUrl(''); // Clear URL input when file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = imageUrl.trim() || undefined;
      
            // If there's an uploaded image, process it first
      if (uploadedImage) {
        console.log("Uploading image to:", "/api/auth/upload-profile-image");
        const uploadResponse = await fetch("/api/auth/upload-profile-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageData: uploadedImage,
          }),
        });

        if (!uploadResponse.ok) {
          let uploadError;
          try {
            uploadError = await uploadResponse.json();
          } catch {
            throw new Error("Failed to upload image. Please try again.");
          }
          throw new Error(uploadError.error || "Failed to upload image");
        }

        let uploadData;
        try {
          uploadData = await uploadResponse.json();
        } catch {
          throw new Error("Failed to process upload response. Please try again.");
        }
        finalImageUrl = uploadData.imageUrl;
      }


      console.log("Sending update request to:", "/api/auth/update-user-profile");
      const response = await fetch("/api/auth/update-user-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          imageUrl: finalImageUrl,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        // If response is not JSON (e.g., HTML error page), throw a generic error
        throw new Error("Server returned an invalid response. Please try again.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      showSuccess("Profile updated successfully!");
      
      // Force a page refresh to update all components including navbar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      onUpdate();
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      const error = err as Error;
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-dark border border-border rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Profile Image
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-accent to-yellow-500 flex items-center justify-center overflow-hidden">
                {uploadedImage ? (
                  <Image
                    src={uploadedImage}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-black" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                {/* File Upload */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-accent/10 hover:bg-yellow-accent/20 text-yellow-accent rounded-lg transition-colors border border-yellow-accent/20 text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadedImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImage(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {/* URL Input */}
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="Or enter image URL"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setUploadedImage(null); // Clear uploaded image when URL is entered
                    }}
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-accent text-sm"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Upload an image file (max 5MB) or provide an image URL
            </p>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-accent"
              placeholder="Enter first name"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-accent"
              placeholder="Enter last name"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Email
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{user?.emailAddresses[0]?.emailAddress}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed for security reasons
            </p>
          </div>



          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-white hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-secondary hover:bg-yellow-accent hover:text-black active:bg-yellow-accent active:text-black text-foreground font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 