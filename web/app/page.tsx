"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-12 py-16 px-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M3 8h18M8 3v5M16 3v5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="14" r="2" fill="currentColor" />
            </svg>
            <span className="text-2xl font-bold">
              One Big Beautiful Browser
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="w-full max-w-3xl">
          <CardBody className="gap-8 py-12 px-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI-Powered Browser Automation
              </h1>
              <p className="text-lg text-default-600 max-w-2xl leading-relaxed">
                Transform how you interact with websites. Our AI agent
                understands natural language commands and handles complex web
                interactions automatically—clicking, filling forms, navigating
                pages, and managing multiple tabs with intelligent context
                awareness.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Button
                  as={Link}
                  href="/login"
                  color="primary"
                  size="lg"
                  className="px-8"
                >
                  Sign In
                </Button>
                <Button
                  as={Link}
                  href="/signup"
                  variant="bordered"
                  size="lg"
                  className="px-8"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <Card>
            <CardBody className="gap-2 p-6">
              <h3 className="text-lg font-semibold">Natural Language</h3>
              <p className="text-sm text-default-600">
                Control your browser with simple, everyday language commands
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="gap-2 p-6">
              <h3 className="text-lg font-semibold">Smart Automation</h3>
              <p className="text-sm text-default-600">
                Automate repetitive tasks and workflows intelligently
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="gap-2 p-6">
              <h3 className="text-lg font-semibold">Context Aware</h3>
              <p className="text-sm text-default-600">
                AI understands page context and adapts to different websites
              </p>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
