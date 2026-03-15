import { MapPin, Calendar, Heart, MessageCircle, Star } from "lucide-react";
import { Avatar } from "./Avatar";
import { StatusIndicator, type UserStatus } from "./StatusIndicator";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  name: string;
  username: string;
  avatar?: string;
  status: UserStatus;
  statusMessage?: string;
  bio?: string;
  location?: string;
  joinDate?: string;
  friendsCount?: number;
  isOwnProfile?: boolean;
  className?: string;
}

export function ProfileCard({
  name,
  username,
  avatar,
  status,
  statusMessage,
  bio = "Living my best nostalgic life ✨",
  location = "San Francisco, CA",
  joinDate = "January 2024",
  friendsCount = 42,
  isOwnProfile = false,
  className,
}: ProfileCardProps) {
  return (
    <div className={cn("nostalgia-card p-6", className)}>
      {/* Header with gradient banner */}
      <div className="relative -mx-6 -mt-6 mb-12 h-24 rounded-t-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
      </div>

      {/* Avatar */}
      <div className="absolute left-1/2 -translate-x-1/2 top-16">
        <div className="relative">
          <Avatar
            src={avatar}
            name={name}
            status={status}
            size="xl"
            className="ring-4 ring-card"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="text-center mt-4">
        <h2 className="font-display font-bold text-xl">{name}</h2>
        <p className="text-sm text-muted-foreground">@{username}</p>
        
        {/* Status */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <StatusIndicator status={status} size="sm" />
          <span className="text-xs text-muted-foreground capitalize">{status}</span>
        </div>
        
        {statusMessage && (
          <p className="text-sm text-muted-foreground italic mt-1">
            "{statusMessage}"
          </p>
        )}
      </div>

      {/* Bio */}
      <p className="text-sm text-center mt-4 text-foreground/80">{bio}</p>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 mt-4 py-4 border-y border-border">
        <div className="text-center">
          <p className="font-display font-bold text-lg text-primary">{friendsCount}</p>
          <p className="text-xs text-muted-foreground">Friends</p>
        </div>
        <div className="text-center">
          <p className="font-display font-bold text-lg text-accent">128</p>
          <p className="text-xs text-muted-foreground">Posts</p>
        </div>
        <div className="text-center">
          <p className="font-display font-bold text-lg text-online">12</p>
          <p className="text-xs text-muted-foreground">Groups</p>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Joined {joinDate}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        {isOwnProfile ? (
          <Button variant="outline" className="flex-1">
            Edit Profile
          </Button>
        ) : (
          <>
            <Button variant="msn" className="flex-1">
              <MessageCircle className="w-4 h-4" />
              Message
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Star className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
