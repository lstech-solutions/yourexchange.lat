'use client';

import Link from "next/link";
import { memo } from 'react';
import { Button } from "./ui/button";
import UserProfile from "./user-profile";
import { useAuth } from "@/hooks/use-auth";

// Memoize the Navbar to prevent unnecessary re-renders
const Navbar = memo(function Navbar() {
  const { user, loading } = useAuth();

  // Memoize the loading state UI
  const loadingUI = (
    <nav className="w-full border-b border-gray-200 bg-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex gap-4">
          <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </nav>
  );

  // Memoize the authenticated UI
  const authenticatedUI = (
    <>
      <Link
        href="/dashboard"
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <Button>Dashboard</Button>
      </Link>
      <UserProfile />
    </>
  );

  // Memoize the unauthenticated UI
  const unauthenticatedUI = (
    <>
      <Link
        href="/auth"
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        Sign In
      </Link>
      <Link
        href="/auth"
        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
      >
        Get Started
      </Link>
    </>
  );

  if (loading) {
    return loadingUI;
  }

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="text-xl font-bold text-blue-600">
          YourExchange
        </Link>
        <div className="flex gap-4 items-center">
          {user ? authenticatedUI : unauthenticatedUI}
        </div>
      </div>
    </nav>
  );
});

export default Navbar;
